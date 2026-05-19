import { beforeEach, describe, expect, it } from "vitest";
import "fake-indexeddb/auto";
import { IDBFactory } from "fake-indexeddb";
import { IndexedDBAdapter } from "../adapters/indexeddb";

interface Course {
  id: string;
  title: string;
}

function makeAdapter(name = `test-${Math.random().toString(36).slice(2)}`) {
  return new IndexedDBAdapter({
    adapter: "indexeddb",
    databaseName: name,
    storeName: "entries",
  });
}

beforeEach(() => {
  // Reset the in-memory IndexedDB between tests
  (globalThis as unknown as { indexedDB: IDBFactory }).indexedDB =
    new IDBFactory();
});

describe("IndexedDBAdapter", () => {
  it("writes and reads back a string (markdown)", async () => {
    const adapter = makeAdapter();
    const write = await adapter.execute({
      path: "courses/abc/course.md",
      method: "POST",
      body: "# Hello",
      headers: {},
      options: {},
    });
    expect(write.ok).toBe(true);
    expect(write.status).toBe(201);

    const read = await adapter.execute<string>({
      path: "courses/abc/course.md",
      method: "GET",
      headers: {},
      options: {},
    });
    expect(read.ok).toBe(true);
    expect(await read.text()).toBe("# Hello");
  });

  it("auto-parses JSON content on GET", async () => {
    const adapter = makeAdapter();
    const data: Course = { id: "abc", title: "Test" };
    await adapter.execute({
      path: "courses/abc/course.json",
      method: "POST",
      body: data,
      headers: {},
      options: {},
    });

    const read = await adapter.execute<Course>({
      path: "courses/abc/course.json",
      method: "GET",
      headers: {},
      options: {},
    });
    expect(read.ok).toBe(true);
    expect(await read.json()).toEqual(data);
  });

  it("returns 404 for missing path", async () => {
    const adapter = makeAdapter();
    const read = await adapter.execute({
      path: "nope.json",
      method: "GET",
      headers: {},
      options: {},
    });
    expect(read.ok).toBe(false);
    expect(read.status).toBe(404);
  });

  it("HEAD reports existence", async () => {
    const adapter = makeAdapter();
    await adapter.execute({
      path: "a.txt",
      method: "PUT",
      body: "x",
      headers: {},
      options: {},
    });
    const present = await adapter.execute({
      path: "a.txt",
      method: "HEAD",
      headers: {},
      options: {},
    });
    expect(present.ok).toBe(true);

    const missing = await adapter.execute({
      path: "b.txt",
      method: "HEAD",
      headers: {},
      options: {},
    });
    expect(missing.ok).toBe(false);
    expect(missing.status).toBe(404);
  });

  it("deletes a single entry", async () => {
    const adapter = makeAdapter();
    await adapter.execute({
      path: "x.md",
      method: "POST",
      body: "x",
      headers: {},
      options: {},
    });
    const del = await adapter.execute({
      path: "x.md",
      method: "DELETE",
      headers: {},
      options: {},
    });
    expect(del.ok).toBe(true);
    expect(del.status).toBe(204);

    expect(await adapter.exists("x.md")).toBe(false);
  });

  it("recursive delete removes a directory subtree", async () => {
    const adapter = makeAdapter();
    await adapter.execute({
      path: "courses/abc/course.md",
      method: "POST",
      body: "a",
      headers: {},
      options: {},
    });
    await adapter.execute({
      path: "courses/abc/lessons/l1.md",
      method: "POST",
      body: "b",
      headers: {},
      options: {},
    });
    await adapter.execute({
      path: "courses/other/c.md",
      method: "POST",
      body: "c",
      headers: {},
      options: {},
    });

    const del = await adapter.execute({
      path: "courses/abc",
      method: "DELETE",
      headers: {},
      options: { recursive: true },
    });
    expect(del.ok).toBe(true);

    expect(await adapter.exists("courses/abc/course.md")).toBe(false);
    expect(await adapter.exists("courses/abc/lessons/l1.md")).toBe(false);
    expect(await adapter.exists("courses/other/c.md")).toBe(true);
  });

  it("list returns direct files and child directories", async () => {
    const adapter = makeAdapter();
    await adapter.execute({
      path: "courses/abc/course.md",
      method: "POST",
      body: "a",
      headers: {},
      options: {},
    });
    await adapter.execute({
      path: "courses/abc/lessons/l1.md",
      method: "POST",
      body: "b",
      headers: {},
      options: {},
    });
    await adapter.execute({
      path: "courses/def/course.md",
      method: "POST",
      body: "c",
      headers: {},
      options: {},
    });

    const top = await adapter.list("courses");
    const names = top.map((e) => e.name).sort();
    expect(names).toEqual(["abc", "def"]);
    expect(top.every((e) => e.isDirectory)).toBe(true);

    const inside = await adapter.list("courses/abc");
    const insideNames = inside.map((e) => e.name).sort();
    expect(insideNames).toEqual(["course.md", "lessons"]);
  });

  it("list with extension filter", async () => {
    const adapter = makeAdapter();
    await adapter.execute({
      path: "data/a.json",
      method: "POST",
      body: "{}",
      headers: {},
      options: {},
    });
    await adapter.execute({
      path: "data/b.md",
      method: "POST",
      body: "x",
      headers: {},
      options: {},
    });

    const json = await adapter.list("data", {
      directories: false,
      extension: ".json",
    });
    expect(json.map((e) => e.name)).toEqual(["a.json"]);
  });

  it("stat returns file metadata for a written entry", async () => {
    const adapter = makeAdapter();
    await adapter.execute({
      path: "x.md",
      method: "POST",
      body: "hello",
      headers: {},
      options: {},
    });
    const meta = await adapter.stat("x.md");
    expect(meta).not.toBeNull();
    expect(meta!.name).toBe("x.md");
    expect(meta!.isDirectory).toBe(false);
    expect(meta!.size).toBe("hello".length);
  });

  it("stat returns directory metadata for a path that only has children", async () => {
    const adapter = makeAdapter();
    await adapter.execute({
      path: "courses/abc/course.md",
      method: "POST",
      body: "a",
      headers: {},
      options: {},
    });
    const meta = await adapter.stat("courses");
    expect(meta).not.toBeNull();
    expect(meta!.isDirectory).toBe(true);
  });

  it("PUT updates an existing entry without changing createdAt", async () => {
    const adapter = makeAdapter();
    await adapter.execute({
      path: "x.md",
      method: "POST",
      body: "v1",
      headers: {},
      options: {},
    });
    const first = await adapter.stat("x.md");

    await new Promise((r) => setTimeout(r, 5));

    const put = await adapter.execute({
      path: "x.md",
      method: "PUT",
      body: "v2",
      headers: {},
      options: {},
    });
    expect(put.ok).toBe(true);
    expect(put.status).toBe(200);

    const second = await adapter.stat("x.md");
    expect(second!.createdAt.getTime()).toBe(first!.createdAt.getTime());
    expect(second!.modifiedAt.getTime()).toBeGreaterThanOrEqual(
      first!.modifiedAt.getTime()
    );

    const read = await adapter.execute({
      path: "x.md",
      method: "GET",
      headers: {},
      options: {},
    });
    expect(await read.text()).toBe("v2");
  });
});
