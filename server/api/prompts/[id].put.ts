import { defineEventHandler, readBody, getRouterParam, createError } from "h3";
import { getPromptDefinition } from "@root/server/lib/promptRegistry";
import { savePrompt, loadPrompt } from "@root/server/lib/promptService";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Missing prompt id" });
  }

  const def = getPromptDefinition(id);
  if (!def) {
    throw createError({ statusCode: 404, statusMessage: `Unknown prompt: ${id}` });
  }

  const body = await readBody<{ content: string }>(event);
  if (typeof body?.content !== "string") {
    throw createError({ statusCode: 400, statusMessage: "Missing content field" });
  }

  await savePrompt(id, body.content);
  const content = await loadPrompt(id);

  return { success: true, content };
});
