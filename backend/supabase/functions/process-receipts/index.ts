import { createClient } from "jsr:@supabase/supabase-js@2";

const EXPO_RECEIPTS_URL = "https://exp.host/--/api/v2/push/getReceipts";
const BATCH_SIZE = 300; // Expo recommends max 300 per request
const MAX_TICKET_AGE_HOURS = 72;

interface ExpoReceipt {
  status: "ok" | "error";
  message?: string;
  details?: { error?: string };
}

interface PushTicketRow {
  id: string;
  ticket_id: string;
  expo_push_token: string;
}

Deno.serve(async (req) => {
  // Only allow POST (from pg_cron/internal calls)
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Verify service role authorization
  const authHeader = req.headers.get("Authorization");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!authHeader?.startsWith("Bearer ") || (serviceRoleKey && authHeader.substring(7) !== serviceRoleKey)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch pending tickets older than 15 minutes (Expo needs time to process)
    // but younger than 72 hours (Expo discards receipts after 24h, we keep a margin)
    const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const maxAge = new Date(
      Date.now() - MAX_TICKET_AGE_HOURS * 60 * 60 * 1000
    ).toISOString();

    const { data: pendingTickets, error: fetchError } = await supabase
      .from("push_tickets")
      .select("id, ticket_id, expo_push_token")
      .eq("status", "pending")
      .lt("created_at", fifteenMinAgo)
      .gt("created_at", maxAge)
      .order("created_at", { ascending: true })
      .limit(1000);

    if (fetchError) {
      console.error("Failed to fetch pending tickets:", fetchError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch tickets" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!pendingTickets || pendingTickets.length === 0) {
      return new Response(
        JSON.stringify({ processed: 0, deleted: 0, expired: 0 }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Build lookup: ticket_id -> row
    const ticketMap = new Map<string, PushTicketRow>();
    for (const row of pendingTickets) {
      ticketMap.set(row.ticket_id, row);
    }

    let totalProcessed = 0;
    let totalDeleted = 0;
    const tokensToDelete = new Set<string>();

    // Process in batches of 300
    const ticketIds = Array.from(ticketMap.keys());
    for (let i = 0; i < ticketIds.length; i += BATCH_SIZE) {
      const batch = ticketIds.slice(i, i + BATCH_SIZE);

      const receiptRes = await fetch(EXPO_RECEIPTS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ ids: batch }),
      });

      if (!receiptRes.ok) {
        console.error(
          `Expo receipts API error: ${receiptRes.status} ${receiptRes.statusText}`
        );
        continue;
      }

      const { data: receipts } = (await receiptRes.json()) as {
        data: Record<string, ExpoReceipt>;
      };

      if (!receipts) continue;

      const okIds: string[] = [];
      const errorUpdates: {
        rowId: string;
        errorType: string;
        errorMessage: string;
      }[] = [];

      for (const [ticketId, receipt] of Object.entries(receipts)) {
        const row = ticketMap.get(ticketId);
        if (!row) continue;

        if (receipt.status === "ok") {
          okIds.push(row.id);
        } else {
          const errorType = receipt.details?.error ?? "unknown";
          const errorMessage = receipt.message ?? "";

          errorUpdates.push({
            rowId: row.id,
            errorType,
            errorMessage,
          });

          // Mark token for deletion on DeviceNotRegistered
          if (errorType === "DeviceNotRegistered") {
            tokensToDelete.add(row.expo_push_token);
          }
        }
      }

      // Batch update: mark successful tickets
      if (okIds.length > 0) {
        const { error: okError } = await supabase
          .from("push_tickets")
          .update({ status: "ok", processed_at: new Date().toISOString() })
          .in("id", okIds);

        if (okError) {
          console.error("Failed to update ok tickets:", okError);
        }
        totalProcessed += okIds.length;
      }

      // Update error tickets individually (each has different error details)
      for (const { rowId, errorType, errorMessage } of errorUpdates) {
        const { error: errError } = await supabase
          .from("push_tickets")
          .update({
            status: "error",
            error_type: errorType,
            error_message: errorMessage,
            processed_at: new Date().toISOString(),
          })
          .eq("id", rowId);

        if (errError) {
          console.error(`Failed to update error ticket ${rowId}:`, errError);
        }
        totalProcessed += 1;
      }
    }

    // Delete stale device tokens
    if (tokensToDelete.size > 0) {
      const tokens = Array.from(tokensToDelete);
      const { error: deleteError, count } = await supabase
        .from("devices")
        .delete()
        .in("expo_push_token", tokens);

      if (deleteError) {
        console.error("Failed to delete stale devices:", deleteError);
      } else {
        totalDeleted = count ?? tokens.length;
        console.log(`Deleted ${totalDeleted} stale device tokens: ${tokens.join(", ")}`);
      }
    }

    // Expire very old pending tickets that Expo never returned receipts for
    const { count: expiredCount, error: expireError } = await supabase
      .from("push_tickets")
      .update(
        {
          status: "error",
          error_type: "expired",
          error_message: "Receipt not available from Expo after 72h",
          processed_at: new Date().toISOString(),
        },
        { count: "exact" }
      )
      .eq("status", "pending")
      .lt("created_at", maxAge);

    if (expireError) {
      console.error("Failed to expire old tickets:", expireError);
    }

    const result = {
      processed: totalProcessed,
      deleted: totalDeleted,
      expired: expiredCount ?? 0,
    };

    console.log("Receipt processing complete:", result);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
