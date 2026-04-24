import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";
import { getRequiredEnv } from "../env";

import {
  AVAILABLE_MODELS,
  DEFAULT_MODEL as DEFAULT_MODEL_ID,
} from "@/lib/llm-models";
import type { OpenAIAvailableModelsIds as AvailableModelsId } from "@/lib/llm-models/providers/openai";

export type { AvailableModelsId };
export { AVAILABLE_MODELS };

export const DEFAULT_MODEL: AvailableModelsId = DEFAULT_MODEL_ID;

export function getOpenAIClient(model: AvailableModelsId = DEFAULT_MODEL) {
  const apiKey = getRequiredEnv("OPENAI_API_KEY");
  const openai = createOpenAI({ apiKey });
  return openai(model);
}

export function getDefaultModel(): LanguageModel {
  return getOpenAIClient(DEFAULT_MODEL);
}
