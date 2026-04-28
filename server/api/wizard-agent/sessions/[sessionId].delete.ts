import { defineEventHandler, getRouterParam } from "h3";
import { deleteSession } from "@root/server/lib/historyService";
import { parseSessionScope } from "@root/server/lib/sessionScope";

export default defineEventHandler(async (event) => {
  const scope = parseSessionScope(event);
  const sessionId = getRouterParam(event, "sessionId") ?? "";
  await deleteSession(scope, sessionId);
  return { success: true };
});
