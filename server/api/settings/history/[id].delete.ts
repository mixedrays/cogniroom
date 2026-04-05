import { defineEventHandler, getRouterParam } from "h3";
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

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");

    if (!id) {
      return { success: false, error: "No entry ID provided" };
    }

    // Read existing history
    const response = await settingsStorage.get<History>("history.json");

    if (!response.ok) {
      return { success: false, error: "History file not found" };
    }

    const history = await response.json();

    // Filter out the entry
    const originalLength = history.entries.length;
    history.entries = history.entries.filter((entry) => entry.id !== id);

    if (history.entries.length === originalLength) {
      return { success: false, error: "Entry not found" };
    }

    // Save updated history
    await settingsStorage.put("history.json", history);

    return { success: true };
  } catch (error: unknown) {
    console.error("Error deleting history entry:", error);
    return { success: false, error: toErrorMessage(error) };
  }
});
