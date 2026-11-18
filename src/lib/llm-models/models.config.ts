import type { AnthropicSdkModelId, OpenAISdkModelId } from "./sdkModelIds";

/**
 * The only file to edit when adding or removing models.
 *
 * - Model metadata (label, pricing, context, capabilities) comes from the
 *   OpenRouter catalog snapshot in `models.catalog.json`.
 * - After editing, run `npm run models:build` (offline) to regenerate
 *   `models.generated.json`, which the app imports.
 * - `npm run models:update` refreshes SDKs + snapshot, then rebuilds.
 */

export type ModelOverride = {
  /** Catalog id when it can't be derived from the provider's model id. */
  catalogId?: string;
  label?: string;
  hint?: string;
  /** USD per 1M tokens. Required (with `label`) for models missing from the catalog. */
  pricing?: { input: number; output: number };
  priceRating?: number;
};

type ProviderPicks<ModelId extends string> = {
  name: string;
  models: readonly ModelId[];
};

export type ModelsConfig = {
  defaultModel: string;
  /** Catalog vendor prefixes kept in the snapshot (e.g. "openai" for "openai/gpt-5.4"). */
  catalogVendors: readonly string[];
  providers: {
    openai: ProviderPicks<OpenAISdkModelId>;
    anthropic: ProviderPicks<AnthropicSdkModelId>;
    openrouter: ProviderPicks<string>;
  };
  overrides: Readonly<Record<string, ModelOverride>>;
};

export const modelsConfig = {
  defaultModel: "gpt-5.6-luna",

  catalogVendors: [
    "openai",
    "anthropic",
    "google",
    "deepseek",
    "x-ai",
    "meta-llama",
    "qwen",
  ],

  providers: {
    openai: {
      name: "OpenAI",
      models: [
        "gpt-6.1-sol",
        "gpt-6.1-terra",
        "gpt-6.2-astra",
        "gpt-5.6-sol",
        "gpt-5.6-terra",
        "gpt-5.6-luna",
      ],
    },
    anthropic: {
      name: "Anthropic",
      models: [
        "claude-sonnet-5-5",
        "claude-opus-5-5",
        "claude-fable-5-2",
        "claude-haiku-5-5",
      ],
    },
    openrouter: {
      name: "OpenRouter",
      models: [
        "anthropic/claude-opus-4.7",
        "anthropic/claude-sonnet-4.6",
        "openai/gpt-5.2",
        "openai/gpt-5-mini",
        "google/gemini-3.5-flash",
        "deepseek/deepseek-v4-pro",
        "x-ai/grok-4.3",
        "meta-llama/llama-3.3-70b-instruct",
      ],
    },
  },

  overrides: {
    "gpt-5.6-sol": { hint: "Most capable model, best for complex tasks" },
    "gpt-5.6-terra": {
      hint: "Excellent performance for a wide range of tasks",
    },
    "gpt-5.6-luna": { hint: "Good performance for a wide range of tasks" },
  },
} as const satisfies ModelsConfig;
