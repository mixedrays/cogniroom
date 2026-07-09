import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "fake-indexeddb/auto";
import { IDBFactory } from "fake-indexeddb";

const reset = async () => {
  (globalThis as unknown as { indexedDB: IDBFactory }).indexedDB =
    new IDBFactory();
  vi.resetModules();
  vi.unstubAllGlobals();
};

beforeEach(reset);
afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getStorageMode (browser)", () => {
  it("fetches /api/config once and memoizes the result", async () => {
    vi.stubGlobal("window", {} as Window);
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ storageMode: "browser" }),
    }));
    vi.stubGlobal("fetch", fetchMock);

    const { getStorageMode } = await import("@/lib/runtimeConfig");
    expect(await getStorageMode()).toBe("browser");
    expect(await getStorageMode()).toBe("browser");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("falls back to a mirrored cached mode when the fetch fails", async () => {
    vi.stubGlobal("window", {} as Window);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ storageMode: "browser" }),
      }))
    );

    // First run mirrors "browser" into the cache.
    let mod = await import("@/lib/runtimeConfig");
    expect(await mod.getStorageMode()).toBe("browser");

    // Now the network is down; a fresh module load must recover from cache.
    vi.resetModules();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("offline");
      })
    );
    mod = await import("@/lib/runtimeConfig");
    expect(await mod.getStorageMode()).toBe("browser");
  });

  it("defaults to filesystem when there is no network and no cache", async () => {
    vi.stubGlobal("window", {} as Window);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("offline");
      })
    );
    const { getStorageMode } = await import("@/lib/runtimeConfig");
    expect(await getStorageMode()).toBe("filesystem");
  });
});
