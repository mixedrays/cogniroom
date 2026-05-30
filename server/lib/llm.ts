import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import type { LanguageModel } from "ai";
import { getRequiredEnv } from "../env";

import {
  AVAILABLE_MODELS,
  DEFAULT_MODEL as DEFAULT_MODEL_ID,
  providers,
  getProviderForModel,
  getProviderEnvKeyName,
  resolveModelId,
  type AvailableModelsId,
} from "@/lib/llm-models";

export type { AvailableModelsId };
export { AVAILABLE_MODELS, resolveModelId };

export const DEFAULT_MODEL: AvailableModelsId = DEFAULT_MODEL_ID;

export function getLanguageModel(
  model: AvailableModelsId = DEFAULT_MODEL
): LanguageModel {
  const provider = getProviderForModel(model, providers);
  const providerId = provider?.id ?? "openai";
  const apiKey = getRequiredEnv(getProviderEnvKeyName(providerId));

  if (providerId === "anthropic") {
    const anthropic = createAnthropic({ apiKey });
    return anthropic(model);
  }

  if (providerId === "openrouter") {
    const openrouter = createOpenRouter({ apiKey });
    return openrouter(model);
  }

  const openai = createOpenAI({ apiKey });
  return openai(model);
}

export function getDefaultModel(): LanguageModel {
  return getLanguageModel(DEFAULT_MODEL);
}
