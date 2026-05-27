import type { ProviderConfig, ProviderModelDefinitions } from "../types";
import openrouterCatalog from "./openrouter-models.json" with { type: "json" };

/**
 * Curated subset of the OpenRouter catalog. To refresh the catalog itself:
 *   curl -s https://openrouter.ai/api/v1/models > src/lib/llm-models/providers/openrouter-models.json
 * Then update this list to track currently-popular models.
 */
const POPULAR_MODEL_IDS = [
  "anthropic/claude-opus-4.7",
  "anthropic/claude-sonnet-4.6",
  "openai/gpt-5.2",
  "openai/gpt-5-mini",
  "google/gemini-3.5-flash",
  "deepseek/deepseek-v4-pro",
  "x-ai/grok-4.3",
  "meta-llama/llama-3.3-70b-instruct",
  "meta-llama/llama-3.3-70b-instruct:free",
  "deepseek/deepseek-v4-flash:free",
  "qwen/qwen3-coder:free",
] as const;

export type OpenRouterAvailableModelsIds = (typeof POPULAR_MODEL_IDS)[number];

type CatalogEntry = {
  id: string;
  name: string;
  pricing: { prompt: string; completion: string };
};

const catalogById = new Map<string, CatalogEntry>(
  (openrouterCatalog.data as CatalogEntry[]).map((m) => [m.id, m])
);

function priceRating(pricePerToken: number): number {
  const perMillion = pricePerToken * 1_000_000;
  if (perMillion === 0) return 0;
  if (perMillion < 0.5) return 1;
  if (perMillion < 2) return 2;
  if (perMillion < 5) return 3;
  if (perMillion < 15) return 4;
  return 5;
}

function buildModel(id: OpenRouterAvailableModelsIds) {
  const entry = catalogById.get(id);
  if (!entry) {
    throw new Error(
      `OpenRouter model "${id}" missing from openrouter-models.json. ` +
        `Re-fetch the catalog or update POPULAR_MODEL_IDS in openrouter.ts.`
    );
  }
  const input = Number(entry.pricing.prompt);
  const output = Number(entry.pricing.completion);
  return {
    price: { input, output },
    priceRating: priceRating(input),
    label: entry.name.replace(/^[^:]+:\s*/, ""),
    hint: `via OpenRouter — ${entry.name.replace(/:\s*.*$/, "")}`,
  };
}

const openrouterModels = Object.fromEntries(
  POPULAR_MODEL_IDS.map((id) => [id, buildModel(id)])
) as Record<OpenRouterAvailableModelsIds, ReturnType<typeof buildModel>>;

openrouterModels satisfies ProviderModelDefinitions<OpenRouterAvailableModelsIds>;

export const openrouterProvider: ProviderConfig<typeof openrouterModels> = {
  id: "openrouter",
  name: "OpenRouter",
  models: openrouterModels,
};
