import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { postJson, getJson } from "../apiClient";

function jsonResponse(
  body: unknown,
  init: { ok?: boolean; status?: number; statusText?: string } = {}
) {
  return {
    ok: init.ok ?? true,
    status: init.status ?? 200,
    statusText: init.statusText ?? "OK",
    json: async () => body,
  } as Response;
}

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("postJson", () => {
  it("sends a JSON POST with the right headers and body", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ success: true }));
    await postJson("/api/thing", { a: 1 });
    expect(fetchMock).toHaveBeenCalledWith("/api/thing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ a: 1 }),
    });
  });

  it("returns the parsed body on success", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, id: "x" }));
    const result = await postJson<{ success: boolean; id?: string }>(
      "/api/thing",
      {}
    );
    expect(result).toEqual({ success: true, id: "x" });
  });

  it("defaults to { success: true } when the response body is unparseable", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => {
        throw new Error("no body");
      },
    } as unknown as Response);
    expect(await postJson("/api/thing", {})).toEqual({ success: true });
  });

  it("extracts the server message on a failed response", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        { message: "Course already exists" },
        {
          ok: false,
          status: 409,
        }
      )
    );
    expect(await postJson("/api/thing", {})).toEqual({
      success: false,
      error: "Course already exists",
    });
  });

  it("falls back to the failure label and status when no message is present", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({}, { ok: false, status: 500 })
    );
    expect(await postJson("/api/thing", {}, "Save failed")).toEqual({
      success: false,
      error: "Save failed (500)",
    });
  });

  it("returns a failure result when the request throws", async () => {
    fetchMock.mockRejectedValueOnce(new Error("offline"));
    expect(await postJson("/api/thing", {})).toEqual({
      success: false,
      error: "Error: offline",
    });
  });
});

describe("getJson", () => {
  it("returns the parsed body on success", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ content: "hi" }));
    expect(await getJson<{ content: string }>("/api/x")).toEqual({
      content: "hi",
    });
  });

  it("returns null on 404 without logging an error", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    fetchMock.mockResolvedValueOnce(
      jsonResponse(null, { ok: false, status: 404, statusText: "Not Found" })
    );
    expect(await getJson("/api/x")).toBeNull();
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it("returns null and logs on a non-404 error response", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    fetchMock.mockResolvedValueOnce(
      jsonResponse(null, { ok: false, status: 500, statusText: "Server Error" })
    );
    expect(await getJson("/api/x", "boom")).toBeNull();
    expect(errorSpy).toHaveBeenCalled();
  });

  it("returns null and logs when the request throws", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    fetchMock.mockRejectedValueOnce(new Error("offline"));
    expect(await getJson("/api/x")).toBeNull();
    expect(errorSpy).toHaveBeenCalled();
  });
});
