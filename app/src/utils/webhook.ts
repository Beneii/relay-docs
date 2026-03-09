import { getRandomBytes } from "expo-crypto";
import { WEBHOOK_TOKEN_BYTES, bytesToHex } from "@shared/webhook";

/**
 * Generates a cryptographically strong webhook token.
 * 32 bytes = 64 hex characters of entropy.
 */
export function generateWebhookToken(): string {
  return bytesToHex(getRandomBytes(WEBHOOK_TOKEN_BYTES));
}
