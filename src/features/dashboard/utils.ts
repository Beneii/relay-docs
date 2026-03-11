import { WEBHOOK_TOKEN_BYTES, bytesToHex } from "@shared/webhook";

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function generateWebhookToken(): string {
  const cryptoApi = globalThis.crypto;

  if (!cryptoApi?.getRandomValues) {
    throw new Error("Secure token generation is unavailable in this browser.");
  }

  const bytes = new Uint8Array(WEBHOOK_TOKEN_BYTES);
  cryptoApi.getRandomValues(bytes);

  return bytesToHex(bytes);
}

export async function sendDashboardNotification(
  accessToken: string,
  payload: Record<string, unknown>
) {
  const response = await fetch("/api/send-notification", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      typeof data.error === "string"
        ? data.error
        : `Request failed (${response.status})`
    );
  }

  return data;
}
