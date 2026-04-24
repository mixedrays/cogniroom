import { defineEventHandler } from "h3";
import { providers, getProviderEnvKeyName } from "@/lib/llm-models";
import { toErrorMessage } from "@root/server/lib/errors";

export interface ProviderEnvKeyInfo {
  providerId: string;
  envName: string;
  hasKey: boolean;
  lastChars?: string;
}

function maskKey(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (trimmed.length <= 4) return "•".repeat(trimmed.length);
  return trimmed.slice(-4);
}

export default defineEventHandler(() => {
  try {
    const keys: ProviderEnvKeyInfo[] = providers.map((provider) => {
      const envName = getProviderEnvKeyName(provider.id);
      const value = process.env[envName] ?? "";
      const hasKey = value.trim().length > 0;
      return {
        providerId: provider.id,
        envName,
        hasKey,
        lastChars: hasKey ? maskKey(value) : undefined,
      };
    });

    return { success: true, keys };
  } catch (error: unknown) {
    console.error("Error reading env API keys:", error);
    return { success: false, error: toErrorMessage(error), keys: [] };
  }
});
