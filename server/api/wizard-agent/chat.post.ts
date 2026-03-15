import { createAgentHandler } from "@root/server/lib/createAgentHandler";
import { askUserTool } from "@/modules/agent/tools/ask-user";
import { memoryTool } from "@/modules/agent/tools/memory";
import { readyToGenerateTool } from "@/modules/wizard-agent/tools/ready-to-generate";
import { getRenderedPrompt } from "@root/server/lib/promptService";

export default createAgentHandler({
  tools: [askUserTool, memoryTool, readyToGenerateTool],
  getSystemPrompt: async (context) =>
    getRenderedPrompt("wizard-agent-chat", {
      context: JSON.stringify(context),
    }),
});
