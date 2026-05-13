import type { ModelStats, ProviderConfig, ProviderModels } from "./types";

export function getPricePerToken(pricePerMillion: number): number {
  return pricePerMillion / 1_000_000;
}

export function getModelPriceLabel({ priceRating }: ModelStats): string {
  if (!priceRating) return "";
  if (priceRating > 3) return "$$$+";
  return "$".repeat(priceRating);
}

export function getModelPriceFullLabel({ priceRating }: ModelStats): string {
  if (!priceRating) return "";
  return "$".repeat(priceRating);
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

export function getProviderLocalStorageKeyName(providerId: string): string {
  return `${providerId.toLowerCase()}_api_key`;
}
