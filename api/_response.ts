import type { VercelResponse } from "@vercel/node";

export function jsonOk(
  res: VercelResponse,
  data?: Record<string, unknown>,
  status = 200,
) {
  return res.status(status).json({ ok: true, ...data });
}

export function jsonError(
  res: VercelResponse,
  status: number,
  message: string,
) {
  return res.status(status).json({ ok: false, error: message });
}
