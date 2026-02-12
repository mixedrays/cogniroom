import { defineEventHandler, getRouterParam, createError } from "h3";
import { getPromptDefinition } from "@root/server/lib/promptRegistry";
import { resetPrompt } from "@root/server/lib/promptService";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Missing prompt id" });
  }

  const def = getPromptDefinition(id);
  if (!def) {
    throw createError({ statusCode: 404, statusMessage: `Unknown prompt: ${id}` });
  }

  const content = await resetPrompt(id);
  return { success: true, content };
});
