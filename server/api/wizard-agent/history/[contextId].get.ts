import { defineEventHandler, getRouterParam } from "h3";
import { readHistory } from "@root/server/lib/historyService";

export default defineEventHandler(async (event) => {
  const contextId = getRouterParam(event, "contextId") ?? "";
  const messages = await readHistory(contextId);
  return { messages };
});
