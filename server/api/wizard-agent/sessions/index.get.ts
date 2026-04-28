import { defineEventHandler } from "h3";
import { listSessions } from "@root/server/lib/historyService";
import { parseSessionScope } from "@root/server/lib/sessionScope";

export default defineEventHandler(async (event) => {
  const scope = parseSessionScope(event);
  const sessions = await listSessions(scope);
  return { sessions };
});
