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
