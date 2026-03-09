import { Link } from "react-router-dom";

import { RelayIcon } from "../../components/RelayLogo";

interface LandingFooterProps {
  anchorBasePath?: string;
}

function resolveAnchorHref(anchorBasePath: string | undefined, href: string) {
  return anchorBasePath ? `${anchorBasePath}${href}` : href;
}

export function LandingFooter({ anchorBasePath }: LandingFooterProps) {
  return (
    <footer className="border-t border-border">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-4 gap-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <RelayIcon size={24} className="text-text-main" />
              <span className="font-semibold tracking-tight text-lg">Relay</span>
            </div>
            <p className="text-sm text-text-muted max-w-sm leading-relaxed">
              Push notifications for your dashboards and scripts. Get notified when
              critical infrastructure needs your attention.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-4">Product</h3>
            <ul className="space-y-3 text-sm text-text-muted">
              <li>
                <a
                  href={resolveAnchorHref(anchorBasePath, "#features")}
                  className="hover:text-text-main transition-colors"
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  href={resolveAnchorHref(anchorBasePath, "#use-cases")}
                  className="hover:text-text-main transition-colors"
                >
                  Use Cases
                </a>
              </li>
              <li>
                <a
                  href={resolveAnchorHref(anchorBasePath, "#how-it-works")}
                  className="hover:text-text-main transition-colors"
                >
                  How it works
                </a>
              </li>
              <li>
                <a
                  href={resolveAnchorHref(anchorBasePath, "#api")}
                  className="hover:text-text-main transition-colors"
                >
                  API
                </a>
              </li>
              <li>
                <Link to="/pricing" className="hover:text-text-main transition-colors">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-4">Company</h3>
            <ul className="space-y-3 text-sm text-text-muted">
              <li>
                <a
                  href={resolveAnchorHref(anchorBasePath, "#faq")}
                  className="hover:text-text-main transition-colors"
                >
                  FAQ
                </a>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-text-main transition-colors">
                  Privacy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-text-main transition-colors">
                  Terms
                </Link>
              </li>
              <li>
                <a
                  href="mailto:hello@relayapp.dev"
                  className="hover:text-text-main transition-colors"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-text-muted">
            &copy; {new Date().getFullYear()} Relay. All rights reserved.
          </p>
          <p className="text-sm text-text-muted">Made for operators, builders, and teams.</p>
        </div>
      </div>
    </footer>
  );
}
