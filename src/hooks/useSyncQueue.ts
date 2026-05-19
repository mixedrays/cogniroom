import { useEffect, useRef } from "react";
import { useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { flushSyncQueue, getPendingReviews } from "@/lib/syncQueue";

export function useSyncQueue(): void {
  const router = useRouter();
  const running = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const run = async () => {
      if (running.current) return;
      running.current = true;
      try {
        const pending = await getPendingReviews();
        if (pending.length === 0) return;
        const { synced, failed } = await flushSyncQueue();
        if (synced > 0) {
          toast.success(
            `Synced ${synced} pending review${synced === 1 ? "" : "s"}`
          );
          router.invalidate();
        }
        if (failed > 0) {
          toast.warning(
            `${failed} review${failed === 1 ? "" : "s"} failed to sync`
          );
        }
      } finally {
        running.current = false;
      }
    };

    if (navigator.onLine) void run();

    const handleOnline = () => {
      void run();
    };
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, [router]);
}
