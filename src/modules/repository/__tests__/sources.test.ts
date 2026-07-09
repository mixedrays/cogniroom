import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "fake-indexeddb/auto";
import { IDBFactory } from "fake-indexeddb";
import { createClientStorageApi } from "@/modules/storage/client";
import type { StorageApi } from "@/modules/storage/client";
import { sourceRepo } from "@/modules/repository";
import type { Source } from "@/modules/core";

const reset = () => {
  (globalThis as unknown as { indexedDB: IDBFactory }).indexedDB =
    new IDBFactory();
};

let api: StorageApi;

beforeEach(() => {
  reset();
  api = createClientStorageApi({
    databaseName: "cogniroom-data-test",
    storeName: "files",
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function textMeta(id: string, over: Partial<Source> = {}): Source {
  return {
    id,
    kind: "text",
    origin: "upload",
    delivery: "text",
    label: "notes.txt",
    source: "notes.txt",
    mimeType: "text/plain",
    byteSize: 5,
    status: "ready",
    scopes: [],
    refCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...over,
  };
}

describe("sourceRepo against IndexedDB adapter", () => {
  it("persists metadata, text and blob, then reads them back", async () => {
    await sourceRepo.createSource(api, {
      metadata: textMeta("abc"),
      extractedText: "hello world",
      blobBase64: Buffer.from("hello").toString("base64"),
      blobExt: "txt",
      scope: { courseId: "c1" },
    });

    const list = await sourceRepo.listSources(api);
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ id: "abc", scopes: [{ courseId: "c1" }], refCount: 1 });

    const text = await sourceRepo.getSourceText(api, "abc");
    expect(text).toBe("hello world");

    const blob = await sourceRepo.getSourceBlob(api, "abc");
    expect(blob?.base64).toBe(Buffer.from("hello").toString("base64"));

    const meta = await sourceRepo.getSource(api, "abc");
    // Metadata must never embed the extracted text.
    expect(meta?.extractedText).toBeUndefined();
  });

  it("deduplicates by id and merges new scopes", async () => {
    const input = {
      metadata: textMeta("dup"),
      extractedText: "x",
      blobBase64: "eA==",
      blobExt: "txt",
    };
    await sourceRepo.createSource(api, { ...input, scope: { courseId: "c1" } });
    await sourceRepo.createSource(api, { ...input, scope: { courseId: "c2" } });

    const list = await sourceRepo.listSources(api);
    expect(list).toHaveLength(1);
    expect(list[0].scopes).toEqual([{ courseId: "c1" }, { courseId: "c2" }]);
    expect(list[0].refCount).toBe(2);
  });

  it("filters listSources by course scope", async () => {
    await sourceRepo.createSource(api, {
      metadata: textMeta("a"),
      blobBase64: "eA==",
      blobExt: "txt",
      scope: { courseId: "c1" },
    });
    await sourceRepo.createSource(api, {
      metadata: textMeta("b"),
      blobBase64: "eA==",
      blobExt: "txt",
      scope: { courseId: "c2" },
    });

    const scoped = await sourceRepo.listSources(api, { courseId: "c1" });
    expect(scoped.map((s) => s.id)).toEqual(["a"]);
  });

  it("detaches a scope but keeps the source while other scopes remain", async () => {
    const input = {
      metadata: textMeta("multi"),
      blobBase64: "eA==",
      blobExt: "txt",
    };
    await sourceRepo.createSource(api, { ...input, scope: { courseId: "c1" } });
    await sourceRepo.createSource(api, { ...input, scope: { courseId: "c2" } });

    await sourceRepo.deleteSource(api, "multi", { courseId: "c1" });
    const still = await sourceRepo.getSource(api, "multi");
    expect(still?.scopes).toEqual([{ courseId: "c2" }]);

    await sourceRepo.deleteSource(api, "multi", { courseId: "c2" });
    expect(await sourceRepo.getSource(api, "multi")).toBeNull();
  });

  it("fully deletes source, text and blob when no scope is given", async () => {
    await sourceRepo.createSource(api, {
      metadata: textMeta("gone"),
      extractedText: "bye",
      blobBase64: "eA==",
      blobExt: "txt",
    });
    await sourceRepo.deleteSource(api, "gone");
    expect(await sourceRepo.getSource(api, "gone")).toBeNull();
    expect(await sourceRepo.getSourceText(api, "gone")).toBeNull();
    expect(await sourceRepo.getSourceBlob(api, "gone")).toBeNull();
  });

  it("builds hydration payloads: text for text sources, base64 for native", async () => {
    await sourceRepo.createSource(api, {
      metadata: textMeta("doc"),
      extractedText: "doc body",
      blobBase64: "eA==",
      blobExt: "txt",
    });
    await sourceRepo.createSource(api, {
      metadata: textMeta("img", {
        kind: "image",
        delivery: "native",
        mimeType: "image/png",
        label: "shot.png",
      }),
      blobBase64: Buffer.from("PNG").toString("base64"),
      blobExt: "png",
    });

    const payloads = await sourceRepo.loadHydrationPayloads(api, ["doc", "img"]);
    const doc = payloads.find((p) => p.id === "doc");
    const img = payloads.find((p) => p.id === "img");

    expect(doc?.extractedText).toBe("doc body");
    expect(doc?.blobBase64).toBeUndefined();
    expect(img?.blobBase64).toBe(Buffer.from("PNG").toString("base64"));
    expect(img?.extractedText).toBeUndefined();
  });

  it("omits non-ready sources from hydration payloads", async () => {
    await sourceRepo.createSource(api, {
      metadata: textMeta("bad", { status: "error", error: "nope" }),
      blobBase64: "eA==",
      blobExt: "txt",
    });
    const payloads = await sourceRepo.loadHydrationPayloads(api, ["bad"]);
    expect(payloads).toHaveLength(0);
  });
});
