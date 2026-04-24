import type { openai } from "@ai-sdk/openai";
import type { ProviderConfig, ProviderModelDefinitions } from "../types";
import { getPricePerToken } from "../utils";

type OpenAIResponsesModelId = Parameters<typeof openai>[0];

export type OpenAIAvailableModelsIds = Exclude<
  OpenAIResponsesModelId,
  | object
  | `${string}-2025-${string}`
  | `${string}-2024-${string}`
  | `gpt-3${string}`
>;

const openaiModels = {
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
  "gpt-5.4-mini": {
    price: { input: getPricePerToken(0.75), output: getPricePerToken(4.5) },
    priceRating: 2,
    label: "GPT-5.4 Mini",
    hint: "Cost-effective version of GPT-5.4",
  },
  "gpt-5.4-nano": {
    price: { input: getPricePerToken(0.2), output: getPricePerToken(1.25) },
    priceRating: 2,
    label: "GPT-5.4 Nano",
    hint: "Ultra low-cost for simple tasks",
  },
  "gpt-5.2": {
    price: { input: getPricePerToken(1.75), output: getPricePerToken(14) },
    priceRating: 3,
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
    priceRating: 2,
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
    priceRating: 4,
    label: "O1",
    hint: "Optimized for reasoning tasks",
  },
  o3: {
    price: { input: getPricePerToken(2), output: getPricePerToken(8) },
    priceRating: 3,
    label: "O3",
    hint: "Balanced model for a wide range of tasks",
  },
  "o3-mini": {
    price: { input: getPricePerToken(1.1), output: getPricePerToken(4.4) },
    priceRating: 3,
    label: "O3 Mini",
    hint: "Cost-effective version of O3",
  },
} satisfies ProviderModelDefinitions<OpenAIAvailableModelsIds>;

export const openaiProvider: ProviderConfig<typeof openaiModels> = {
  id: "openai",
  name: "OpenAI",
  models: openaiModels,
};
