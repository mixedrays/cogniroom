import { defineEventHandler, HTTPError } from "h3";
import { settingsStorage } from "@root/server/lib/settingsStorage";
import { toErrorMessage } from "@root/server/lib/errors";
import { assertServerStorageEnabled } from "@root/server/lib/assertServerStorageEnabled";

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
    assertServerStorageEnabled();
    const response = await settingsStorage.get<History>("history.json");
    let maxEntries = 50;

    if (response.ok) {
      const existing = await response.json();
      if (typeof existing.maxEntries === "number") {
        maxEntries = existing.maxEntries;
      }
    }

    await settingsStorage.put("history.json", { entries: [], maxEntries });

    return { success: true };
  } catch (error: unknown) {
    if (error instanceof HTTPError) throw error;
    console.error("Error clearing settings history:", error);
    return { success: false, error: toErrorMessage(error) };
  }
});
