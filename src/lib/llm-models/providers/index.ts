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
