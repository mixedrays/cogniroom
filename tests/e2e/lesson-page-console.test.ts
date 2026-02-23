import puppeteer, {
  type Browser,
  type Page,
  type ConsoleMessage,
  type HTTPRequest,
} from "puppeteer";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "fs";
import { join } from "path";

const APP_URL = "http://localhost:3000";
const ARTIFACTS_DIR = join(process.cwd(), "artifacts", "console");

const FIXTURE_COURSE_ID = "e2e-fixture-course";
const FIXTURE_LESSON_ID = "e2e-fixture-lesson";
const FIXTURE_DIR = join(import.meta.dirname, "fixtures");
const DATA_COURSE_DIR = join(process.cwd(), "data", "courses", FIXTURE_COURSE_ID);

const LESSON_BASE_URL = `${APP_URL}/course/${FIXTURE_COURSE_ID}/lesson/${FIXTURE_LESSON_ID}`;

type LogEntry = { type: string; text: string; url?: string };
type ErrorEntry = { message: string; stack?: string };
type FailedRequest = { url: string; errorText: string };

interface PageLogs {
  consoleLogs: LogEntry[];
  pageErrors: ErrorEntry[];
  failedRequests: FailedRequest[];
}

function attachLogCollectors(page: Page): PageLogs {
  const consoleLogs: LogEntry[] = [];
  const pageErrors: ErrorEntry[] = [];
  const failedRequests: FailedRequest[] = [];

  page.on("console", (msg: ConsoleMessage) => {
    consoleLogs.push({ type: msg.type(), text: msg.text(), url: msg.location().url });
  });

  page.on("pageerror", (error: unknown) => {
    const err = error instanceof Error ? error : new Error(String(error));
    pageErrors.push({ message: err.message, stack: err.stack });
  });

  page.on("requestfailed", (request: HTTPRequest) => {
    failedRequests.push({
      url: request.url(),
      errorText: request.failure()?.errorText ?? "unknown",
    });
  });

  return { consoleLogs, pageErrors, failedRequests };
}

async function navigateAndCollect(
  browser: Browser,
  url: string,
  artifactLabel: string
): Promise<PageLogs> {
  const page = await browser.newPage();
  const logs = attachLogCollectors(page);

  try {
    await page.goto(url, { waitUntil: "networkidle0" });
  } finally {
    mkdirSync(ARTIFACTS_DIR, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    writeFileSync(
      join(ARTIFACTS_DIR, `${timestamp}-${artifactLabel}.json`),
      JSON.stringify(logs, null, 2)
    );
    await page.close();
  }

  return logs;
}

describe("lesson page console", () => {
  let browser: Browser;

  beforeAll(async () => {
    // Install fixture data into the data directory so the running dev server can serve it
    const lessonDir = join(DATA_COURSE_DIR, "lessons", FIXTURE_LESSON_ID);
    mkdirSync(lessonDir, { recursive: true });

    writeFileSync(
      join(DATA_COURSE_DIR, "course.json"),
      readFileSync(join(FIXTURE_DIR, "course.json"), "utf8")
    );
    writeFileSync(
      join(lessonDir, "lesson.md"),
      readFileSync(join(FIXTURE_DIR, "lesson.md"), "utf8")
    );

    browser = await puppeteer.launch({ headless: true });
  });

  afterAll(async () => {
    await browser?.close();
    rmSync(DATA_COURSE_DIR, { recursive: true, force: true });
  });

  it("has no console errors on theory tab", async () => {
    const { consoleLogs, pageErrors, failedRequests } = await navigateAndCollect(
      browser,
      LESSON_BASE_URL,
      "lesson-theory"
    );

    const errors = consoleLogs.filter((l) => l.type === "error");
    expect(errors, JSON.stringify(errors, null, 2)).toHaveLength(0);
    expect(pageErrors, JSON.stringify(pageErrors, null, 2)).toHaveLength(0);
    expect(failedRequests, JSON.stringify(failedRequests, null, 2)).toHaveLength(0);
  });

  it("has no console errors on flashcards tab", async () => {
    const { consoleLogs, pageErrors, failedRequests } = await navigateAndCollect(
      browser,
      `${LESSON_BASE_URL}/flashcards`,
      "lesson-flashcards"
    );

    const errors = consoleLogs.filter((l) => l.type === "error");
    expect(errors, JSON.stringify(errors, null, 2)).toHaveLength(0);
    expect(pageErrors, JSON.stringify(pageErrors, null, 2)).toHaveLength(0);
    expect(failedRequests, JSON.stringify(failedRequests, null, 2)).toHaveLength(0);
  });

  it("has no console errors on quiz tab", async () => {
    const { consoleLogs, pageErrors, failedRequests } = await navigateAndCollect(
      browser,
      `${LESSON_BASE_URL}/quiz`,
      "lesson-quiz"
    );

    const errors = consoleLogs.filter((l) => l.type === "error");
    expect(errors, JSON.stringify(errors, null, 2)).toHaveLength(0);
    expect(pageErrors, JSON.stringify(pageErrors, null, 2)).toHaveLength(0);
    expect(failedRequests, JSON.stringify(failedRequests, null, 2)).toHaveLength(0);
  });

  it("has no console errors on exercises tab", async () => {
    const { consoleLogs, pageErrors, failedRequests } = await navigateAndCollect(
      browser,
      `${LESSON_BASE_URL}/exercises`,
      "lesson-exercises"
    );

    const errors = consoleLogs.filter((l) => l.type === "error");
    expect(errors, JSON.stringify(errors, null, 2)).toHaveLength(0);
    expect(pageErrors, JSON.stringify(pageErrors, null, 2)).toHaveLength(0);
    expect(failedRequests, JSON.stringify(failedRequests, null, 2)).toHaveLength(0);
  });
});
