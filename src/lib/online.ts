/**
 * Connectivity state for the client.
 *
 * `navigator.onLine` is only a hint: it reports whether the browser thinks it
 * has a route to a network, and it goes stale in common situations (DevTools
 * network throttling, VPN/virtual adapters, a tab that missed the `online`
 * event after sleep). A false negative there disables every network-backed
 * action in the UI on a machine that is perfectly online, so a bare
 * `navigator.onLine` is never trusted to mean "offline" — it only triggers a
 * probe. Offline is reported once an actual request to our own origin fails.
 */

export const OFFLINE_MESSAGE =
  "You are offline. This action requires a network connection.";

export class OfflineError extends Error {
  constructor(message: string = OFFLINE_MESSAGE) {
    super(message);
    this.name = "OfflineError";
  }
}

const PROBE_PATH = "/api/ping";
const PROBE_TIMEOUT_MS = 5000;
const RECHECK_INTERVAL_MS = 15000;

/** `null` until a probe has confirmed the state. */
let offline: boolean | null = null;
let started = false;
let probeInFlight: Promise<boolean> | null = null;
let recheckTimer: ReturnType<typeof setInterval> | null = null;

const listeners = new Set<() => void>();

function navigatorOffline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

function notify(): void {
  for (const listener of listeners) listener();
}

function setOffline(next: boolean): void {
  if (offline === next) return;
  offline = next;
  if (next) startRecheck();
  else stopRecheck();
  notify();
}

async function runProbe(): Promise<boolean> {
  if (typeof fetch === "undefined") return !navigatorOffline();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  try {
    // Unique query + `no-store` so neither the HTTP cache nor the service
    // worker can answer a probe from cache and fake a live connection.
    const response = await fetch(`${PROBE_PATH}?t=${Date.now()}`, {
      cache: "no-store",
      signal: controller.signal,
    });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/** Probe the origin and publish the result. Concurrent calls share one request. */
export function refreshOnlineStatus(): Promise<boolean> {
  if (probeInFlight) return probeInFlight;
  probeInFlight = runProbe()
    .then((reachable) => {
      setOffline(!reachable);
      return reachable;
    })
    .finally(() => {
      probeInFlight = null;
    });
  return probeInFlight;
}

function startRecheck(): void {
  if (recheckTimer !== null || typeof window === "undefined") return;
  recheckTimer = setInterval(() => {
    void refreshOnlineStatus();
  }, RECHECK_INTERVAL_MS);
}

function stopRecheck(): void {
  if (recheckTimer === null) return;
  clearInterval(recheckTimer);
  recheckTimer = null;
}

function handleOnlineEvent(): void {
  // The event is trustworthy in the optimistic direction; real requests will
  // report the truth if it was premature.
  setOffline(false);
}

function handleOfflineEvent(): void {
  void refreshOnlineStatus();
}

function handleWake(): void {
  // A tab that slept through the `online` event only learns it is back by
  // asking, so re-check whenever it becomes visible while believed offline.
  if (offline !== false && document.visibilityState === "visible") {
    void refreshOnlineStatus();
  }
}

function start(): void {
  if (started || typeof window === "undefined") return;
  started = true;

  window.addEventListener("online", handleOnlineEvent);
  window.addEventListener("offline", handleOfflineEvent);
  document.addEventListener("visibilitychange", handleWake);
  window.addEventListener("focus", handleWake);

  if (navigatorOffline()) void refreshOnlineStatus();
}

function stop(): void {
  if (!started) return;
  started = false;

  window.removeEventListener("online", handleOnlineEvent);
  window.removeEventListener("offline", handleOfflineEvent);
  document.removeEventListener("visibilitychange", handleWake);
  window.removeEventListener("focus", handleWake);
  stopRecheck();
}

export function subscribeOnlineStatus(callback: () => void): () => void {
  listeners.add(callback);
  start();
  return () => {
    listeners.delete(callback);
    if (listeners.size === 0) stop();
  };
}

export function isOffline(): boolean {
  return offline ?? navigatorOffline();
}

export function isOnline(): boolean {
  return !isOffline();
}

export function assertOnline(): void {
  if (isOffline()) {
    throw new OfflineError();
  }
}

/** Test seam: drop all monitoring state. */
export function resetOnlineStatus(): void {
  stop();
  listeners.clear();
  offline = null;
  probeInFlight = null;
}
