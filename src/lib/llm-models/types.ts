/** What multimodal inputs a model can accept natively (see chat attachments). */
export type ModelCapabilities = {
  vision?: boolean;
  pdf?: boolean;
};

export type ModelStats = {
  price: { input: number; output: number };
  priceRating: number;
  label: string;
  hint?: string;
  /** Overrides the provider-level capability defaults when set. */
  capabilities?: ModelCapabilities;
};

/** One entry of `models.generated.json`, written by `npm run models:build`. */
export type GeneratedModel = {
  providerId: string;
  /** OpenRouter catalog id; absent for models defined only via config overrides. */
  catalogId?: string;
  label: string;
  vendor: string;
  hint?: string;
  description?: string;
  /** USD per 1M tokens. */
  pricing: {
    input: number;
    output: number;
    cacheRead?: number;
    cacheWrite?: number;
  };
  priceRating: number;
  contextLength?: number;
  maxOutputTokens?: number;
  capabilities?: {
    vision: boolean;
    pdf: boolean;
    tools: boolean;
    reasoning: boolean;
  };
  releasedAt?: string;
  knowledgeCutoff?: string;
  expiresAt?: string;
};

export type GeneratedModels = {
  catalogFetchedAt: string;
  models: Record<string, GeneratedModel>;
};

export type ProviderModels<ModelId extends string = string> = Record<
  ModelId,
  ModelStats
>;

export type ProviderConfig<Models extends ProviderModels = ProviderModels> = {
  id: string;
  name: string;
  models: Models;
};
