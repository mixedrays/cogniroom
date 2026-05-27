import type { ProviderConfig, ProviderModels } from "./types";
import { providers } from "./providers";
import {
  getModelLabel as _getModelLabel,
  getValidModel as _getValidModel,
} from "./utils";

export type {
  ModelStats,
  ProviderConfig,
  ProviderModelDefinitions,
  ProviderModels,
} from "./types";
export {
  getPricePerToken,
  isFreeModel,
  getModelPriceLabel,
  getModelPriceFullLabel,
  formatPricePerMillion,
  getProviderForModel,
  getProviderEnvKeyName,
  getProviderLocalStorageKeyName,
} from "./utils";
export {
  providers,
  openaiProvider,
  anthropicProvider,
  openrouterProvider,
} from "./providers";

export const DEFAULT_MODEL = "gpt-5-mini";

/**
 * All models from all registered providers, merged into a single record.
 * Use this when you don't need to filter by available API keys.
 */
export const ALL_MODELS: ProviderModels = providers.reduce<ProviderModels>(
  (acc, provider) => ({ ...acc, ...provider.models }),
  {}
);

/**
 * Returns models only from providers whose API keys are present.
 * Pass the set of provider IDs that have configured keys.
 *
 * @example
 * const models = getAvailableModels(new Set(["openai"]));
 */
export function getAvailableModels(
  enabledProviderIds: Set<string>
): ProviderModels {
  return providers
    .filter((p) => enabledProviderIds.has(p.id))
    .reduce<ProviderModels>(
      (acc, provider) => ({ ...acc, ...provider.models }),
      {}
    );
}

/**
 * Get provider config by ID.
 */
export function getProviderById(id: string): ProviderConfig | undefined {
  return providers.find((p) => p.id === id);
}

// Backwards compat — consumers that imported AVAILABLE_MODELS get all models
export const AVAILABLE_MODELS = ALL_MODELS;

export function getModelLabel(modelId: string | undefined | null): string {
  return _getModelLabel(modelId, ALL_MODELS);
}

export function getValidModel(model: string | undefined | null): string {
  return _getValidModel(model, ALL_MODELS, DEFAULT_MODEL);
}
