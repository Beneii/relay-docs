import { Link } from 'react-router-dom';
import { RelayIcon } from '../components/RelayLogo';
import { ThemeToggle } from '../components/ThemeToggle';

export default function Privacy() {
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
        <h1 className="text-4xl font-bold tracking-tight mb-2">Privacy Policy</h1>
        <p className="text-text-muted mb-12">Last updated: March 9, 2026</p>

        <div className="space-y-8 text-text-muted leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-text-main mb-3">1. Information We Collect</h2>
            <p>When you create a Relay account, we collect your email address and, if you use OAuth, basic profile information from Google or GitHub. When you subscribe to Relay Pro, payment information is processed securely by Stripe &mdash; we never store your card details.</p>
            <p className="mt-3">To deliver push notifications, we securely store Apple and Google device push tokens. We also temporarily process the title and body content of the webhook payloads you send, which are stored for delivery purposes and deleted when you remove an app or your account.</p>
            <p className="mt-3">We collect usage data such as the number of dashboards you create, notifications sent, and general usage patterns to improve our service.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-main mb-3">2. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>To provide, maintain, and improve the Relay service</li>
              <li>To process payments and manage your subscription</li>
              <li>To send transactional emails (welcome, billing, account changes)</li>
              <li>To deliver webhook-triggered push notifications to your devices</li>
              <li>To respond to support inquiries</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-main mb-3">3. Data Storage and Security</h2>
            <p>Your data is stored securely using Supabase (hosted on AWS). All data is encrypted in transit via TLS and at rest. We implement industry-standard security measures to protect your information.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-main mb-3">4. Third-Party Services</h2>
            <p>We use the following third-party services that may process your data:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li><strong>Supabase</strong> &mdash; Authentication and database</li>
              <li><strong>Stripe</strong> &mdash; Payment processing</li>
              <li><strong>Resend</strong> &mdash; Transactional email delivery</li>
              <li><strong>Vercel</strong> &mdash; Hosting and serverless functions</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-main mb-3">5. Data Retention</h2>
            <p>We retain your account data for as long as your account is active. If you delete your account, we will remove your personal data within 30 days, except where we are required by law to retain it.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-main mb-3">6. Your Rights</h2>
            <p>You can request access to, correction of, or deletion of your personal data at any time by contacting us at <a href="mailto:hello@relayapp.dev" className="text-accent hover:underline">hello@relayapp.dev</a>.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-main mb-3">7. Cookies</h2>
            <p>Relay uses essential cookies only for authentication and session management. We do not use tracking cookies or third-party analytics cookies.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-main mb-3">8. Changes to This Policy</h2>
            <p>We may update this policy from time to time. We will notify you of significant changes via email or a notice on our website.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-main mb-3">9. Contact</h2>
            <p>If you have questions about this privacy policy, contact us at <a href="mailto:hello@relayapp.dev" className="text-accent hover:underline">hello@relayapp.dev</a>.</p>
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
            <Link to="/terms" className="hover:text-text-main transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
