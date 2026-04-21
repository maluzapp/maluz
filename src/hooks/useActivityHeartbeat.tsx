import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const THROTTLE_MS = 5 * 60 * 1000; // 5 minutes
const STORAGE_KEY = "maluz_last_activity_ping";

/**
 * Pings the server to update the user's `profiles.last_active_at`.
 * Throttled to avoid spamming the database — at most once every 5 minutes
 * per browser session, and only when the tab is visible/focused.
 */
export function useActivityHeartbeat() {
  const { user } = useAuth();
  const inFlight = useRef(false);

  useEffect(() => {
    if (!user) return;

    const ping = async () => {
      if (inFlight.current) return;
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;

      const last = parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10);
      if (Date.now() - last < THROTTLE_MS) return;

      inFlight.current = true;
      try {
        await supabase.rpc("touch_profile_activity");
        localStorage.setItem(STORAGE_KEY, String(Date.now()));
      } catch (err) {
        console.error("heartbeat error:", err);
      } finally {
        inFlight.current = false;
      }
    };

    // Initial ping on mount
    ping();

    // Re-ping on visibility change (user returns to tab)
    const onVisibility = () => {
      if (document.visibilityState === "visible") ping();
    };
    document.addEventListener("visibilitychange", onVisibility);

    // Periodic ping while tab stays open
    const interval = setInterval(ping, THROTTLE_MS);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      clearInterval(interval);
    };
  }, [user]);
}
