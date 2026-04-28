import { defineEventHandler, getRouterParam } from "h3";
import { readSession } from "@root/server/lib/historyService";
import { parseSessionScope } from "@root/server/lib/sessionScope";

export default defineEventHandler(async (event) => {
  const scope = parseSessionScope(event);
  const sessionId = getRouterParam(event, "sessionId") ?? "";
  const session = await readSession(scope, sessionId);
  return { session };
});
