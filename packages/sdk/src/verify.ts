const encoder = new TextEncoder();

async function computeSignature(token: string, payload: string): Promise<string> {
  if (!globalThis.crypto?.subtle) {
    throw new Error("Web Crypto API is not available in this environment");
  }

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(token),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  const signatureHex = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `sha256=${signatureHex}`;
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i += 1) {
    const codeA = a.charCodeAt(i);
    const codeB = b.charCodeAt(i);
    result |= codeA ^ codeB;
  }
  return result === 0;
}

export async function verifySignature(
  body: string,
  signature: string,
  webhookToken: string,
  notificationId: string
): Promise<boolean> {
  if (
    typeof body !== "string" ||
    typeof signature !== "string" ||
    typeof webhookToken !== "string" ||
    typeof notificationId !== "string"
  ) {
    return false;
  }
  if (!signature.startsWith("sha256=")) {
    return false;
  }
  const callbackToken = await computeSignature(webhookToken, notificationId);
  const expected = await computeSignature(callbackToken, body);
  return timingSafeEqual(signature, expected);
}
