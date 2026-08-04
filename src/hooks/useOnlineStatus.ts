import { useSyncExternalStore } from "react";
import { isOnline, subscribeOnlineStatus } from "@/lib/online";

function getServerSnapshot(): boolean {
  return true;
}

export function useOnlineStatus(): boolean {
  return useSyncExternalStore(
    subscribeOnlineStatus,
    isOnline,
    getServerSnapshot
  );
}
