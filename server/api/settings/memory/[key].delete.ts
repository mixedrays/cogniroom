import { defineEventHandler, getRouterParam, HTTPError } from "h3";
import { deleteMemory } from "@root/server/lib/memoryService";
import { toErrorMessage } from "@root/server/lib/errors";
import { assertServerStorageEnabled } from "@root/server/lib/assertServerStorageEnabled";

export default defineEventHandler(async (event) => {
  try {
    assertServerStorageEnabled();
    const key = getRouterParam(event, "key");
    if (!key) return { success: false, error: "Missing key" };

    const removed = await deleteMemory(key);
    return { success: removed, error: removed ? undefined : "Entry not found" };
  } catch (error: unknown) {
    if (error instanceof HTTPError) throw error;
    console.error("Error deleting memory entry:", error);
    return { success: false, error: toErrorMessage(error) };
  }
});
