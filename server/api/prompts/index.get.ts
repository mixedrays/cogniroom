import { defineEventHandler } from "h3";
import { getAllPrompts } from "@root/server/lib/promptService";

export default defineEventHandler(async () => {
  try {
    const prompts = await getAllPrompts();
    return { success: true, prompts };
  } catch (error) {
    console.error("Error loading prompts:", error);
    return { success: false, error: String(error), prompts: [] };
  }
});
