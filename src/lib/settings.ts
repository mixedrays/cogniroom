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
      return { success: false, settings: DEFAULT_SETTINGS, error: response.statusText };
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

// Restore settings from history entry
export async function restoreFromHistory(
  entry: SettingsHistoryEntry
): Promise<{ success: boolean; settings?: Settings; error?: string }> {
  return saveSettings(entry.settings, {
    description: `Restored from ${new Date(entry.savedAt).toLocaleString()}`,
    addToHistory: true,
  });
}
