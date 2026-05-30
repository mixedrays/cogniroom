import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtemp, rm, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createStorageApi, initStorage, storageApi } from "../index";
import { FileSystemAdapter } from "../adapters";

async function makeDir(prefix: string): Promise<string> {
  return mkdtemp(join(tmpdir(), prefix));
}

describe("storageApi (default adapter)", () => {
  let dirA: string;
  let dirB: string;

  beforeEach(async () => {
    dirA = await makeDir("storage-a-");
    dirB = await makeDir("storage-b-");
    await writeFile(join(dirA, "a.json"), JSON.stringify({ from: "A" }));
    await writeFile(join(dirB, "b.json"), JSON.stringify({ from: "B" }));
  });

  afterEach(async () => {
    await rm(dirA, { recursive: true, force: true });
    await rm(dirB, { recursive: true, force: true });
  });

  it("resolves list/stat lazily through the current default adapter", async () => {
    initStorage(new FileSystemAdapter({ basePath: dirA }));
    expect((await storageApi.list("")).map((e) => e.name)).toEqual(["a.json"]);
    expect(await storageApi.stat("a.json")).not.toBeNull();

    // Reconfiguring the backend is reflected on the next call (no stale capture).
    initStorage(new FileSystemAdapter({ basePath: dirB }));
    expect((await storageApi.list("")).map((e) => e.name)).toEqual(["b.json"]);
    expect(await storageApi.stat("a.json")).toBeNull();
  });
});

describe("createStorageApi (scoped adapter)", () => {
  let defaultDir: string;
  let scopedDir: string;

  beforeEach(async () => {
    defaultDir = await makeDir("storage-default-");
    scopedDir = await makeDir("storage-scoped-");
    await writeFile(join(defaultDir, "default.json"), "{}");
    await mkdir(join(scopedDir, "nested"));
    await writeFile(join(scopedDir, "scoped.json"), "{}");
    initStorage(new FileSystemAdapter({ basePath: defaultDir }));
  });

  afterEach(async () => {
    await rm(defaultDir, { recursive: true, force: true });
    await rm(scopedDir, { recursive: true, force: true });
  });

  it("routes list/stat to its own adapter, not the default backend", async () => {
    const scoped = createStorageApi({ basePath: scopedDir });

    const names = (await scoped.list("")).map((e) => e.name).sort();
    expect(names).toEqual(["nested", "scoped.json"]);

    const stat = await scoped.stat("nested");
    expect(stat?.isDirectory).toBe(true);

    // The default adapter is untouched by the scoped API.
    expect((await storageApi.list("")).map((e) => e.name)).toEqual([
      "default.json",
    ]);
  });

  it("round-trips get/post against its own adapter", async () => {
    const scoped = createStorageApi({ basePath: scopedDir });

    await scoped.post("written.json", { ok: true });
    const response = await scoped.get<{ ok: boolean }>("written.json");
    expect((await response.json()).ok).toBe(true);

    // Not visible through the default adapter's backend.
    expect(await storageApi.exists("written.json")).toBe(false);
  });
});
