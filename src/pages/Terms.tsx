import { Link } from 'react-router-dom';
import { FREE_LIMITS, PRO_LIMITS } from '@shared/product';
import { RelayIcon } from '../components/RelayLogo';
import { ThemeToggle } from '../components/ThemeToggle';

export default function Terms() {
  return (
    <div className="min-h-screen bg-bg text-text-main font-sans">
      <nav className="sticky top-0 z-50 border-b border-border bg-bg/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <RelayIcon size={24} className="text-text-main" />
            <span className="font-semibold tracking-tight">Relay</span>
          </Link>
          <ThemeToggle />
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold tracking-tight mb-2">Terms of Service</h1>
        <p className="text-text-muted mb-12">Last updated: March 9, 2026</p>

        <div className="space-y-8 text-text-muted leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-text-main mb-3">1. Acceptance of Terms</h2>
            <p>By accessing or using Relay ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the Service.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-main mb-3">2. Description of Service</h2>
            <p>Relay allows you to save web dashboards as native apps and receive real-time push notifications via webhooks. The Service is available in Free and Pro tiers with different feature limits.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-main mb-3">3. Account Registration</h2>
            <p>You must provide accurate information when creating an account. You are responsible for maintaining the security of your account credentials and for all activity under your account.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-main mb-3">4. Free and Pro Plans</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Free Plan:</strong> {FREE_LIMITS.dashboards} dashboards, {FREE_LIMITS.devices} device, {FREE_LIMITS.notificationsPerMonth} notifications per month</li>
              <li><strong>Pro Plan:</strong> Unlimited dashboards, up to {PRO_LIMITS.devices} devices, {PRO_LIMITS.notificationsPerMonth.toLocaleString()} notifications per month, and priority support. Additional features such as notification history and metadata events are planned and will be announced as they become available.</li>
            </ul>
            <p className="mt-3">We reserve the right to modify plan features and pricing with reasonable notice.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-main mb-3">5. Payment and Billing</h2>
            <p>Pro subscriptions are billed monthly or annually through Stripe. You can cancel at any time through the billing portal. Upon cancellation, you retain Pro access until the end of your current billing period, after which your account reverts to the Free plan.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-main mb-3">6. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Use the Service for any unlawful purpose</li>
              <li>Abuse the webhook or notification systems (e.g., spam, flooding)</li>
              <li>Attempt to gain unauthorized access to other users' accounts or data</li>
              <li>Reverse-engineer, decompile, or disassemble any part of the Service</li>
              <li>Resell or redistribute the Service without permission</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-main mb-3">7. Intellectual Property</h2>
            <p>The Service, including its design, code, and branding, is owned by Relay. You retain ownership of any content you create or submit through the Service.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-main mb-3">8. Limitation of Liability</h2>
            <p>The Service is provided "as is" without warranties of any kind. Relay is not liable for any indirect, incidental, or consequential damages arising from your use of the Service. Our total liability is limited to the amount you paid us in the 12 months preceding the claim.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-main mb-3">9. Termination</h2>
            <p>We may suspend or terminate your account if you violate these terms. You may delete your account at any time by contacting <a href="mailto:hello@relayapp.dev" className="text-accent hover:underline">hello@relayapp.dev</a>.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-main mb-3">10. Changes to Terms</h2>
            <p>We may update these terms from time to time. Continued use of the Service after changes constitutes acceptance of the updated terms.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-main mb-3">11. Contact</h2>
            <p>Questions about these terms? Contact us at <a href="mailto:hello@relayapp.dev" className="text-accent hover:underline">hello@relayapp.dev</a>.</p>
          </section>
        </div>
      </main>

      <footer className="border-t border-border mt-12">
        <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <RelayIcon size={18} className="text-text-muted" />
            <span className="text-text-muted text-sm">&copy; {new Date().getFullYear()} Relay</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-text-muted">
            <Link to="/" className="hover:text-text-main transition-colors">Home</Link>
            <Link to="/privacy" className="hover:text-text-main transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
