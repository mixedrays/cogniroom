import { defineEventHandler } from "h3";
import { listMemoryEntries } from "@root/server/lib/memoryService";
import { toErrorMessage } from "@root/server/lib/errors";

export default defineEventHandler(async () => {
  try {
    const entries = await listMemoryEntries();
    return { success: true, entries };
  } catch (error: unknown) {
    console.error("Error reading memory:", error);
    return { success: false, error: toErrorMessage(error), entries: [] };
  }
});
