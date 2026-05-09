import { defineEventHandler } from "h3";
import { clearAllMemory } from "@root/server/lib/memoryService";
import { toErrorMessage } from "@root/server/lib/errors";

export default defineEventHandler(async () => {
  try {
    const cleared = await clearAllMemory();
    return { success: true, cleared };
  } catch (error: unknown) {
    console.error("Error clearing memory:", error);
    return { success: false, error: toErrorMessage(error) };
  }
});
