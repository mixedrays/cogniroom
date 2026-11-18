import type { GeneratedModel } from "../../src/lib/llm-models/types";

export const CATALOG_URL = "https://openrouter.ai/api/v1/models";

type RawCatalogModel = {
  id: string;
  name: string;
  created?: number;
  description?: string;
  context_length?: number | null;
  architecture?: { input_modalities?: string[] };
  pricing?: Record<string, string | undefined>;
  top_provider?: { max_completion_tokens?: number | null };
  supported_parameters?: string[];
  knowledge_cutoff?: string | null;
  expiration_date?: string | null;
};

/** Trimmed OpenRouter catalog entry; only the fields the app uses. */
export type CatalogModel = {
  id: string;
  name: string;
  releasedAt?: string;
  description?: string;
  contextLength?: number;
  maxOutputTokens?: number;
  pricing: GeneratedModel["pricing"];
  inputModalities: string[];
  tools: boolean;
  reasoning: boolean;
  knowledgeCutoff?: string;
  expiresAt?: string;
};

export type CatalogSnapshot = {
  source: string;
  fetchedAt: string;
  models: CatalogModel[];
};

export function vendorOf(catalogId: string): string {
  return catalogId.split("/")[0];
}

// Catalog prices are per-token strings; per-1M numbers keep diffs readable.
function perMillion(perToken: string | undefined): number | undefined {
  if (perToken === undefined) return undefined;
  const value = Number(perToken);
  if (!Number.isFinite(value) || value < 0) return undefined;
  return Math.round(value * 1e12) / 1e6;
}

function shortDescription(text: string | undefined): string | undefined {
  const flat = text?.replace(/\s+/g, " ").trim();
  if (!flat) return undefined;
  const sentence = flat.match(/^.+?[.!?](?=\s|$)/)?.[0] ?? flat;
  if (sentence.length <= 200) return sentence;
  return `${sentence.slice(0, 199).replace(/\s+\S*$/, "")}…`;
}

function toCatalogModel(raw: RawCatalogModel): CatalogModel | undefined {
  const input = perMillion(raw.pricing?.prompt);
  const output = perMillion(raw.pricing?.completion);
  // Routers ("openrouter/auto") report variable pricing as -1; not pickable.
  if (input === undefined || output === undefined) return undefined;

  const params = raw.supported_parameters ?? [];
  return {
    id: raw.id,
    name: raw.name,
    releasedAt: raw.created
      ? new Date(raw.created * 1000).toISOString().slice(0, 10)
      : undefined,
    description: shortDescription(raw.description),
    contextLength: raw.context_length ?? undefined,
    maxOutputTokens: raw.top_provider?.max_completion_tokens ?? undefined,
    pricing: {
      input,
      output,
      cacheRead: perMillion(raw.pricing?.input_cache_read),
      cacheWrite: perMillion(raw.pricing?.input_cache_write),
    },
    inputModalities: [...(raw.architecture?.input_modalities ?? [])].sort(),
    tools: params.includes("tools"),
    reasoning: params.includes("reasoning"),
    knowledgeCutoff: raw.knowledge_cutoff ?? undefined,
    expiresAt: raw.expiration_date ?? undefined,
  };
}

/** Keeps only the configured vendors' models, trimmed and sorted by id for stable diffs. */
export function trimCatalog(
  raw: unknown,
  vendors: readonly string[]
): CatalogModel[] {
  const data = (raw as { data?: unknown } | null)?.data;
  if (!Array.isArray(data)) {
    throw new Error("Unexpected catalog response: missing `data` array");
  }
  const keep = new Set(vendors);
  return (data as RawCatalogModel[])
    .filter(
      (m) =>
        typeof m?.id === "string" &&
        keep.has(vendorOf(m.id)) &&
        // Batch-API variants duplicate every model and aren't usable for chat.
        !m.id.endsWith(":batch")
    )
    .map(toCatalogModel)
    .filter((m): m is CatalogModel => m !== undefined)
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

/** Pretty JSON with one collection entry per line, so a diff shows one changed line per model. */
export function toLineJson(
  head: Record<string, unknown>,
  key: string,
  items: unknown[] | Record<string, unknown>
): string {
  const lines = Object.entries(head).map(
    ([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)},`
  );
  const entries = Array.isArray(items)
    ? items.map((item) => `    ${JSON.stringify(item)}`)
    : Object.entries(items).map(
        ([k, v]) => `    ${JSON.stringify(k)}: ${JSON.stringify(v)}`
      );
  const [open, close] = Array.isArray(items) ? ["[", "]"] : ["{", "}"];
  return [
    "{",
    ...lines,
    `  ${JSON.stringify(key)}: ${open}`,
    entries.join(",\n"),
    `  ${close}`,
    "}",
    "",
  ].join("\n");
}
