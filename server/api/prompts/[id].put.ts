import { defineEventHandler, readBody, getRouterParam, HTTPError } from "h3";
import { getPromptDefinition } from "@root/server/lib/promptRegistry";
import { savePrompt, loadPrompt } from "@root/server/lib/promptService";
import { assertServerStorageEnabled } from "@root/server/lib/assertServerStorageEnabled";

export default defineEventHandler(async (event) => {
  assertServerStorageEnabled();
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

  const body = await readBody<{ content: string }>(event);
  if (typeof body?.content !== "string") {
    throw new HTTPError({
      status: 400,
      message: "Missing content field",
    });
  }

  await savePrompt(id, body.content);
  const content = await loadPrompt(id);

  return { success: true, content };
});
