import { defineEventHandler } from "h3";
import { providers, getProviderEnvKeyName } from "@/lib/llm-models";
import { toErrorMessage } from "@root/server/lib/errors";

export interface ProviderEnvKeyInfo {
  providerId: string;
  envName: string;
  hasKey: boolean;
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
      };
    });

    return { success: true, keys };
  } catch (error: unknown) {
    console.error("Error reading env API keys:", error);
    return { success: false, error: toErrorMessage(error), keys: [] };
  }
});
