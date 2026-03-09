import { Resend } from 'resend';

function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

const resend = new Resend(requireEnv('RESEND_API_KEY'));

const FROM_EMAIL = process.env.EMAIL_FROM || 'Relay <hello@relayapp.dev>';

// ── Light mode (default) / Dark mode colors ─────────────────────
const L = {
  bg: '#fafafa',
  surface: '#ffffff',
  border: '#e4e4e7',
  text: '#18181b',
  muted: '#71717a',
  accent: '#10B981',
  green: '#16a34a',
  red: '#dc2626',
  footerText: '#a1a1aa',
};

const D = {
  bg: '#09090b',
  surface: '#111113',
  border: '#27272a',
  text: '#fafafa',
  muted: '#a1a1aa',
  accent: '#34d399',
  green: '#22c55e',
  red: '#ef4444',
  footerText: '#52525b',
};

// Relay icon PNGs for emails — dark on light, white on dark
const LOGO_DARK_URL = 'https://relayapp.dev/logo-dark.png';
const LOGO_WHITE_URL = 'https://relayapp.dev/logo-white.png';

// ── Layout wrapper with dark mode support ────────────────────────
function layout(content: string): string {
  return `
<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <style>
    :root { color-scheme: light dark; }
    @media (prefers-color-scheme: dark) {
      .email-bg { background-color: ${D.bg} !important; }
      .email-surface { background-color: ${D.surface} !important; border-color: ${D.border} !important; }
      .email-text { color: ${D.text} !important; }
      .email-muted { color: ${D.muted} !important; }
      .email-border { border-color: ${D.border} !important; }
      .email-footer { color: ${D.footerText} !important; }
      .email-step-text { color: ${D.text} !important; }
      .email-check-text { color: ${D.text} !important; }
      .email-list-text { color: ${D.muted} !important; }
      .email-accent-link { color: ${D.accent} !important; }
      .email-strong { color: ${D.text} !important; }
      .logo-light { display: none !important; }
      .logo-dark { display: block !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${L.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;" class="email-bg">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:${L.bg};padding:40px 20px;" class="email-bg">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
        <!-- Logo: dark icon for light mode, white icon for dark mode -->
        <tr><td align="center" style="padding-bottom:32px;">
          <img class="logo-light" src="${LOGO_DARK_URL}" alt="Relay" width="48" height="48" style="display:block;width:48px;height:48px;" />
          <img class="logo-dark" src="${LOGO_WHITE_URL}" alt="Relay" width="48" height="48" style="display:none;width:48px;height:48px;" />
        </td></tr>
        <!-- Content card -->
        <tr><td class="email-surface" style="background-color:${L.surface};border:1px solid ${L.border};border-radius:12px;padding:40px;">
          ${content}
        </td></tr>
        <!-- Footer -->
        <tr><td align="center" style="padding-top:24px;">
          <p class="email-footer" style="margin:0;font-size:13px;color:${L.footerText};line-height:1.5;">
            <a href="https://relayapp.dev" class="email-footer" style="color:${L.footerText};text-decoration:none;">Relay</a> — Real-time webhook notifications
          </p>
          <p class="email-footer" style="margin:8px 0 0;font-size:12px;color:${L.footerText};">
            You're receiving this because you have a Relay account.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Helpers ───────────────────────────────────────────────────────
function heading(text: string): string {
  return `<h1 class="email-text" style="margin:0 0 16px;font-size:22px;font-weight:700;color:${L.text};line-height:1.3;">${text}</h1>`;
}

function paragraph(text: string): string {
  return `<p class="email-muted" style="margin:0 0 16px;font-size:15px;color:${L.muted};line-height:1.6;">${text}</p>`;
}

function button(label: string, href: string, color = L.accent): string {
  return `
  <table cellpadding="0" cellspacing="0" style="margin:24px 0;"><tr><td>
    <a href="${href}" style="display:inline-block;background-color:${color};color:#fff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 28px;border-radius:8px;">
      ${label}
    </a>
  </td></tr></table>`;
}

function divider(): string {
  return `<hr class="email-border" style="border:none;border-top:1px solid ${L.border};margin:24px 0;">`;
}

function planBadge(plan: string): string {
  const isPro = plan === 'pro';
  const bg = isPro ? L.accent : L.border;
  return `<span style="display:inline-block;background-color:${bg};color:#fff;font-size:12px;font-weight:600;padding:4px 12px;border-radius:99px;text-transform:uppercase;letter-spacing:0.5px;">${plan}</span>`;
}

// ── Email templates ──────────────────────────────────────────────

export async function sendWelcomeEmail(to: string) {
  const html = layout(`
    ${heading('Welcome to Relay')}
    ${paragraph('Your account is set up and ready to go. Relay delivers real-time webhook notifications straight to your phone — no more checking dashboards.')}
    ${paragraph("Here's how to get started:")}
    <table cellpadding="0" cellspacing="0" style="margin:0 0 16px;width:100%;">
      <tr>
        <td class="email-border" style="padding:12px 0;border-bottom:1px solid ${L.border};">
          <span style="display:inline-block;background-color:${L.accent};color:#fff;width:24px;height:24px;border-radius:50%;text-align:center;line-height:24px;font-size:13px;font-weight:700;margin-right:12px;">1</span>
          <span class="email-step-text" style="color:${L.text};font-size:14px;">Create a dashboard and grab your webhook URL</span>
        </td>
      </tr>
      <tr>
        <td class="email-border" style="padding:12px 0;border-bottom:1px solid ${L.border};">
          <span style="display:inline-block;background-color:${L.accent};color:#fff;width:24px;height:24px;border-radius:50%;text-align:center;line-height:24px;font-size:13px;font-weight:700;margin-right:12px;">2</span>
          <span class="email-step-text" style="color:${L.text};font-size:14px;">Paste it into Stripe, GitHub, or any service</span>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 0;">
          <span style="display:inline-block;background-color:${L.accent};color:#fff;width:24px;height:24px;border-radius:50%;text-align:center;line-height:24px;font-size:13px;font-weight:700;margin-right:12px;">3</span>
          <span class="email-step-text" style="color:${L.text};font-size:14px;">Get instant push notifications on your phone</span>
        </td>
      </tr>
    </table>
    ${button('Go to Dashboard', 'https://relayapp.dev/dashboard')}
    ${paragraph("You're on the <strong class=\"email-strong\" style=\"color:" + L.text + ";\">Free</strong> plan. Upgrade anytime for unlimited dashboards and 10,000 notifications/month.")}
  `);

  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: 'Welcome to Relay',
    html,
    text: 'Welcome to Relay! Your account is set up. Go to https://relayapp.dev/dashboard to create your first webhook dashboard.',
  });
}

export async function sendProUpgradeEmail(to: string) {
  const html = layout(`
    ${heading('You\'re on Pro!')}
    ${paragraph('Your upgrade to Relay Pro is confirmed. Here\'s what you just unlocked:')}
    <table cellpadding="0" cellspacing="0" style="margin:0 0 20px;width:100%;">
      <tr>
        <td class="email-check-text" style="padding:8px 0;color:${L.text};font-size:14px;">
          <span style="color:${L.green};margin-right:8px;">✓</span> Unlimited dashboards
        </td>
      </tr>
      <tr>
        <td class="email-check-text" style="padding:8px 0;color:${L.text};font-size:14px;">
          <span style="color:${L.green};margin-right:8px;">✓</span> Unlimited devices
        </td>
      </tr>
      <tr>
        <td class="email-check-text" style="padding:8px 0;color:${L.text};font-size:14px;">
          <span style="color:${L.green};margin-right:8px;">✓</span> 10,000 notifications/month
        </td>
      </tr>
      <tr>
        <td class="email-check-text" style="padding:8px 0;color:${L.text};font-size:14px;">
          <span style="color:${L.green};margin-right:8px;">✓</span> Priority support
        </td>
      </tr>
    </table>
    ${divider()}
    ${paragraph('Your plan: ' + planBadge('pro'))}
    ${paragraph('Your Pro plan is now active. You can manage your subscription anytime from the dashboard.')}
    ${button('Go to Dashboard', 'https://relayapp.dev/dashboard')}
  `);

  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: 'Welcome to Relay Pro',
    html,
    text: 'Your upgrade to Relay Pro is confirmed! You now have unlimited dashboards, unlimited devices, and 10,000 notifications/month. Manage your subscription at https://relayapp.dev/dashboard',
  });
}

export async function sendSubscriptionCancelledEmail(to: string) {
  const html = layout(`
    ${heading('Your Pro subscription has ended')}
    ${paragraph('Your Relay Pro subscription has been cancelled. Your account has been moved back to the Free plan.')}
    ${divider()}
    ${paragraph('Your plan: ' + planBadge('free'))}
    <table cellpadding="0" cellspacing="0" style="margin:0 0 20px;width:100%;">
      <tr>
        <td class="email-list-text" style="padding:8px 0;color:${L.muted};font-size:14px;">
          <span style="margin-right:8px;">•</span> 3 dashboards
        </td>
      </tr>
      <tr>
        <td class="email-list-text" style="padding:8px 0;color:${L.muted};font-size:14px;">
          <span style="margin-right:8px;">•</span> 1 device
        </td>
      </tr>
      <tr>
        <td class="email-list-text" style="padding:8px 0;color:${L.muted};font-size:14px;">
          <span style="margin-right:8px;">•</span> 100 notifications/month
        </td>
      </tr>
    </table>
    ${paragraph('If you had more than 3 dashboards, your extra dashboards are still saved — they\'ll be available again if you resubscribe.')}
    ${button('Resubscribe to Pro', 'https://relayapp.dev/pricing')}
    ${paragraph('We\'d love to have you back. If anything wasn\'t working for you, just reply to this email.')}
  `);

  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: 'Your Relay Pro subscription has ended',
    html,
    text: 'Your Relay Pro subscription has been cancelled and your account has been moved to the Free plan. Resubscribe anytime at https://relayapp.dev/pricing',
  });
}

export async function sendPaymentFailedEmail(to: string) {
  const html = layout(`
    ${heading('Payment failed — action needed')}
    ${paragraph('We couldn\'t process your latest payment for Relay Pro. This usually happens when a card expires or has insufficient funds.')}
    ${paragraph('Please update your payment method to keep your Pro features active. If we can\'t collect payment after a few retries, your account will be downgraded to Free.')}
    ${button('Update Payment Method', 'https://relayapp.dev/dashboard', L.red)}
    ${divider()}
    ${paragraph('If you think this is a mistake or need help, just reply to this email.')}
  `);

  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: 'Payment failed for Relay Pro',
    html,
    text: 'We couldn\'t process your latest payment for Relay Pro. Please update your payment method at https://relayapp.dev/dashboard to keep your Pro features.',
  });
}
