import { describe, it, expect, vi, beforeEach } from "vitest";
import { HTTPError } from "h3";
import type { H3Event } from "h3";
import { withErrorGuard } from "../withErrorGuard";

const fakeEvent = {} as H3Event;

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("withErrorGuard", () => {
  it("returns the handler's result on success", async () => {
    const guarded = withErrorGuard("Failed", async () => ({ success: true }));
    await expect(guarded(fakeEvent)).resolves.toEqual({ success: true });
  });

  it("passes the event through to the handler", async () => {
    const handler = vi.fn(async () => "ok");
    const guarded = withErrorGuard("Failed", handler);
    await guarded(fakeEvent);
    expect(handler).toHaveBeenCalledWith(fakeEvent);
  });

  it("rethrows an HTTPError unchanged", async () => {
    const original = new HTTPError({ status: 404, message: "Course not found" });
    const guarded = withErrorGuard("Failed to generate lesson", async () => {
      throw original;
    });
    await expect(guarded(fakeEvent)).rejects.toBe(original);
  });

  it("wraps a generic error as an HTTPError 500 with the failure prefix", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const guarded = withErrorGuard("Failed to generate lesson", async () => {
      throw new Error("boom");
    });
    await expect(guarded(fakeEvent)).rejects.toMatchObject({
      status: 500,
      message: "Failed to generate lesson: boom",
    });
  });

  it("logs the failure with the provided label", async () => {
    const errorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const guarded = withErrorGuard("Failed to generate quiz", async () => {
      throw new Error("nope");
    });
    await expect(guarded(fakeEvent)).rejects.toBeInstanceOf(HTTPError);
    expect(errorSpy).toHaveBeenCalledWith(
      "Failed to generate quiz:",
      expect.any(Error)
    );
  });
});
