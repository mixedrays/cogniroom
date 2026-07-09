import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HTTPError } from "h3";

const OLD = process.env.STORAGE_MODE;

beforeEach(() => {
  vi.resetModules();
});
afterEach(() => {
  if (OLD === undefined) delete process.env.STORAGE_MODE;
  else process.env.STORAGE_MODE = OLD;
});

describe("assertServerStorageEnabled", () => {
  it("is a no-op in filesystem mode", async () => {
    process.env.STORAGE_MODE = "filesystem";
    const { assertServerStorageEnabled } = await import(
      "../assertServerStorageEnabled"
    );
    expect(() => assertServerStorageEnabled()).not.toThrow();
  });

  it("throws a 501 HTTPError in browser mode", async () => {
    process.env.STORAGE_MODE = "browser";
    const { assertServerStorageEnabled } = await import(
      "../assertServerStorageEnabled"
    );
    try {
      assertServerStorageEnabled();
      throw new Error("expected to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(HTTPError);
      expect((error as HTTPError).status).toBe(501);
    }
  });
});
