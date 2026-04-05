import { defineEventHandler } from "h3";
import { settingsStorage } from "@root/server/lib/settingsStorage";
import { toErrorMessage } from "@root/server/lib/errors";

// Default settings matching the client-side defaults
const DEFAULT_SETTINGS = {
  appearance: {
    cssThemeId: null as string | null,
    mode: "light" as const,
    radius: 0.625,
  },
  llm: {
    defaultModel: "gpt-4.1-mini",
  },
  savedAt: new Date().toISOString(),
  version: 1,
};

export default defineEventHandler(async () => {
  try {
    const response = await settingsStorage.get<any>("settings.json");

    if (response.ok) {
      const settings = await response.json();
      return { success: true, settings };
    }

    // File doesn't exist, return default settings
    if (response.status === 404) {
      return { success: true, settings: DEFAULT_SETTINGS, isDefault: true };
    }

    // Other error
    console.error("Error reading settings:", response.statusText);
    return { success: true, settings: DEFAULT_SETTINGS, isDefault: true };
  } catch (error: unknown) {
    console.error("Error reading settings:", error);
    return {
      success: false,
      error: toErrorMessage(error),
      settings: DEFAULT_SETTINGS,
    };
  }
});
