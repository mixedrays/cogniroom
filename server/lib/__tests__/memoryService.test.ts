import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

const memoryDir = vi.hoisted(() => {
  const base = (process.env.TMPDIR || "/tmp").replace(/\/$/, "");
  return `${base}/memory-test-${Date.now()}-${Math.random().toString(36).slice(2)}`;
});

vi.mock("@root/server/env", () => ({ MEMORY_DIR: memoryDir }));

import {
  readMemory,
  writeMemory,
  deleteMemory,
  clearAllMemory,
  listMemoryEntries,
  getMemoryContext,
} from "../memoryService";

beforeEach(async () => {
  await mkdir(memoryDir, { recursive: true });
});

afterEach(async () => {
  await rm(memoryDir, { recursive: true, force: true });
});

describe("readMemory / writeMemory", () => {
  it("round-trips content for a valid key", async () => {
    await writeMemory("profile", "likes brevity");
    expect(await readMemory("profile")).toBe("likes brevity");
  });

  it("returns null for a missing key", async () => {
    expect(await readMemory("nope")).toBeNull();
  });

  it("rejects an invalid key on write", async () => {
    await expect(writeMemory("bad key!", "x")).rejects.toThrow(
      /Invalid memory key/
    );
  });

  it("returns null for an invalid key on read", async () => {
    expect(await readMemory("../escape")).toBeNull();
  });
});

describe("deleteMemory", () => {
  it("returns true when a file is removed", async () => {
    await writeMemory("temp", "x");
    expect(await deleteMemory("temp")).toBe(true);
    expect(await readMemory("temp")).toBeNull();
  });

  it("returns false when the file is absent", async () => {
    expect(await deleteMemory("ghost")).toBe(false);
  });
});

describe("clearAllMemory", () => {
  it("removes only .md files and returns the count", async () => {
    await writeMemory("a", "one");
    await writeMemory("b", "two");
    await writeFile(join(memoryDir, "keep.txt"), "not memory");

    expect(await clearAllMemory()).toBe(2);
    expect(await readMemory("a")).toBeNull();
    expect(await readMemory("b")).toBeNull();
  });

  it("returns 0 when the directory does not exist", async () => {
    await rm(memoryDir, { recursive: true, force: true });
    expect(await clearAllMemory()).toBe(0);
  });
});

describe("listMemoryEntries", () => {
  it("returns trimmed entries sorted by key, skipping blanks and non-md files", async () => {
    await writeMemory("zeta", "  last  ");
    await writeMemory("alpha", "first");
    await writeMemory("blank", "   ");
    await writeFile(join(memoryDir, "notes.txt"), "ignored");

    expect(await listMemoryEntries()).toEqual([
      { key: "alpha", content: "first" },
      { key: "zeta", content: "last" },
    ]);
  });

  it("returns an empty array when the directory is missing", async () => {
    await rm(memoryDir, { recursive: true, force: true });
    expect(await listMemoryEntries()).toEqual([]);
  });
});

describe("getMemoryContext", () => {
  it("returns an empty string when there are no entries", async () => {
    expect(await getMemoryContext()).toBe("");
  });

  it("formats entries under a header with per-key sections", async () => {
    await writeMemory("alpha", "first");
    await writeMemory("beta", "second");

    expect(await getMemoryContext()).toBe(
      "USER MEMORY (persisted notes about the user — consider these when responding):\n" +
        "### alpha\nfirst\n\n### beta\nsecond"
    );
  });
});
