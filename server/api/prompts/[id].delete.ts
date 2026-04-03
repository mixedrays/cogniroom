import { defineEventHandler, getRouterParam, HTTPError } from "h3";
import { getPromptDefinition } from "@root/server/lib/promptRegistry";
import { resetPrompt } from "@root/server/lib/promptService";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) {
    throw new HTTPError({ status: 400, message: "Missing prompt id" });
  }

  const def = getPromptDefinition(id);
  if (!def) {
    throw new HTTPError({
      status: 404,
      message: `Unknown prompt: ${id}`,
    });
  }

  const content = await resetPrompt(id);
  return { success: true, content };
});
