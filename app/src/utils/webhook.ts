import { getRandomBytes } from "expo-crypto";

/**
 * Generates a cryptographically strong webhook token.
 * 32 bytes = 64 hex characters of entropy.
 */
export function generateWebhookToken(): string {
  const bytes = getRandomBytes(32);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
