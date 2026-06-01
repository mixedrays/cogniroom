import { describe, it, expect, vi, beforeEach } from "vitest";

const getMemoryContextMock = vi.fn();

vi.mock("../memoryService", () => ({
  getMemoryContext: () => getMemoryContextMock(),
}));

import { composeAdditionalInstructions } from "../composeAdditionalInstructions";

beforeEach(() => {
  getMemoryContextMock.mockReset();
  getMemoryContextMock.mockResolvedValue("");
});

describe("composeAdditionalInstructions", () => {
  it("returns an empty string when every source is empty", async () => {
    expect(await composeAdditionalInstructions()).toBe("");
    expect(await composeAdditionalInstructions("  ", "\n\t")).toBe("");
  });

  it("includes trimmed generation options on their own", async () => {
    expect(await composeAdditionalInstructions("  Count: 12  ")).toBe(
      "\nCount: 12"
    );
  });

  it("prefixes user instructions with the labelled block", async () => {
    expect(
      await composeAdditionalInstructions(undefined, "  focus on closures  ")
    ).toBe("\nAdditional Instructions from user: focus on closures");
  });

  it("includes the memory context when present", async () => {
    getMemoryContextMock.mockResolvedValue("  USER MEMORY: likes brevity  ");
    expect(await composeAdditionalInstructions()).toBe(
      "\nUSER MEMORY: likes brevity"
    );
  });

  it("joins all three sources in order (options, user, memory) with blank lines", async () => {
    getMemoryContextMock.mockResolvedValue("USER MEMORY: x");
    expect(await composeAdditionalInstructions("Count: 5", "be concise")).toBe(
      "\nCount: 5\n\nAdditional Instructions from user: be concise\n\nUSER MEMORY: x"
    );
  });

  it("omits blank sources from the joined output", async () => {
    getMemoryContextMock.mockResolvedValue("USER MEMORY: x");
    expect(await composeAdditionalInstructions("  ", "be concise")).toBe(
      "\nAdditional Instructions from user: be concise\n\nUSER MEMORY: x"
    );
  });
});
