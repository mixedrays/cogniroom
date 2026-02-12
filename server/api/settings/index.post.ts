import { resolve } from "node:path";
import { defineEventHandler, readBody } from "h3";
import { FileSystemAdapter } from "@root/modules/storage";
import { v4 as uuid } from "uuid";

// Settings storage uses .settings directory in project root
const settingsAdapter = new FileSystemAdapter({
  basePath: resolve(process.cwd(), ".settings"),
});

// Valid color themes
const VALID_COLOR_THEMES = [
  "neutral",
  "slate",
  "zinc",
  "stone",
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
];

const VALID_MODES = ["light", "dark", "system"];

interface Settings {
  appearance: {
    colorTheme: string;
    mode: string;
    radius: number;
  };
  llm: {
    defaultModel: string;
  };
  savedAt: string;
  version: number;
}

interface HistoryEntry {
  id: string;
  settings: Settings;
  savedAt: string;
  description?: string;
}

interface History {
  entries: HistoryEntry[];
  maxEntries: number;
}

function validateSettings(settings: unknown): settings is Settings {
  if (typeof settings !== "object" || settings === null) {
    return false;
  }

  const s = settings as Record<string, unknown>;

  // Check appearance
  if (typeof s.appearance !== "object" || s.appearance === null) {
    return false;
  }
  const appearance = s.appearance as Record<string, unknown>;
  if (
    typeof appearance.colorTheme !== "string" ||
    !VALID_COLOR_THEMES.includes(appearance.colorTheme)
  ) {
    return false;
  }
  if (
    typeof appearance.mode !== "string" ||
    !VALID_MODES.includes(appearance.mode)
  ) {
    return false;
  }
  if (typeof appearance.radius !== "number") {
    return false;
  }

  // Check llm
  if (typeof s.llm !== "object" || s.llm === null) {
    return false;
  }
  const llm = s.llm as Record<string, unknown>;
  if (typeof llm.defaultModel !== "string") {
    return false;
  }

  return true;
}

async function loadHistory(): Promise<History> {
  try {
    const response = await settingsAdapter.execute<History>({
      path: "history.json",
      method: "GET",
      headers: {},
      options: {},
    });
    if (response.ok) {
      return await response.json();
    }
    return { entries: [], maxEntries: 50 };
  } catch {
    return { entries: [], maxEntries: 50 };
  }
}

async function saveHistory(history: History): Promise<void> {
  await settingsAdapter.execute({
    path: "history.json",
    method: "PUT",
    body: history,
    headers: {},
    options: {},
  });
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<{
      settings: Settings;
      description?: string;
      addToHistory?: boolean;
    }>(event);

    if (!body || !body.settings) {
      return { success: false, error: "No settings provided" };
    }

    // Validate settings
    if (!validateSettings(body.settings)) {
      return { success: false, error: "Invalid settings format" };
    }

    // Update timestamp
    const settings: Settings = {
      ...body.settings,
      savedAt: new Date().toISOString(),
      version: 1,
    };

    // Save settings (auto-creates parent directories)
    await settingsAdapter.execute({
      path: "settings.json",
      method: "PUT",
      body: settings,
      headers: {},
      options: {},
    });

    // Add to history if requested (default: true)
    if (body.addToHistory !== false) {
      const history = await loadHistory();

      const entry: HistoryEntry = {
        id: uuid(),
        settings,
        savedAt: settings.savedAt,
        description: body.description,
      };

      history.entries.unshift(entry);

      // Trim history to max entries
      if (history.entries.length > history.maxEntries) {
        history.entries = history.entries.slice(0, history.maxEntries);
      }

      await saveHistory(history);
    }

    return { success: true, settings };
  } catch (error) {
    console.error("Error saving settings:", error);
    return { success: false, error: String(error) };
  }
});
