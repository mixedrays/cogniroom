import type {
  Settings,
  SettingsHistory,
  SettingsHistoryEntry,
} from "./settingsTypes";
import { DEFAULT_SETTINGS } from "./settingsTypes";

function getBaseUrl() {
  if (typeof window !== "undefined") return "";
  return "http://localhost:3000";
}

// Get current settings
export async function getSettings(): Promise<{
  success: boolean;
  settings: Settings;
  isDefault?: boolean;
  error?: string;
}> {
  try {
    const response = await fetch(`${getBaseUrl()}/api/settings`);
    if (!response.ok) {
      console.error("Failed to get settings:", response.statusText);
      return {
        success: false,
        settings: DEFAULT_SETTINGS,
        error: response.statusText,
      };
    }
    return await response.json();
  } catch (e) {
    console.error("Error getting settings:", e);
    return { success: false, settings: DEFAULT_SETTINGS, error: String(e) };
  }
}

// Save settings
export async function saveSettings(
  settings: Settings,
  options?: {
    description?: string;
    addToHistory?: boolean;
  }
): Promise<{ success: boolean; settings?: Settings; error?: string }> {
  try {
    const response = await fetch(`${getBaseUrl()}/api/settings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        settings,
        description: options?.description,
        addToHistory: options?.addToHistory,
      }),
    });
    return await response.json();
  } catch (e) {
    console.error("Error saving settings:", e);
    return { success: false, error: String(e) };
  }
}

export interface ProviderEnvKeyInfo {
  providerId: string;
  envName: string;
  hasKey: boolean;
  lastChars?: string;
}

// Get info on which provider API keys are set via environment variables
export async function getEnvApiKeys(): Promise<{
  success: boolean;
  keys: ProviderEnvKeyInfo[];
  error?: string;
}> {
  try {
    const response = await fetch(`${getBaseUrl()}/api/settings/env-keys`);
    if (!response.ok) {
      return { success: false, keys: [], error: response.statusText };
    }
    return await response.json();
  } catch (e) {
    console.error("Error getting env API keys:", e);
    return { success: false, keys: [], error: String(e) };
  }
}

// Get settings history
export async function getSettingsHistory(): Promise<{
  success: boolean;
  history: SettingsHistory;
  error?: string;
}> {
  try {
    const response = await fetch(`${getBaseUrl()}/api/settings/history`);
    if (!response.ok) {
      console.error("Failed to get settings history:", response.statusText);
      return {
        success: false,
        history: { entries: [], maxEntries: 50 },
        error: response.statusText,
      };
    }
    return await response.json();
  } catch (e) {
    console.error("Error getting settings history:", e);
    return {
      success: false,
      history: { entries: [], maxEntries: 50 },
      error: String(e),
    };
  }
}

// Delete history entry
export async function deleteHistoryEntry(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${getBaseUrl()}/api/settings/history/${id}`, {
      method: "DELETE",
    });
    return await response.json();
  } catch (e) {
    console.error("Error deleting history entry:", e);
    return { success: false, error: String(e) };
  }
}

// Delete all history entries
export async function clearSettingsHistory(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const response = await fetch(`${getBaseUrl()}/api/settings/history`, {
      method: "DELETE",
    });
    return await response.json();
  } catch (e) {
    console.error("Error clearing settings history:", e);
    return { success: false, error: String(e) };
  }
}

// Memory entries
export interface MemoryEntry {
  key: string;
  content: string;
}

export async function getMemoryEntries(): Promise<{
  success: boolean;
  entries: MemoryEntry[];
  error?: string;
}> {
  try {
    const response = await fetch(`${getBaseUrl()}/api/settings/memory`);
    if (!response.ok) {
      return { success: false, entries: [], error: response.statusText };
    }
    return await response.json();
  } catch (e) {
    console.error("Error getting memory entries:", e);
    return { success: false, entries: [], error: String(e) };
  }
}

export async function updateMemoryEntry(
  key: string,
  content: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(
      `${getBaseUrl()}/api/settings/memory/${encodeURIComponent(key)}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      }
    );
    return await response.json();
  } catch (e) {
    console.error("Error updating memory entry:", e);
    return { success: false, error: String(e) };
  }
}

export async function deleteMemoryEntry(
  key: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(
      `${getBaseUrl()}/api/settings/memory/${encodeURIComponent(key)}`,
      { method: "DELETE" }
    );
    return await response.json();
  } catch (e) {
    console.error("Error deleting memory entry:", e);
    return { success: false, error: String(e) };
  }
}

export async function clearAllMemory(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const response = await fetch(`${getBaseUrl()}/api/settings/memory`, {
      method: "DELETE",
    });
    return await response.json();
  } catch (e) {
    console.error("Error clearing memory:", e);
    return { success: false, error: String(e) };
  }
}

// Restore settings from history entry
export async function restoreFromHistory(
  entry: SettingsHistoryEntry
): Promise<{ success: boolean; settings?: Settings; error?: string }> {
  return saveSettings(entry.settings, {
    description: `Restored from ${new Date(entry.savedAt).toLocaleString()}`,
    addToHistory: true,
  });
}
