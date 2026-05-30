import type { ProviderConfig } from "../types";
import { openaiProvider } from "./openai";
import { anthropicProvider } from "./anthropic";
import { openrouterProvider } from "./openrouter";

export const providers: ProviderConfig[] = [
  openaiProvider,
  anthropicProvider,
  openrouterProvider,
];

export { openaiProvider, anthropicProvider, openrouterProvider };

export type { OpenAIAvailableModelsIds } from "./openai";
export type { AnthropicAvailableModelsIds } from "./anthropic";
export type { OpenRouterAvailableModelsIds } from "./openrouter";

/**
 * The model ids actually offered across all providers — the union of every
 * provider's `models` keys.
 *
 * Each provider derives its own id type from its source of truth (OpenAI and
 * Anthropic from the SDK parameter types, OpenRouter from the catalog in
 * `openrouter-models.json` via `POPULAR_MODEL_IDS`) and constrains its `models`
 * keys to it. Folding those keys back together here keeps this union honest
 * about every live provider instead of pretending only one exists.
 */
export type AvailableModelsId =
  | keyof typeof openaiProvider.models
  | keyof typeof anthropicProvider.models
  | keyof typeof openrouterProvider.models;
