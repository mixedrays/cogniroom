import type { GeneratedModel } from "../../src/lib/llm-models/types";
import { vendorOf, type CatalogModel, type CatalogSnapshot } from "./catalog";

export type CheckResult = { name: string; ok: boolean; output?: string };

export type UpdateSummaryInput = {
  sdk: { name: string; from?: string; to?: string }[];
  prevCatalog?: CatalogSnapshot;
  nextCatalog: CatalogSnapshot;
  prevModels?: Record<string, GeneratedModel>;
  nextModels?: Record<string, GeneratedModel>;
  errors: string[];
  warnings: string[];
  checks: CheckResult[];
};

const usd = (n: number) => `$${n}`;
const price = (p: { input: number; output: number }) =>
  `${usd(p.input)} / ${usd(p.output)}`;
const tokens = (n?: number) =>
  n === undefined
    ? "?"
    : n >= 1e6
      ? `${+(n / 1e6).toFixed(2)}M`
      : `${Math.round(n / 1e3)}K`;

function catalogLine(m: CatalogModel): string {
  return `    ${m.id.padEnd(48)} ${price(m.pricing).padEnd(18)} ctx ${tokens(m.contextLength).padEnd(6)} ${m.releasedAt ?? ""}`;
}

function section(title: string, lines: string[]): string[] {
  return lines.length ? ["", `── ${title}`, ...lines] : [];
}

export function formatUpdateSummary(input: UpdateSummaryInput): string {
  const { prevCatalog, nextCatalog, prevModels, nextModels } = input;

  const sdk = input.sdk.map(({ name, from, to }) =>
    from === to
      ? `  ${name} ${to ?? "?"} (unchanged)`
      : `  ${name} ${from ?? "?"} → ${to ?? "?"}`
  );

  const catalog: string[] = [];
  const vendorCount = new Set(nextCatalog.models.map((m) => vendorOf(m.id)))
    .size;
  catalog.push(
    `  ${nextCatalog.models.length} models from ${vendorCount} vendors, fetched ${nextCatalog.fetchedAt}`
  );
  if (!prevCatalog) {
    catalog.push("  First snapshot; no previous catalog to compare.");
  } else {
    const prevIds = new Set(prevCatalog.models.map((m) => m.id));
    const nextIds = new Set(nextCatalog.models.map((m) => m.id));
    const added = nextCatalog.models.filter((m) => !prevIds.has(m.id));
    const removed = prevCatalog.models.filter((m) => !nextIds.has(m.id));
    const pickedCatalogIds = new Set(
      Object.values(prevModels ?? {}).map((m) => m.catalogId)
    );
    if (added.length) {
      catalog.push(`  New (${added.length}):`, ...added.map(catalogLine));
    }
    if (removed.length) {
      catalog.push(
        `  Removed (${removed.length}):`,
        ...removed.map(
          (m) =>
            `    ${m.id}${pickedCatalogIds.has(m.id) ? "  ⚠ picked" : ""}`
        )
      );
    }
    if (!added.length && !removed.length) catalog.push("  No models added or removed.");
  }

  const picked: string[] = [];
  if (nextModels) {
    for (const [id, next] of Object.entries(nextModels)) {
      const prev = prevModels?.[id];
      if (!prev) {
        picked.push(`  + ${id}  ${price(next.pricing)}`);
        continue;
      }
      if (
        prev.pricing.input !== next.pricing.input ||
        prev.pricing.output !== next.pricing.output
      ) {
        picked.push(
          `  $ ${id}  ${price(prev.pricing)} → ${price(next.pricing)}`
        );
      }
      if (prev.label !== next.label) {
        picked.push(`  ~ ${id}  label "${prev.label}" → "${next.label}"`);
      }
    }
    for (const id of Object.keys(prevModels ?? {})) {
      if (!(id in nextModels)) picked.push(`  - ${id}`);
    }
    for (const [id, m] of Object.entries(nextModels)) {
      if (m.expiresAt) picked.push(`  ⚠ ${id} expires ${m.expiresAt}`);
    }
  }

  const build = [
    ...input.errors.map((e) => `  ✖ ${e}`),
    ...input.warnings.map((w) => `  ⚠ ${w}`),
  ];

  const checks = input.checks.flatMap(({ name, ok, output }) => [
    `  ${ok ? "✔" : "✖"} ${name}`,
    ...(!ok && output
      ? output
          .trimEnd()
          .split("\n")
          .slice(-15)
          .map((l) => `      ${l}`)
      : []),
  ]);

  return [
    ...section("SDKs", sdk),
    ...section("Catalog", catalog),
    ...section("Picked models (+ added, - removed, $ price, ~ label)", picked),
    ...section("Build", build),
    ...section("Checks", checks),
    "",
    "Review: git diff -- package.json package-lock.json src/lib/llm-models",
    "",
  ].join("\n");
}
