import { createOpenAI } from "@ai-sdk/openai";
import { getRequiredEnv } from "../env";

import { type openai } from "@ai-sdk/openai";
import {
  AVAILABLE_MODELS,
  DEFAULT_MODEL as DEFAULT_MODEL_ID,
} from "@/lib/llmModels";

// take type of openai modelId param
export type OpenAIResponsesModelId = Parameters<typeof openai>[0];

export type AvailableModelsId = Exclude<
  OpenAIResponsesModelId,
  | object // exclude all object model IDs
  // exclude all model IDs that have date in id name
  | `${string}-2025-${string}`
  | `${string}-2024-${string}`
  // exclude all gpt-3 models
  | `gpt-3${string}`
>;
export { AVAILABLE_MODELS };

export const DEFAULT_MODEL: AvailableModelsId = DEFAULT_MODEL_ID;

export function getOpenAIClient(model: AvailableModelsId = DEFAULT_MODEL) {
  const apiKey = getRequiredEnv("OPENAI_API_KEY");
  const openai = createOpenAI({ apiKey });
  return openai(model);
}
