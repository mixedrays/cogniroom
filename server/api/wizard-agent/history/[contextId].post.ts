import { defineEventHandler, getRouterParam, readBody } from "h3";
import { writeHistory, clearHistory } from "@root/server/lib/historyService";
import type { AgentMessageState } from "@/modules/agent/types";

export default defineEventHandler(async (event) => {
  const contextId = getRouterParam(event, "contextId") ?? "";
  const body = await readBody<{ messages?: AgentMessageState[]; clear?: boolean }>(event);

  if (body?.clear) {
    await clearHistory(contextId);
    return { success: true };
  }

  if (body?.messages) {
    await writeHistory(contextId, body.messages);
  }

  return { success: true };
});
