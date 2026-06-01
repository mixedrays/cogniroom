import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdir, rm, writeFile, readdir } from "node:fs/promises";
import { join } from "node:path";

const historyDir = vi.hoisted(() => {
  const base = (process.env.TMPDIR || "/tmp").replace(/\/$/, "");
  return `${base}/history-test-${Date.now()}-${Math.random().toString(36).slice(2)}`;
});

vi.mock("@root/server/env", () => ({ HISTORY_DIR: historyDir }));

import {
  listSessions,
  readSession,
  writeSession,
  deleteSession,
  type Session,
  type SessionScope,
} from "../historyService";

const root = join(historyDir, "wizard-agent");

function makeSession(over: Partial<Session> = {}): Session {
  return {
    id: "s1",
    title: "Session",
    createdAt: 1,
    updatedAt: 1,
    scope: { contentType: "roadmap" },
    messages: [],
    ...over,
  };
}

beforeEach(async () => {
  await mkdir(historyDir, { recursive: true });
});

afterEach(async () => {
  await rm(historyDir, { recursive: true, force: true });
});

describe("writeSession / readSession scope routing", () => {
  it("round-trips a roadmap session under the roadmap dir", async () => {
    const scope: SessionScope = { contentType: "roadmap" };
    const session = makeSession({ id: "r1", scope });
    await writeSession(scope, session);

    expect(await readSession(scope, "r1")).toEqual(session);
    expect(await readdir(join(root, "roadmap"))).toContain("r1.json");
  });

  it("routes standalone deck flashcards/quiz to the decks dir", async () => {
    const scope: SessionScope = { contentType: "flashcards" };
    await writeSession(scope, makeSession({ id: "d1", scope }));

    expect(await readdir(join(root, "decks", "flashcards"))).toContain(
      "d1.json"
    );
  });

  it("routes course/lesson scoped sessions under the courses tree", async () => {
    const scope: SessionScope = {
      contentType: "lesson",
      courseId: "c1",
      lessonId: "l1",
    };
    await writeSession(scope, makeSession({ id: "x1", scope }));

    expect(
      await readdir(join(root, "courses", "c1", "lessons", "l1", "lesson"))
    ).toContain("x1.json");
  });

  it("sanitizes unsafe path segments", async () => {
    const scope: SessionScope = {
      contentType: "lesson",
      courseId: "c/1",
      lessonId: "l 1",
    };
    await writeSession(scope, makeSession({ id: "a/b", scope }));

    expect(
      await readdir(join(root, "courses", "c_1", "lessons", "l_1", "lesson"))
    ).toContain("a_b.json");
    expect(await readSession(scope, "a/b")).not.toBeNull();
  });

  it("throws when a course-scoped contentType lacks courseId/lessonId", async () => {
    await expect(
      writeSession({ contentType: "lesson" }, makeSession())
    ).rejects.toThrow(/requires courseId and lessonId/);
  });

  it("returns null when reading a missing session", async () => {
    expect(await readSession({ contentType: "roadmap" }, "missing")).toBeNull();
  });
});

describe("listSessions", () => {
  const scope: SessionScope = { contentType: "roadmap" };

  it("returns an empty array when the scope dir does not exist", async () => {
    expect(await listSessions(scope)).toEqual([]);
  });

  it("returns metadata (without messages) sorted by createdAt descending", async () => {
    await writeSession(
      scope,
      makeSession({ id: "old", createdAt: 100, messages: [] })
    );
    await writeSession(
      scope,
      makeSession({ id: "new", createdAt: 200, messages: [] })
    );

    const metas = await listSessions(scope);
    expect(metas.map((m) => m.id)).toEqual(["new", "old"]);
    expect(metas[0]).not.toHaveProperty("messages");
  });

  it("skips corrupt files and ignores non-json entries", async () => {
    await writeSession(scope, makeSession({ id: "good" }));
    await writeFile(join(root, "roadmap", "broken.json"), "{not json");
    await writeFile(join(root, "roadmap", "note.txt"), "ignored");

    const metas = await listSessions(scope);
    expect(metas.map((m) => m.id)).toEqual(["good"]);
  });
});

describe("deleteSession", () => {
  const scope: SessionScope = { contentType: "roadmap" };

  it("removes the stored session", async () => {
    await writeSession(scope, makeSession({ id: "gone" }));
    await deleteSession(scope, "gone");
    expect(await readSession(scope, "gone")).toBeNull();
  });

  it("does not throw when the session is already absent", async () => {
    await expect(deleteSession(scope, "ghost")).resolves.toBeUndefined();
  });
});
