import { useEffect } from "react";

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (import.meta.env.DEV) return;
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    let cancelled = false;

    void import("virtual:pwa-register").then(({ registerSW }) => {
      if (cancelled) return;
      registerSW({ immediate: true });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
