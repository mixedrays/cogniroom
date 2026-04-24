export type ModelStats = {
  price: { input: number; output: number };
  priceRating: number;
  label: string;
  hint?: string;
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
