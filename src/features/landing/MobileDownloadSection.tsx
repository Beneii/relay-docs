import { Download, Smartphone } from "lucide-react";
import { Link } from "react-router-dom";

function normalizeUrl(value: string | undefined) {
  return value?.trim() || null;
}

export function MobileDownloadSection() {
  const appStoreUrl = normalizeUrl(import.meta.env.VITE_APP_STORE_URL);
  const playStoreUrl = normalizeUrl(import.meta.env.VITE_PLAY_STORE_URL);

  return (
    <section className="py-24 px-6 border-t border-border">
      <div className="max-w-5xl mx-auto bg-surface border border-border rounded-[2rem] p-8 md:p-10 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          <div className="max-w-2xl">
            <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center mb-5">
              <Smartphone className="w-6 h-6 text-accent" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Get Relay on your phone
            </h2>
            <p className="text-lg text-text-muted leading-relaxed">
              Save dashboards, receive push alerts, and jump straight into the right
              screen from a notification. Use the store links when they are live, or
              request mobile beta access today.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 lg:justify-end">
            {appStoreUrl ? (
              <a
                href={appStoreUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-[3.25rem] px-5 py-3.5 rounded-xl bg-accent text-white font-medium leading-none items-center justify-center gap-2 hover:bg-emerald-600 transition-all"
              >
                <Download className="w-4 h-4" />
                App Store
              </a>
            ) : (
              <a
                href="mailto:hello@relayapp.dev?subject=Relay%20iOS%20beta"
                className="inline-flex min-h-[3.25rem] px-5 py-3.5 rounded-xl bg-accent text-white font-medium leading-none items-center justify-center gap-2 hover:bg-emerald-600 transition-all"
              >
                <Download className="w-4 h-4" />
                Join iOS beta
              </a>
            )}

            {playStoreUrl ? (
              <a
                href={playStoreUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-[3.25rem] px-5 py-3.5 rounded-xl border border-border bg-bg text-text-main font-medium leading-none items-center justify-center gap-2 hover:bg-surface-hover transition-all"
              >
                <Download className="w-4 h-4" />
                Google Play
              </a>
            ) : (
              <a
                href="mailto:hello@relayapp.dev?subject=Relay%20Android%20beta"
                className="inline-flex min-h-[3.25rem] px-5 py-3.5 rounded-xl border border-border bg-bg text-text-main font-medium leading-none items-center justify-center gap-2 hover:bg-surface-hover transition-all"
              >
                <Download className="w-4 h-4" />
                Join Android beta
              </a>
            )}
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-border flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-sm text-text-muted">
          <p>Native iOS and Android apps are built from the same Relay account.</p>
          <Link to="/signup" className="text-accent hover:text-emerald-600 transition-colors">
            Create an account to get started
          </Link>
        </div>
      </div>
    </section>
  );
}
