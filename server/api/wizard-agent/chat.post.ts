import { createAgentHandler } from "@root/server/lib/createAgentHandler";
import { askUserTool } from "@/modules/agent/tools/ask-user";
import { memoryTool } from "@/modules/agent/tools/memory";
import { presentContentTool } from "@/modules/agent/tools/present-content";
import { getRenderedPrompt } from "@root/server/lib/promptService";

export default createAgentHandler({
  tools: [askUserTool, memoryTool, presentContentTool],
  getSystemPrompt: async (fullContext) => {
    const { contextPrompt: rawContextPrompt, ...restContext } =
      fullContext as Record<string, unknown>;
    const contextPromptStr = String(rawContextPrompt ?? "");
    return getRenderedPrompt("wizard-agent-chat", {
      contentType: String(restContext?.contentType ?? "lesson"),
      context: JSON.stringify(restContext),
      contextPrompt: contextPromptStr
        ? `\nADDITIONAL CONTEXT:\n${contextPromptStr}`
        : "",
    });
  },
});
