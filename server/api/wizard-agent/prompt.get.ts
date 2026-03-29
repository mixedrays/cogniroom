import { defineEventHandler, getQuery } from "h3";
import { getRenderedPrompt } from "@root/server/lib/promptService";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const contentType = String(query.contentType ?? "lesson");
  const context = String(query.context ?? "{}");
  const prompt = await getRenderedPrompt("wizard-agent-chat", {
    contentType,
    context,
  });
  return { prompt };
});
