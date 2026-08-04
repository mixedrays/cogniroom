import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  isOffline,
  isOnline,
  refreshOnlineStatus,
  resetOnlineStatus,
  subscribeOnlineStatus,
} from "@/lib/online";

function setNavigatorOnLine(value: boolean): void {
  Object.defineProperty(window.navigator, "onLine", {
    configurable: true,
    value,
  });
}

describe("online status", () => {
  beforeEach(() => {
    resetOnlineStatus();
    setNavigatorOnLine(true);
  });

  afterEach(() => {
    resetOnlineStatus();
    vi.unstubAllGlobals();
  });

  it("stays online when navigator.onLine lies but the origin is reachable", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    setNavigatorOnLine(false);

    const listener = vi.fn();
    const unsubscribe = subscribeOnlineStatus(listener);
    await refreshOnlineStatus();

    expect(fetchMock).toHaveBeenCalled();
    expect(isOnline()).toBe(true);
    unsubscribe();
  });

  it("reports offline once the probe fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));
    setNavigatorOnLine(false);

    const listener = vi.fn();
    const unsubscribe = subscribeOnlineStatus(listener);
    await refreshOnlineStatus();

    expect(isOffline()).toBe(true);
    expect(listener).toHaveBeenCalled();
    unsubscribe();
  });

  it("recovers on a later probe without an `online` event", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    setNavigatorOnLine(false);

    const unsubscribe = subscribeOnlineStatus(vi.fn());
    await refreshOnlineStatus();
    expect(isOffline()).toBe(true);

    await refreshOnlineStatus();
    expect(isOnline()).toBe(true);
    unsubscribe();
  });

  it("bypasses caches when probing", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    subscribeOnlineStatus(vi.fn());
    await refreshOnlineStatus();

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(/^\/api\/ping\?t=\d+$/);
    expect(init.cache).toBe("no-store");
  });

  it("falls back to navigator.onLine before any probe resolves", () => {
    setNavigatorOnLine(false);
    expect(isOffline()).toBe(true);
    setNavigatorOnLine(true);
    expect(isOffline()).toBe(false);
  });
});
