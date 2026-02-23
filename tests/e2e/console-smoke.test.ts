import puppeteer, {
  type Browser,
  type Page,
  type ConsoleMessage,
  type HTTPRequest,
} from "puppeteer";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const APP_URL = "http://localhost:3000";
const ARTIFACTS_DIR = join(process.cwd(), "artifacts", "console");

describe("console smoke", () => {
  let browser: Browser;
  let page: Page;

  const consoleLogs: { type: string; text: string; url?: string }[] = [];
  const pageErrors: { message: string; stack?: string }[] = [];
  const failedRequests: { url: string; errorText: string }[] = [];

  beforeAll(async () => {
    mkdirSync(ARTIFACTS_DIR, { recursive: true });

    browser = await puppeteer.launch({ headless: true });
    page = await browser.newPage();

    page.on("console", (msg: ConsoleMessage) => {
      consoleLogs.push({
        type: msg.type(),
        text: msg.text(),
        url: msg.location().url,
      });
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

    await page.goto(APP_URL, { waitUntil: "networkidle0" });
  });

  afterAll(async () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    writeFileSync(
      join(ARTIFACTS_DIR, `${timestamp}-console.json`),
      JSON.stringify({ consoleLogs, pageErrors, failedRequests }, null, 2)
    );
    await browser?.close();
  });

  it("has no console errors", () => {
    const errors = consoleLogs.filter((l) => l.type === "error");
    expect(errors, JSON.stringify(errors, null, 2)).toHaveLength(0);
  });

  it("has no page errors", () => {
    expect(pageErrors, JSON.stringify(pageErrors, null, 2)).toHaveLength(0);
  });

  it("has no failed requests", () => {
    expect(failedRequests, JSON.stringify(failedRequests, null, 2)).toHaveLength(0);
  });
});
