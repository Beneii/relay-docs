import { AnimatePresence, motion } from "motion/react";
import { Menu, User, X } from "lucide-react";
import { Link } from "react-router-dom";
import type { MotionValue } from "motion/react";

import { RelayIcon } from "../../components/RelayLogo";
import { ThemeToggle } from "../../components/ThemeToggle";

const NAV_ITEMS = [
  { href: "#features", label: "Features" },
  { href: "#use-cases", label: "Use Cases" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#api", label: "API" },
] as const;

interface LandingNavProps {
  anchorBasePath?: string;
  isSignedIn: boolean;
  mobileMenuOpen: boolean;
  navLogoRotate: MotionValue<number>;
  onToggleMobileMenu: () => void;
  onCloseMobileMenu: () => void;
}

function resolveAnchorHref(anchorBasePath: string | undefined, href: string) {
  return anchorBasePath ? `${anchorBasePath}${href}` : href;
}

export function LandingNav({
  anchorBasePath,
  isSignedIn,
  mobileMenuOpen,
  navLogoRotate,
  onToggleMobileMenu,
  onCloseMobileMenu,
}: LandingNavProps) {
  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-bg/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <motion.div style={{ rotate: navLogoRotate }}>
            <RelayIcon size={24} className="text-text-main" />
          </motion.div>
          <span className="font-semibold tracking-tight">Relay</span>
        </Link>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-text-muted">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={resolveAnchorHref(anchorBasePath, item.href)}
              className="hover:text-text-main transition-colors"
            >
              {item.label}
            </a>
          ))}
          <Link to="/pricing" className="hover:text-text-main transition-colors">
            Pricing
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {isSignedIn ? (
            <Link
              to="/dashboard"
              className="h-9 px-4 rounded-lg bg-accent text-white text-sm font-medium hover:bg-emerald-600 transition-all flex items-center gap-2"
            >
              <User className="w-4 h-4" />
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="hidden md:flex items-center text-sm font-medium text-text-muted hover:text-text-main transition-colors"
              >
                Sign in
              </Link>
              <Link
                to="/signup"
                className="hidden md:flex h-9 px-4 rounded-lg bg-accent text-white text-sm font-medium hover:bg-emerald-600 transition-all items-center"
              >
                Get Started
              </Link>
            </>
          )}
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden w-9 h-9 rounded-lg flex items-center justify-center text-text-muted hover:text-text-main hover:bg-surface-hover transition-colors cursor-pointer"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t border-border bg-bg overflow-hidden"
          >
            <div className="px-6 py-4 space-y-1">
              {NAV_ITEMS.map((item) => (
                <a
                  key={item.href}
                  href={resolveAnchorHref(anchorBasePath, item.href)}
                  onClick={onCloseMobileMenu}
                  className="block py-2.5 text-sm font-medium text-text-muted hover:text-text-main transition-colors"
                >
                  {item.label}
                </a>
              ))}
              <Link
                to="/pricing"
                onClick={onCloseMobileMenu}
                className="block py-2.5 text-sm font-medium text-text-muted hover:text-text-main transition-colors"
              >
                Pricing
              </Link>
              {!isSignedIn ? (
                <div className="pt-3 space-y-2 border-t border-border mt-2">
                  <Link
                    to="/login"
                    onClick={onCloseMobileMenu}
                    className="block py-2.5 text-sm font-medium text-text-muted hover:text-text-main transition-colors"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/signup"
                    onClick={onCloseMobileMenu}
                    className="block py-2.5 text-sm font-medium text-accent hover:text-emerald-600 transition-colors"
                  >
                    Get Started Free
                  </Link>
                </div>
              ) : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </nav>
  );
}
