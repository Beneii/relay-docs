import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

function jsonResponse(
  payload: Record<string, unknown>,
  status: number
) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: corsHeaders,
  });
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  const allowedOrigins = ["https://relayapp.dev", "relay://"];
  const isAllowedOrigin = origin && allowedOrigins.some(o => origin.startsWith(o));

  const currentCorsHeaders = {
    ...corsHeaders,
    "Access-Control-Allow-Origin": isAllowedOrigin ? origin : "https://relayapp.dev",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: currentCorsHeaders });
  }

  const respond = (payload: Record<string, unknown>, status: number) => {
    return new Response(JSON.stringify(payload), {
      status,
      headers: currentCorsHeaders,
    });
  };

  if (req.method !== "POST") {
    return respond({ error: "Method not allowed" }, 405);
  }

  let body: { confirmation?: string };

  try {
    body = await req.json();
  } catch {
    return respond({ error: "Invalid JSON body" }, 400);
  }

  if (body?.confirmation !== "DELETE MY ACCOUNT") {
    return respond(
      { error: "confirmation must be set to 'DELETE MY ACCOUNT'" },
      400
    );
  }

  // Authenticate the user via their JWT
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return respond({ error: "Missing authorization" }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");

  // Verify the user's identity with their JWT
  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
    error: authError,
  } = await userClient.auth.getUser();

  if (authError || !user) {
    return respond({ error: "Invalid or expired token" }, 401);
  }

  const userId = user.id;

  // Use service role for all destructive operations
  const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Step 1: Fetch the profile to get stripe_customer_id before we delete anything
    const { data: profile, error: profileError } = await serviceClient
      .from("profiles")
      .select("stripe_customer_id, plan, email")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      console.error("Profile lookup failed:", profileError);
      return respond({ error: "Account not found" }, 404);
    }

    // Step 2: Cancel Stripe subscription if one exists
    if (profile.stripe_customer_id && stripeSecretKey) {
      try {
        // List active subscriptions for this customer
        const listRes = await fetch(
          `https://api.stripe.com/v1/customers/${encodeURIComponent(profile.stripe_customer_id)}/subscriptions?status=active&limit=100`,
          {
            headers: {
              Authorization: `Bearer ${stripeSecretKey}`,
            },
          }
        );

        if (listRes.ok) {
          const { data: subscriptions } = await listRes.json();

          // Cancel each active subscription immediately
          for (const sub of subscriptions ?? []) {
            const cancelRes = await fetch(
              `https://api.stripe.com/v1/subscriptions/${sub.id}`,
              {
                method: "DELETE",
                headers: {
                  Authorization: `Bearer ${stripeSecretKey}`,
                },
              }
            );

            if (!cancelRes.ok) {
              const err = await cancelRes.text();
              console.error(`Failed to cancel subscription ${sub.id}:`, err);
              // Continue — don't block deletion on a Stripe failure
            } else {
              console.log(`Cancelled subscription ${sub.id} for user ${userId}`);
            }
          }
        } else {
          const err = await listRes.text();
          console.error("Failed to list Stripe subscriptions:", err);
          // Continue — don't block deletion
        }

        // Delete the Stripe customer to clean up payment methods and invoices
        const deleteCustomerRes = await fetch(
          `https://api.stripe.com/v1/customers/${encodeURIComponent(profile.stripe_customer_id)}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${stripeSecretKey}`,
            },
          }
        );

        if (!deleteCustomerRes.ok) {
          const err = await deleteCustomerRes.text();
          console.error("Failed to delete Stripe customer:", err);
          // Continue — customer can be cleaned up manually
        } else {
          console.log(`Deleted Stripe customer ${profile.stripe_customer_id}`);
        }
      } catch (stripeErr) {
        console.error("Stripe cleanup error:", stripeErr);
        // Continue — don't block account deletion on Stripe errors
      }
    }

    // Step 3: Delete the auth user
    // This cascades through the DB:
    //   auth.users DELETE -> profiles (ON DELETE CASCADE)
    //     -> apps (ON DELETE CASCADE from profiles)
    //       -> notifications (ON DELETE CASCADE from apps)
    //         -> push_tickets (ON DELETE CASCADE from notifications)
    //     -> devices (ON DELETE CASCADE from profiles)
    //     -> notifications (ON DELETE CASCADE from profiles)
    //
    // We rely on the FK cascades rather than manual deletes to ensure
    // atomicity — either everything is deleted or nothing is.
    const { error: deleteError } = await serviceClient.auth.admin.deleteUser(
      userId
    );

    if (deleteError) {
      console.error("Failed to delete auth user:", deleteError);
      return jsonResponse(
        { error: "Failed to delete account. Please try again or contact support." },
        500
      );
    }

    console.log(`Account deleted: ${userId} (${profile.email})`);

    return jsonResponse({ success: true }, 200);
  } catch (err) {
    console.error("Unexpected error during account deletion:", err);
    return jsonResponse(
      { error: "Internal server error" },
      500
    );
  }
});
