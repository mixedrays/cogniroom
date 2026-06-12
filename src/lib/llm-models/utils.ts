import type { ModelStats, ProviderConfig, ProviderModels } from "./types";

export function getPricePerToken(pricePerMillion: number): number {
  return pricePerMillion / 1_000_000;
}

export function isFreeModel(model: ModelStats): boolean {
  return model.price.input === 0 && model.price.output === 0;
}

export function getModelPriceLabel(model: ModelStats): string {
  if (isFreeModel(model)) return "FREE";
  if (!model.priceRating) return "";
  if (model.priceRating > 3) return "$$$+";
  return "$".repeat(model.priceRating);
}

export function getModelPriceFullLabel(model: ModelStats): string {
  if (isFreeModel(model)) return "FREE";
  if (!model.priceRating) return "";
  return "$".repeat(model.priceRating);
}

export function formatPricePerMillion(pricePerToken: number): string {
  const perMillion = pricePerToken * 1_000_000;
  return `$${perMillion % 1 === 0 ? perMillion.toFixed(0) : perMillion.toFixed(2)}`;
}

export function getModelLabel(
  modelId: string | undefined | null,
  allModels: ProviderModels
): string {
  const model = allModels[modelId as keyof typeof allModels];
  return model ? model.label : modelId || "Unknown model";
}

export function getValidModel(
  model: string | undefined | null,
  allModels: ProviderModels,
  defaultModel: string
): string {
  if (model && model in allModels) {
    return model;
  }
  return defaultModel;
}

export function getProviderForModel(
  modelId: string,
  providers: ProviderConfig[]
): ProviderConfig | undefined {
  return providers.find((p) => modelId in p.models);
}

export function getProviderEnvKeyName(providerId: string): string {
  return `${providerId.toUpperCase()}_API_KEY`;
}

// Namespaced to avoid collisions with other apps served from the same
// origin (e.g. other dev projects reusing localhost:3000).
export function getProviderLocalStorageKeyName(providerId: string): string {
  return `cogniroom:${providerId.toLowerCase()}_api_key`;
}
