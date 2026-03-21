import { type openai } from "@ai-sdk/openai";

// take type of openai modelId param
export type OpenAIResponsesModelIds = Parameters<typeof openai>[0];

export type OpenAIModelsIds = Exclude<
  OpenAIResponsesModelIds,
  | object // exclude all object model IDs
  // exclude all model IDs that have date in id name
  | `${string}-2025-${string}`
  | `${string}-2024-${string}`
  // exclude all gpt-3 models
  | `gpt-3${string}`
>;

export type ModelStats = {
  price: { input: number; output: number };
  priceRating: number;
  label: string;
  hint?: string;
};

export type AvailableModels = Partial<Record<OpenAIModelsIds, ModelStats>>;

// Millions to per token conversion
const getPricePerToken = (pricePerMillion: number) => {
  return pricePerMillion / 1000000;
};

export const AVAILABLE_MODELS: AvailableModels = {
  "gpt-5.4": {
    price: { input: getPricePerToken(2.5), output: getPricePerToken(15) },
    priceRating: 3,
    label: "GPT-5.4",
    hint: "Most capable model, best for complex tasks",
  },
  "gpt-5.4-pro": {
    price: { input: getPricePerToken(30), output: getPricePerToken(180) },
    priceRating: 5,
    label: "GPT-5.4 Pro",
    hint: "Top-tier performance for critical applications",
  },
  "gpt-5.2": {
    price: { input: getPricePerToken(1.75), output: getPricePerToken(14) },
    priceRating: 2,
    label: "GPT-5.2",
    hint: "Most cost-effective for general use",
  },
  "gpt-5.2-pro": {
    price: { input: getPricePerToken(21), output: getPricePerToken(168) },
    priceRating: 4,
    label: "GPT-5.2 Pro",
    hint: "Best for high-value or complex tasks",
  },
  "gpt-5-mini": {
    price: { input: getPricePerToken(0.25), output: getPricePerToken(2) },
    priceRating: 1,
    label: "GPT-5 Mini",
    hint: "Good for simple tasks and testing",
  },
  "gpt-5-nano": {
    price: { input: getPricePerToken(0.05), output: getPricePerToken(0.4) },
    priceRating: 1,
    label: "GPT-5 Nano",
    hint: "Ultra low-cost for simple tasks",
  },
  o1: {
    price: { input: getPricePerToken(15), output: getPricePerToken(60) },
    priceRating: 3,
    label: "O1",
    hint: "Optimized for reasoning tasks",
  },
  o3: {
    price: { input: getPricePerToken(2), output: getPricePerToken(8) },
    priceRating: 2,
    label: "O3",
    hint: "Balanced model for a wide range of tasks",
  },
  "o3-mini": {
    price: { input: getPricePerToken(1.1), output: getPricePerToken(4.4) },
    priceRating: 2,
    label: "O3 Mini",
    hint: "Cost-effective version of O3",
  },
};

export const DEFAULT_MODEL = "gpt-5-mini";

export function getModelPriceLabel({ priceRating }: ModelStats): string {
  if (!priceRating) return "";

  if (priceRating > 3) return `$$$+`;

  const priceSuffix = ` ${"$".repeat(priceRating)}`;
  return `${priceSuffix}`;
}

export function getModelLabel(modelId: string | undefined | null): string {
  const model = AVAILABLE_MODELS[modelId as keyof typeof AVAILABLE_MODELS];
  return model ? model.label : modelId || "Unknown model";
}

// Validate and return a model, falling back to default if invalid
export function getValidModel(model: string | undefined | null): string {
  if (model && model in AVAILABLE_MODELS) {
    return model;
  }
  return DEFAULT_MODEL;
}
