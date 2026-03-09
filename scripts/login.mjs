#!/usr/bin/env node
/**
 * Quick-login script for local development.
 *
 * Usage:  node scripts/login.mjs
 *
 * Generates a magic link via the admin API, verifies it server-side,
 * and opens the app in a browser with the session tokens in the URL hash
 * so Supabase JS picks them up automatically.
 */
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { exec } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load backend .env
const envPath = resolve(__dirname, "../backend/.env");
const env = Object.fromEntries(
  readFileSync(envPath, "utf-8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => l.split("=").map((s) => s.trim()))
    .map(([k, ...v]) => [k, v.join("=")])
);

const SUPABASE_URL = env.SUPABASE_URL;
const ANON_KEY = env.SUPABASE_ANON_KEY;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const EMAIL = process.argv[2] || "benei.eifion.jones@gmail.com";
const APP_URL = process.argv[3] || "http://localhost:8083";

async function main() {
  console.log(`Logging in as ${EMAIL}...`);

  // 1. Generate magic link (admin API)
  const linkRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/generate_link`, {
    method: "POST",
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "magiclink",
      email: EMAIL,
      options: { redirect_to: APP_URL },
    }),
  });

  if (!linkRes.ok) {
    console.error("Failed to generate link:", await linkRes.text());
    process.exit(1);
  }

  const linkData = await linkRes.json();
  const otp = linkData.email_otp;

  if (!otp) {
    console.error("No OTP in response:", JSON.stringify(linkData, null, 2));
    process.exit(1);
  }

  // 2. Verify OTP to get session tokens
  const verifyRes = await fetch(`${SUPABASE_URL}/auth/v1/verify`, {
    method: "POST",
    headers: {
      apikey: ANON_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "magiclink",
      token: otp,
      email: EMAIL,
    }),
  });

  if (!verifyRes.ok) {
    console.error("Failed to verify OTP:", await verifyRes.text());
    process.exit(1);
  }

  const session = await verifyRes.json();

  if (!session.access_token) {
    console.error("No access_token in response:", JSON.stringify(session, null, 2));
    process.exit(1);
  }

  // 3. Build URL with hash params (Supabase JS detectSessionInUrl will pick these up)
  const hashParams = new URLSearchParams({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    token_type: "bearer",
    expires_in: "3600",
    type: "magiclink",
  });

  const loginUrl = `${APP_URL}/#${hashParams.toString()}`;

  console.log(`\nSession created! Opening browser...\n`);

  // 4. Open in default browser
  const cmd =
    process.platform === "darwin"
      ? `open "${loginUrl}"`
      : process.platform === "win32"
        ? `start "${loginUrl}"`
        : `xdg-open "${loginUrl}"`;

  exec(cmd, (err) => {
    if (err) {
      console.log("Could not open browser. Visit this URL manually:\n");
      console.log(loginUrl);
    } else {
      console.log("Browser opened. You should be logged in.");
    }
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
