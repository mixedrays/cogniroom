import { defineEventHandler } from "h3";
import { getRenderedPrompt } from "@root/server/lib/promptService";

export default defineEventHandler(async () => {
  const prompt = await getRenderedPrompt("agent-chat", {});
  return { prompt };
});
