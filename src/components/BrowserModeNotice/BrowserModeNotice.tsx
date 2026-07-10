import { useEffect } from "react";
import { toast } from "sonner";
import { getStorageMode } from "@/lib/runtimeConfig";

// Kept in localStorage on purpose: clearing site data wipes it together with
// the IndexedDB content, so the notice reappears exactly when it matters again.
const ACK_KEY = "cogniroom:browser-mode-notice-ack";

export function BrowserModeNotice() {
  useEffect(() => {
    let cancelled = false;

    void getStorageMode().then((mode) => {
      if (cancelled || mode !== "browser") return;
      if (localStorage.getItem(ACK_KEY)) return;

      toast.warning("Content is stored in this browser", {
        id: "browser-mode-notice",
        duration: Infinity,
        description:
          "The app runs in browser storage mode: courses, decks, and progress live in this browser's local database. Clearing browsing data or site storage will permanently delete them.",
        action: {
          label: "Got it",
          onClick: () => localStorage.setItem(ACK_KEY, "1"),
        },
      });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
