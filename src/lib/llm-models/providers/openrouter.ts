import type { ProviderConfig, ProviderModelDefinitions } from "../types";
import { getPricePerToken } from "../utils";

export type OpenRouterAvailableModelsIds =
  | "anthropic/claude-3.5-sonnet"
  | "openai/gpt-4o"
  | "openai/gpt-4o-mini"
  | "google/gemini-2.0-flash-001"
  | "meta-llama/llama-3.3-70b-instruct";

const openrouterModels = {
  "anthropic/claude-3.5-sonnet": {
    price: { input: getPricePerToken(3), output: getPricePerToken(15) },
    priceRating: 3,
    label: "Claude 3.5 Sonnet (OpenRouter)",
    hint: "Anthropic's balanced model via OpenRouter",
  },
  "openai/gpt-4o": {
    price: { input: getPricePerToken(2.5), output: getPricePerToken(10) },
    priceRating: 3,
    label: "GPT-4o (OpenRouter)",
    hint: "OpenAI's flagship multimodal model via OpenRouter",
  },
  "openai/gpt-4o-mini": {
    price: { input: getPricePerToken(0.15), output: getPricePerToken(0.6) },
    priceRating: 1,
    label: "GPT-4o Mini (OpenRouter)",
    hint: "Affordable OpenAI model via OpenRouter",
  },
  "google/gemini-2.0-flash-001": {
    price: { input: getPricePerToken(0.1), output: getPricePerToken(0.4) },
    priceRating: 1,
    label: "Gemini 2.0 Flash (OpenRouter)",
    hint: "Google's fast multimodal model via OpenRouter",
  },
  "meta-llama/llama-3.3-70b-instruct": {
    price: { input: getPricePerToken(0.13), output: getPricePerToken(0.4) },
    priceRating: 1,
    label: "Llama 3.3 70B (OpenRouter)",
    hint: "Meta's open-source 70B model via OpenRouter",
  },
} satisfies ProviderModelDefinitions<OpenRouterAvailableModelsIds>;

export const openrouterProvider: ProviderConfig<typeof openrouterModels> = {
  id: "openrouter",
  name: "OpenRouter",
  models: openrouterModels,
};
