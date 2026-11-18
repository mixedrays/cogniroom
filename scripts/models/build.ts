import type {
  ModelOverride,
  ModelsConfig,
} from "../../src/lib/llm-models/models.config";
import type {
  GeneratedModel,
  GeneratedModels,
} from "../../src/lib/llm-models/types";
import { vendorOf, type CatalogModel, type CatalogSnapshot } from "./catalog";

type ProviderId = keyof ModelsConfig["providers"];

const toCatalogId: Record<ProviderId, (modelId: string) => string> = {
  openai: (id) => `openai/${id}`,
  // Anthropic API ids use dashes for the version ("claude-opus-4-7"), OpenRouter dots ("claude-opus-4.7").
  anthropic: (id) => `anthropic/${id.replace(/-(\d+)-(\d+)$/, "-$1.$2")}`,
  openrouter: (id) => id,
};

export type BuildResult = {
  generated: GeneratedModels;
  errors: string[];
  warnings: string[];
};

/** Same thresholds the selector's "$" badges always used, keyed on input price per 1M tokens. */
function priceRating(inputPerMillion: number): number {
  if (inputPerMillion === 0) return 0;
  if (inputPerMillion < 0.5) return 1;
  if (inputPerMillion < 2) return 2;
  if (inputPerMillion < 5) return 3;
  if (inputPerMillion < 15) return 4;
  return 5;
}

function splitName(name: string): { vendor?: string; label: string } {
  const i = name.indexOf(": ");
  return i < 0
    ? { label: name }
    : { vendor: name.slice(0, i), label: name.slice(i + 2) };
}

function fromCatalog(
  providerId: ProviderId,
  entry: CatalogModel,
  override: ModelOverride
): GeneratedModel {
  const { vendor = vendorOf(entry.id), label } = splitName(entry.name);
  const pricing = override.pricing ?? entry.pricing;
  return {
    providerId,
    catalogId: entry.id,
    label: override.label ?? label,
    vendor,
    hint:
      override.hint ??
      (providerId === "openrouter" ? `via OpenRouter — ${vendor}` : undefined),
    description: entry.description,
    pricing,
    priceRating: override.priceRating ?? priceRating(pricing.input),
    contextLength: entry.contextLength,
    maxOutputTokens: entry.maxOutputTokens,
    capabilities: {
      vision: entry.inputModalities.includes("image"),
      pdf: entry.inputModalities.includes("file"),
      tools: entry.tools,
      reasoning: entry.reasoning,
    },
    releasedAt: entry.releasedAt,
    knowledgeCutoff: entry.knowledgeCutoff,
    expiresAt: entry.expiresAt,
  };
}

function suggest(catalogId: string, models: CatalogModel[]): string {
  const vendor = vendorOf(catalogId);
  const sharedPrefix = (id: string) => {
    let i = 0;
    while (i < id.length && id[i] === catalogId[i]) i++;
    return i;
  };
  const close = models
    .filter((m) => vendorOf(m.id) === vendor)
    .map((m) => ({ id: m.id, score: sharedPrefix(m.id) }))
    .filter((m) => m.score > vendor.length + 3)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((m) => m.id);
  return close.length ? ` Did you mean: ${close.join(", ")}?` : "";
}

/** Resolves every picked model in the config against the catalog snapshot. Pure: no I/O. */
export function buildModels(
  catalog: CatalogSnapshot,
  config: ModelsConfig
): BuildResult {
  const byId = new Map(catalog.models.map((m) => [m.id, m]));
  const vendors = new Set(config.catalogVendors);
  const picked = new Set<string>();
  const models: Record<string, GeneratedModel> = {};
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const providerId of Object.keys(config.providers) as ProviderId[]) {
    const { name, models: picks } = config.providers[providerId];
    for (const id of picks as readonly string[]) {
      const where = `${name} "${id}"`;
      if (picked.has(id)) {
        errors.push(`${where}: duplicate model id across providers`);
        continue;
      }
      picked.add(id);

      const override = config.overrides[id] ?? {};
      const catalogId = override.catalogId ?? toCatalogId[providerId](id);
      const entry = byId.get(catalogId);

      if (entry) {
        if (override.pricing) {
          warnings.push(
            `${where}: override pricing shadows catalog pricing ($${entry.pricing.input} / $${entry.pricing.output})`
          );
        }
        models[id] = fromCatalog(providerId, entry, override);
        continue;
      }

      if (override.label && override.pricing) {
        warnings.push(
          `${where}: "${catalogId}" not in catalog, using label + pricing overrides`
        );
        models[id] = {
          providerId,
          label: override.label,
          vendor: providerId === "openrouter" ? vendorOf(catalogId) : name,
          hint: override.hint,
          pricing: override.pricing,
          priceRating:
            override.priceRating ?? priceRating(override.pricing.input),
        };
        continue;
      }

      const vendor = vendorOf(catalogId);
      errors.push(
        vendors.has(vendor)
          ? `${where}: "${catalogId}" not in catalog.${suggest(catalogId, catalog.models)} ` +
              `Fix the id, set overrides["${id}"].catalogId, or add label + pricing overrides.`
          : `${where}: vendor "${vendor}" is not in catalogVendors; add it and run models:update.`
      );
    }
  }

  if (!picked.has(config.defaultModel)) {
    errors.push(`defaultModel "${config.defaultModel}" is not a picked model`);
  }
  for (const id of Object.keys(config.overrides)) {
    if (!picked.has(id)) warnings.push(`overrides["${id}"]: model not picked`);
  }

  return {
    generated: { catalogFetchedAt: catalog.fetchedAt, models },
    errors,
    warnings,
  };
}
