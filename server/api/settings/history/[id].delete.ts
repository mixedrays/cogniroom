import { resolve } from "node:path";
import { defineEventHandler, getRouterParam } from "h3";
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

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");

    if (!id) {
      return { success: false, error: "No entry ID provided" };
    }

    // Read existing history
    const response = await settingsAdapter.execute<History>({
      path: "history.json",
      method: "GET",
      headers: {},
      options: {},
    });

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
    await settingsAdapter.execute({
      path: "history.json",
      method: "PUT",
      body: history,
      headers: {},
      options: {},
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting history entry:", error);
    return { success: false, error: String(error) };
  }
});
