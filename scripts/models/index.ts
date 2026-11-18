/**
 * Model catalog tooling.
 *
 *   npm run models:update [-- --skip-deps]
 *     1. npm update AI SDKs within their current majors (new model ids in types)
 *     2. fetch OpenRouter catalog → models.catalog.json (trimmed snapshot)
 *     3. build models.generated.json from snapshot + models.config.ts
 *     4. typecheck + llm-models tests
 *     5. print a review summary; nothing is committed
 *
 *   npm run models:build
 *     Offline: rebuild models.generated.json after editing models.config.ts.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { modelsConfig } from "../../src/lib/llm-models/models.config";
import type { GeneratedModels } from "../../src/lib/llm-models/types";
import {
  CATALOG_URL,
  toLineJson,
  trimCatalog,
  type CatalogSnapshot,
} from "./catalog";
import { buildModels, type BuildResult } from "./build";
import { formatUpdateSummary, type CheckResult } from "./summary";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const MODELS_DIR = `${ROOT}src/lib/llm-models`;
const CATALOG_PATH = `${MODELS_DIR}/models.catalog.json`;
const GENERATED_PATH = `${MODELS_DIR}/models.generated.json`;
const SDK_PACKAGES = [
  "ai",
  "@ai-sdk/openai",
  "@ai-sdk/anthropic",
  "@openrouter/ai-sdk-provider",
];

function readJson<T>(path: string): T | undefined {
  return existsSync(path)
    ? (JSON.parse(readFileSync(path, "utf8")) as T)
    : undefined;
}

function installedVersion(pkg: string): string | undefined {
  return readJson<{ version: string }>(
    `${ROOT}node_modules/${pkg}/package.json`
  )?.version;
}

function run(command: string, args: string[], capture = false) {
  const result = spawnSync(command, args, {
    cwd: ROOT,
    encoding: "utf8",
    stdio: capture ? "pipe" : "inherit",
    env: { ...process.env, npm_config_update_notifier: "false" },
  });
  return {
    ok: result.status === 0,
    output: `${result.stdout ?? ""}${result.stderr ?? ""}`,
  };
}

function check(name: string, command: string, args: string[]): CheckResult {
  console.log(`› ${name}…`);
  return { name, ...run(command, args, true) };
}

async function fetchCatalog(): Promise<CatalogSnapshot> {
  console.log(`› Fetching ${CATALOG_URL}…`);
  const response = await fetch(CATALOG_URL, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) {
    throw new Error(
      `Catalog fetch failed: ${response.status} ${response.statusText}`
    );
  }
  return {
    source: CATALOG_URL,
    fetchedAt: new Date().toISOString(),
    models: trimCatalog(await response.json(), modelsConfig.catalogVendors),
  };
}

function writeGenerated({ generated, errors }: BuildResult): void {
  if (errors.length) return;
  const { models, ...head } = generated;
  writeFileSync(GENERATED_PATH, toLineJson(head, "models", models));
}

function build(): void {
  const catalog = readJson<CatalogSnapshot>(CATALOG_PATH);
  if (!catalog) {
    throw new Error(
      "models.catalog.json not found; run `npm run models:update` first."
    );
  }
  const result = buildModels(catalog, modelsConfig);
  result.warnings.forEach((w) => console.warn(`⚠ ${w}`));
  result.errors.forEach((e) => console.error(`✖ ${e}`));
  writeGenerated(result);
  if (result.errors.length) {
    process.exitCode = 1;
    return;
  }
  console.log(
    `✔ ${Object.keys(result.generated.models).length} models → models.generated.json`
  );
}

async function update(skipDeps: boolean): Promise<void> {
  const before = SDK_PACKAGES.map(installedVersion);
  if (!skipDeps) {
    console.log("› Updating AI SDKs within their current major versions…");
    if (!run("npm", ["update", "--save", ...SDK_PACKAGES]).ok) {
      throw new Error("npm update failed");
    }
  }
  const sdk = SDK_PACKAGES.map((name, i) => ({
    name,
    from: before[i],
    to: installedVersion(name),
  }));

  const prevCatalog = readJson<CatalogSnapshot>(CATALOG_PATH);
  const prevModels = readJson<GeneratedModels>(GENERATED_PATH)?.models;
  const nextCatalog = await fetchCatalog();
  const { models, ...head } = nextCatalog;
  writeFileSync(CATALOG_PATH, toLineJson(head, "models", models));

  const result = buildModels(nextCatalog, modelsConfig);
  writeGenerated(result);

  const checks = [
    check("typecheck", "npx", ["tsc", "--noEmit"]),
    check("llm-models tests", "npx", ["vitest", "run", "src/lib/llm-models"]),
  ];

  console.log(
    formatUpdateSummary({
      sdk,
      prevCatalog,
      nextCatalog,
      prevModels,
      nextModels: result.errors.length ? undefined : result.generated.models,
      errors: result.errors,
      warnings: result.warnings,
      checks,
    })
  );
  if (result.errors.length || checks.some((c) => !c.ok)) process.exitCode = 1;
}

const [command = "update", ...flags] = process.argv.slice(2);

try {
  if (command === "build") build();
  else if (command === "update") await update(flags.includes("--skip-deps"));
  else throw new Error(`Unknown command "${command}"; use "update" or "build".`);
} catch (error) {
  console.error(`✖ ${error instanceof Error ? error.message : error}`);
  process.exitCode = 1;
}
