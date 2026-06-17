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

export type ProviderModels<ModelId extends string = string> = Record<
  ModelId,
  ModelStats
>;

export type ProviderModelDefinitions<ModelId extends string = string> = {
  [Key in ModelId]?: ModelStats;
};

export type ProviderConfig<Models extends ProviderModels = ProviderModels> = {
  id: string;
  name: string;
  models: Models;
};
