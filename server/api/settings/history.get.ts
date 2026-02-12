import { resolve } from "node:path";
import { defineEventHandler } from "h3";
import { FileSystemAdapter } from "@root/modules/storage";

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

// Settings storage uses .settings directory in project root
const settingsAdapter = new FileSystemAdapter({
  basePath: resolve(process.cwd(), ".settings"),
});

export default defineEventHandler(async () => {
  try {
    const response = await settingsAdapter.execute<History>({
      path: "history.json",
      method: "GET",
      headers: {},
      options: {},
    });

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
  } catch (error) {
    console.error("Error reading settings history:", error);
    return {
      success: false,
      error: String(error),
      history: { entries: [], maxEntries: 50 },
    };
  }
});
