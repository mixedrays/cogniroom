import { spawn, type ChildProcess } from "child_process";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import puppeteer, {
  type Browser,
  type Page,
  type ConsoleMessage,
  type HTTPRequest,
} from "puppeteer";
import { describe, it, expect, beforeAll, afterAll } from "vitest";

/**
 * Browser-storage-mode acceptance (design §6, §8.10). Boots a dev server with
 * `STORAGE_MODE=browser` on its own port, seeds a course+lesson straight into
 * the authoritative IndexedDB store (`cogniroom-data`, the exact on-disk
 * layout), then deep-links to the lesson on a fresh tab. Asserts the lesson
 * renders from IndexedDB with zero console errors, no hydration warnings, and
 * no server 500s — and that it survives a reload (persistence).
 *
 * Deterministic on purpose: it drives the read/persistence path (mode dispatch
 * → local repo → IndexedDB), not LLM generation, so it needs no API keys.
 */

const PORT = 3100;
const APP_URL = `http://localhost:${PORT}`;
const ARTIFACTS_DIR = join(process.cwd(), "artifacts", "console");
const FIXTURE_DIR = join(import.meta.dirname, "fixtures");

const COURSE_ID = "e2e-fixture-course";
const LESSON_ID = "e2e-fixture-lesson";
const LESSON_URL = `${APP_URL}/course/${COURSE_ID}/lesson/${LESSON_ID}`;
const LESSON_MARKER = "Some content for testing purposes.";

type LogEntry = { type: string; text: string; url?: string };
type ErrorEntry = { message: string };
type FailedRequest = { url: string; errorText: string };

interface PageLogs {
  consoleLogs: LogEntry[];
  pageErrors: ErrorEntry[];
  failedRequests: FailedRequest[];
  serverErrors: { url: string; status: number }[];
}

function attachCollectors(page: Page): PageLogs {
  const logs: PageLogs = {
    consoleLogs: [],
    pageErrors: [],
    failedRequests: [],
    serverErrors: [],
  };
  page.on("console", (msg: ConsoleMessage) =>
    logs.consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
      url: msg.location().url,
    })
  );
  page.on("pageerror", (error: unknown) =>
    logs.pageErrors.push({
      message: error instanceof Error ? error.message : String(error),
    })
  );
  page.on("requestfailed", (request: HTTPRequest) =>
    logs.failedRequests.push({
      url: request.url(),
      errorText: request.failure()?.errorText ?? "unknown",
    })
  );
  page.on("response", (res) => {
    if (res.status() >= 500) {
      logs.serverErrors.push({ url: res.url(), status: res.status() });
    }
  });
  return logs;
}

/** Seed a file into the browser-mode IndexedDB store, mirroring the adapter. */
async function seedFile(page: Page, path: string, content: string) {
  await page.evaluate(
    async ({ path, content }) => {
      const contentType = path.endsWith(".json")
        ? "application/json"
        : path.endsWith(".md")
          ? "text/markdown"
          : "text/plain";
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const req = indexedDB.open("cogniroom-data", 1);
        req.onupgradeneeded = () => {
          const d = req.result;
          if (!d.objectStoreNames.contains("files")) {
            d.createObjectStore("files", { keyPath: "path" });
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction("files", "readwrite");
        const now = Date.now();
        tx.objectStore("files").put({
          path,
          content,
          contentType,
          size: content.length,
          createdAt: now,
          modifiedAt: now,
        });
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      db.close();
    },
    { path, content }
  );
}

async function waitForBrowserMode(timeoutMs = 60000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${APP_URL}/api/config`);
      if (res.ok) {
        const json = (await res.json()) as { storageMode?: string };
        if (json.storageMode === "browser") return;
      }
    } catch {
      // not ready
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`Browser-mode server on ${APP_URL} did not start in time`);
}

function saveArtifact(label: string, logs: PageLogs) {
  mkdirSync(ARTIFACTS_DIR, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  writeFileSync(
    join(ARTIFACTS_DIR, `${ts}-${label}.json`),
    JSON.stringify(logs, null, 2)
  );
}

function assertClean(logs: PageLogs) {
  const errors = logs.consoleLogs.filter((l) => l.type === "error");
  const hydrationWarnings = logs.consoleLogs.filter(
    (l) =>
      /hydrat/i.test(l.text) ||
      /did not match/i.test(l.text) ||
      /Text content does not match/i.test(l.text)
  );
  expect(errors, JSON.stringify(errors, null, 2)).toHaveLength(0);
  expect(
    hydrationWarnings,
    JSON.stringify(hydrationWarnings, null, 2)
  ).toHaveLength(0);
  expect(logs.pageErrors, JSON.stringify(logs.pageErrors, null, 2)).toHaveLength(
    0
  );
  expect(
    logs.serverErrors,
    JSON.stringify(logs.serverErrors, null, 2)
  ).toHaveLength(0);
}

describe("browser storage mode", () => {
  let server: ChildProcess;
  let browser: Browser;

  beforeAll(async () => {
    server = spawn("npx", ["vite", "dev", "--port", String(PORT)], {
      stdio: "pipe",
      shell: true,
      env: { ...process.env, NODE_ENV: "development", STORAGE_MODE: "browser" },
    });
    await waitForBrowserMode();

    browser = await puppeteer.launch({ headless: true });

    // Establish origin + let the app open the IndexedDB store, then seed the
    // course/lesson into it using the exact storage-path layout.
    const seedPage = await browser.newPage();
    await seedPage.goto(APP_URL, { waitUntil: "networkidle2" });
    await seedFile(
      seedPage,
      `courses/${COURSE_ID}/course.md`,
      readFileSync(join(FIXTURE_DIR, "course.md"), "utf8")
    );
    await seedFile(
      seedPage,
      `courses/${COURSE_ID}/lessons/${LESSON_ID}/lesson.md`,
      readFileSync(join(FIXTURE_DIR, "lesson.md"), "utf8")
    );
    await seedPage.close();
  }, 90000);

  afterAll(async () => {
    await browser?.close();
    server?.kill("SIGTERM");
  });

  it("deep-links to the lesson and renders it from IndexedDB, cleanly", async () => {
    const page = await browser.newPage();
    const logs = attachCollectors(page);
    try {
      await page.goto(LESSON_URL, { waitUntil: "networkidle2" });
      await page.waitForFunction(
        (marker: string) => document.body.innerText.includes(marker),
        { timeout: 15000 },
        LESSON_MARKER
      );
      const rendered = await page.evaluate(() => document.body.innerText);
      expect(rendered).toContain(LESSON_MARKER);
    } finally {
      saveArtifact("browser-mode-lesson", logs);
      await page.close();
    }
    assertClean(logs);
  });

  it("persists across reload", async () => {
    const page = await browser.newPage();
    const logs = attachCollectors(page);
    try {
      await page.goto(LESSON_URL, { waitUntil: "networkidle2" });
      await page.waitForFunction(
        (marker: string) => document.body.innerText.includes(marker),
        { timeout: 15000 },
        LESSON_MARKER
      );
      await page.reload({ waitUntil: "networkidle2" });
      await page.waitForFunction(
        (marker: string) => document.body.innerText.includes(marker),
        { timeout: 15000 },
        LESSON_MARKER
      );
      const rendered = await page.evaluate(() => document.body.innerText);
      expect(rendered).toContain(LESSON_MARKER);
    } finally {
      saveArtifact("browser-mode-reload", logs);
      await page.close();
    }
    assertClean(logs);
  });
});
