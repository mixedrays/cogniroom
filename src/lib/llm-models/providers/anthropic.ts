import type { anthropic } from "@ai-sdk/anthropic";
import type { ProviderConfig, ProviderModelDefinitions } from "../types";
import { getPricePerToken } from "../utils";

type AnthropicMessagesModelId = Parameters<typeof anthropic>[0];

type ExtractLiteralModelId<T> = T extends string
  ? string extends T
    ? never
    : T
  : never;

export type AnthropicAvailableModelsIds =
  ExtractLiteralModelId<AnthropicMessagesModelId>;

const anthropicModels = {
  "claude-opus-4-7": {
    price: { input: getPricePerToken(5), output: getPricePerToken(25) },
    priceRating: 4,
    label: "Claude Opus 4.7",
    hint: "Most capable, best for complex reasoning",
  },
  "claude-opus-4-6": {
    price: { input: getPricePerToken(5), output: getPricePerToken(25) },
    priceRating: 4,
    label: "Claude Opus 4.6",
    hint: "Most capable, best for complex reasoning",
  },
  "claude-sonnet-4-6": {
    price: { input: getPricePerToken(3), output: getPricePerToken(15) },
    priceRating: 3,
    label: "Claude Sonnet 4.6",
    hint: "Fast and capable for most tasks",
  },
  "claude-haiku-4-5": {
    price: { input: getPricePerToken(1), output: getPricePerToken(5) },
    priceRating: 2,
    label: "Claude Haiku 4.5",
    hint: "Fast and cost-effective for simple tasks",
  },
} satisfies ProviderModelDefinitions<AnthropicAvailableModelsIds>;

export const anthropicProvider: ProviderConfig<typeof anthropicModels> = {
  id: "anthropic",
  name: "Anthropic",
  models: anthropicModels,
};
