import { defineEventHandler, HTTPError } from "h3";
import { clearAllMemory } from "@root/server/lib/memoryService";
import { toErrorMessage } from "@root/server/lib/errors";
import { assertServerStorageEnabled } from "@root/server/lib/assertServerStorageEnabled";

export default defineEventHandler(async () => {
  try {
    assertServerStorageEnabled();
    const cleared = await clearAllMemory();
    return { success: true, cleared };
  } catch (error: unknown) {
    if (error instanceof HTTPError) throw error;
    console.error("Error clearing memory:", error);
    return { success: false, error: toErrorMessage(error) };
  }
});
