import { defineEventHandler, getRouterParam } from "h3";
import { deleteMemory } from "@root/server/lib/memoryService";
import { toErrorMessage } from "@root/server/lib/errors";

export default defineEventHandler(async (event) => {
  try {
    const key = getRouterParam(event, "key");
    if (!key) return { success: false, error: "Missing key" };

    const removed = await deleteMemory(key);
    return { success: removed, error: removed ? undefined : "Entry not found" };
  } catch (error: unknown) {
    console.error("Error deleting memory entry:", error);
    return { success: false, error: toErrorMessage(error) };
  }
});
