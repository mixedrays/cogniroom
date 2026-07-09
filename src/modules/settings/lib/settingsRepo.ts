/**
 * Browser-mode settings persistence against a `StorageApi` (IndexedDB). Mirrors
 * the behavior of `server/api/settings/*` so the client can own settings when
 * `STORAGE_MODE=browser`. Server routes keep their own filesystem path
 * unchanged; this is the local counterpart the client dispatches to.
 */

import type { StorageApi } from "@modules/storage/client";
import { storagePaths } from "@modules/storage/paths";
import type { Settings, SettingsHistory } from "./settingsTypes";
import { DEFAULT_SETTINGS } from "./settingsTypes";

const DEFAULT_HISTORY: SettingsHistory = { entries: [], maxEntries: 50 };

const VALID_MODES = ["light", "dark", "system"];

/** Server-parity settings validation (structure only; metadata is regenerated). */
function isValidSettings(settings: unknown): settings is Settings {
  if (typeof settings !== "object" || settings === null) return false;
  const s = settings as Record<string, unknown>;

  if (typeof s.appearance !== "object" || s.appearance === null) return false;
  const appearance = s.appearance as Record<string, unknown>;
  if (appearance.cssThemeId !== null && typeof appearance.cssThemeId !== "string")
    return false;
  if (
    typeof appearance.mode !== "string" ||
    !VALID_MODES.includes(appearance.mode)
  )
    return false;
  if (typeof appearance.radius !== "number") return false;

  if (typeof s.llm !== "object" || s.llm === null) return false;
  const llm = s.llm as Record<string, unknown>;
  if (typeof llm.defaultModel !== "string") return false;

  if (s.sidebar !== undefined) {
    if (typeof s.sidebar !== "object" || s.sidebar === null) return false;
    const sidebar = s.sidebar as Record<string, unknown>;
    if (
      typeof sidebar.collapsedSections !== "object" ||
      sidebar.collapsedSections === null
    )
      return false;
  }

  return true;
}

export async function readSettings(api: StorageApi): Promise<{
  success: boolean;
  settings: Settings;
  isDefault?: boolean;
  error?: string;
}> {
  try {
    const response = await api.get<Settings>(storagePaths.settings());
    if (response.ok) {
      return { success: true, settings: await response.json() };
    }
    return { success: true, settings: DEFAULT_SETTINGS, isDefault: true };
  } catch (e) {
    return { success: false, settings: DEFAULT_SETTINGS, error: String(e) };
  }
}

async function readHistoryOrDefault(api: StorageApi): Promise<SettingsHistory> {
  try {
    const response = await api.get<SettingsHistory>(
      storagePaths.settingsHistory()
    );
    if (response.ok) return await response.json();
    return { ...DEFAULT_HISTORY };
  } catch {
    return { ...DEFAULT_HISTORY };
  }
}

export async function writeSettings(
  api: StorageApi,
  input: Settings,
  options?: { description?: string; addToHistory?: boolean }
): Promise<{ success: boolean; settings?: Settings; error?: string }> {
  try {
    if (!isValidSettings(input)) {
      return { success: false, error: "Invalid settings format" };
    }

    const settings: Settings = {
      ...input,
      savedAt: new Date().toISOString(),
      version: 1,
    };

    await api.put(storagePaths.settings(), settings);

    if (options?.addToHistory !== false) {
      const history = await readHistoryOrDefault(api);
      history.entries.unshift({
        id: crypto.randomUUID(),
        settings,
        savedAt: settings.savedAt,
        description: options?.description,
      });
      if (history.entries.length > history.maxEntries) {
        history.entries = history.entries.slice(0, history.maxEntries);
      }
      await api.put(storagePaths.settingsHistory(), history);
    }

    return { success: true, settings };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function readHistory(api: StorageApi): Promise<{
  success: boolean;
  history: SettingsHistory;
  error?: string;
}> {
  try {
    return { success: true, history: await readHistoryOrDefault(api) };
  } catch (e) {
    return { success: false, history: { ...DEFAULT_HISTORY }, error: String(e) };
  }
}

export async function deleteHistoryEntry(
  api: StorageApi,
  id: string
): Promise<{ success: boolean; error?: string }> {
  const response = await api.get<SettingsHistory>(
    storagePaths.settingsHistory()
  );
  if (!response.ok) return { success: false, error: "History file not found" };
  const history = await response.json();
  const before = history.entries.length;
  history.entries = history.entries.filter((entry) => entry.id !== id);
  if (history.entries.length === before) {
    return { success: false, error: "Entry not found" };
  }
  await api.put(storagePaths.settingsHistory(), history);
  return { success: true };
}

export async function clearHistory(
  api: StorageApi
): Promise<{ success: boolean; error?: string }> {
  let maxEntries = 50;
  const response = await api.get<SettingsHistory>(
    storagePaths.settingsHistory()
  );
  if (response.ok) {
    const existing = await response.json();
    if (typeof existing.maxEntries === "number") maxEntries = existing.maxEntries;
  }
  await api.put(storagePaths.settingsHistory(), { entries: [], maxEntries });
  return { success: true };
}
