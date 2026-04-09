export type ModelStats = {
  price: { input: number; output: number };
  priceRating: number;
  label: string;
  hint?: string;
};

export type ProviderModels = Record<string, ModelStats>;

export type ProviderConfig = {
  id: string;
  name: string;
  models: ProviderModels;
};
