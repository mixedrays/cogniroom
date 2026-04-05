import { defineEventHandler } from "h3";
import { settingsStorage } from "@root/server/lib/settingsStorage";
import { toErrorMessage } from "@root/server/lib/errors";

interface HistoryEntry {
  id: string;
  settings: unknown;
  savedAt: string;
  description?: string;
}

interface History {
  entries: HistoryEntry[];
  maxEntries: number;
}

export default defineEventHandler(async () => {
  try {
    const response = await settingsStorage.get<History>("history.json");

    if (response.ok) {
      const history = await response.json();
      return { success: true, history };
    }

    // File doesn't exist, return empty history
    if (response.status === 404) {
      return {
        success: true,
        history: { entries: [], maxEntries: 50 },
      };
    }

    // Other error
    console.error("Error reading settings history:", response.statusText);
    return {
      success: true,
      history: { entries: [], maxEntries: 50 },
    };
  } catch (error: unknown) {
    console.error("Error reading settings history:", error);
    return {
      success: false,
      error: toErrorMessage(error),
      history: { entries: [], maxEntries: 50 },
    };
  }
});
