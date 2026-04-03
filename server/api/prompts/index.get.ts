import { defineEventHandler } from "h3";
import { getAllPrompts } from "@root/server/lib/promptService";
import { toErrorMessage } from "@root/server/lib/errors";

export default defineEventHandler(async () => {
  try {
    const prompts = await getAllPrompts();
    return { success: true, prompts };
  } catch (error: unknown) {
    console.error("Error loading prompts:", error);
    return { success: false, error: toErrorMessage(error), prompts: [] };
  }
});
