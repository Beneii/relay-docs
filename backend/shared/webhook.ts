export const WEBHOOK_TOKEN_BYTES = 32;

export function bytesToHex(bytes: ArrayLike<number>): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
