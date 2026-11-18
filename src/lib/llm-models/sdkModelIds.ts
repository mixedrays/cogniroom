import type { openai } from "@ai-sdk/openai";
import type { anthropic } from "@ai-sdk/anthropic";

type ExtractLiteralModelId<T> = T extends string
  ? string extends T
    ? never
    : T
  : never;

/** Literal model ids known to the installed SDKs; refreshed by `npm run models:update`. */
export type OpenAISdkModelId = Exclude<
  Parameters<typeof openai>[0],
  | object
  | `${string}-2024-${string}`
  | `${string}-2025-${string}`
  | `${string}-2026-${string}`
  | `gpt-3${string}`
>;

export type AnthropicSdkModelId = ExtractLiteralModelId<
  Parameters<typeof anthropic>[0]
>;
