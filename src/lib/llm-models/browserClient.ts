import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import type { LanguageModel } from "ai";
import { providers, getProviderForModel } from "./index";
import { getProviderLocalStorageKeyName } from "./utils";

/**
 * Header that opts the Anthropic API into accepting requests from browser
 * origins. Required for direct browser → api.anthropic.com calls; without it
 * the CORS preflight is rejected.
 *
 * Trade-off: the user's API key is exposed to any script running on this
 * origin. Acceptable only when the user supplies their own key on a trusted
 * device (single-user, BYO-key mode). See ApiKeySettings disclaimer.
 */
const ANTHROPIC_BROWSER_HEADER = {
  "anthropic-dangerous-direct-browser-access": "true",
};

function readApiKey(providerId: string): string {
  return localStorage.getItem(getProviderLocalStorageKeyName(providerId)) ?? "";
}

function requireApiKey(providerId: string, providerName: string): string {
  const apiKey = readApiKey(providerId).trim();
  if (!apiKey) {
    throw new Error(
      `${providerName} API key is not set. Please add it in [settings:api-key].`
    );
  }
  return apiKey;
}

/**
 * Returns a Vercel AI SDK LanguageModel for the given model id, configured
 * for direct browser-to-provider requests using a key from localStorage.
 *
 * Server-side calls must use their own configuration path — this module is
 * browser-only and intentionally enables browser CORS modes that would be
 * inappropriate on the server.
 */
export function getBrowserLanguageModel(model: string): LanguageModel {
  const provider = getProviderForModel(model, providers);
  if (!provider) {
    throw new Error(
      `Unknown model "${model}" — no configured provider supports it.`
    );
  }
  const providerId = provider.id;

  if (providerId === "anthropic") {
    const apiKey = requireApiKey("anthropic", "Anthropic");
    const anthropic = createAnthropic({
      apiKey,
      headers: ANTHROPIC_BROWSER_HEADER,
    });
    return anthropic(model);
  }

  if (providerId === "openrouter") {
    const apiKey = requireApiKey("openrouter", "OpenRouter");
    const openrouter = createOpenRouter({ apiKey });
    return openrouter(model);
  }

  const apiKey = requireApiKey("openai", "OpenAI");
  const openai = createOpenAI({ apiKey });
  return openai(model);
}
