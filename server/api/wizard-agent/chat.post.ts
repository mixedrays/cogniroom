import { createAgentHandler } from "@root/server/lib/createAgentHandler";
import { askUserTool } from "@/modules/agent/tools/ask-user";
import { memoryTool } from "@/modules/agent/tools/memory";
import { presentContentTool } from "@/modules/agent/tools/present-content";
import { getRenderedPrompt } from "@root/server/lib/promptService";

export default createAgentHandler({
  tools: [askUserTool, memoryTool, presentContentTool],
  getSystemPrompt: async (context) =>
    getRenderedPrompt("wizard-agent-chat", {
      contentType: String(
        (context as Record<string, unknown>)?.contentType ?? "lesson"
      ),
      context: JSON.stringify(context),
    }),
});
