"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export function IdleTimer() {
  const router = useRouter();
  const supabase = createClient();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 30 minutes in milliseconds
  const IDLE_TIMEOUT_MS = 30 * 60 * 1000;

  useEffect(() => {
    const handleLogout = async () => {
      // Check if user is actually logged in before signing out
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase.auth.signOut();
        // Option to redirect or let the middleware handle it if they try to navigate
        router.push("/login?message=You+have+been+logged+out+due+to+inactivity.");
        router.refresh();
      }
    };

    const resetTimer = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(handleLogout, IDLE_TIMEOUT_MS);
    };

    // Events that reset the idle timer
    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart"];

    events.forEach((event) => {
      window.addEventListener(event, resetTimer, { passive: true });
    });

    // Initialize timer on mount
    resetTimer();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [router, supabase]);

  return null;
}
