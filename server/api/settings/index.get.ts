import { resolve } from "node:path";
import { defineEventHandler } from "h3";
import { FileSystemAdapter } from "@root/modules/storage";

// Default settings matching the client-side defaults
const DEFAULT_SETTINGS = {
  appearance: {
    colorTheme: "neutral" as const,
    mode: "light" as const,
    radius: 0.625,
  },
  llm: {
    defaultModel: "gpt-4.1-mini",
  },
  savedAt: new Date().toISOString(),
  version: 1,
};

// Settings storage uses .settings directory in project root
const settingsAdapter = new FileSystemAdapter({
  basePath: resolve(process.cwd(), ".settings"),
});

export default defineEventHandler(async () => {
  try {
    const response = await settingsAdapter.execute<any>({
      path: "settings.json",
      method: "GET",
      headers: {},
      options: {},
    });

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
  } catch (error) {
    console.error("Error reading settings:", error);
    return {
      success: false,
      error: String(error),
      settings: DEFAULT_SETTINGS,
    };
  }
});
