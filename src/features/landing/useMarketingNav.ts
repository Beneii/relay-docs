import { useEffect, useState } from "react";
import { useScroll, useTransform } from "motion/react";

import { supabase } from "../../lib/supabase";

export function useMarketingNav() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { scrollY } = useScroll();
  const navLogoRotate = useTransform(scrollY, [0, 8000], [0, 1800]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsSignedIn(Boolean(session));
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsSignedIn(Boolean(session));
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return {
    isSignedIn,
    mobileMenuOpen,
    navLogoRotate,
    setMobileMenuOpen,
  };
}
