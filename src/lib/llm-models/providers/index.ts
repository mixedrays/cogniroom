import type { ProviderConfig } from "../types";
import { openaiProvider } from "./openai";
import { anthropicProvider } from "./anthropic";

export const providers: ProviderConfig[] = [openaiProvider, anthropicProvider];

export { openaiProvider, anthropicProvider };
