import { useEffect, useState } from "react";
import { INTEGRATIONS } from "./content";
import { useMarketingNav } from "./useMarketingNav";

export function useLandingPage() {
  const [activeTab, setActiveTab] = useState<keyof typeof INTEGRATIONS>("bash");
  const [showNotification, setShowNotification] = useState(false);
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const { isSignedIn, mobileMenuOpen, navLogoRotate, setMobileMenuOpen } =
    useMarketingNav();

  useEffect(() => {
    const interval = setInterval(() => {
      setShowNotification(false);
      setTimeout(() => setShowNotification(true), 1500);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return {
    activeTab,
    isSignedIn,
    mobileMenuOpen,
    navLogoRotate,
    openFAQ,
    setActiveTab,
    setMobileMenuOpen,
    setOpenFAQ,
    showNotification,
  };
}
