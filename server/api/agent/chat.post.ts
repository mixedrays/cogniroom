import { createAgentHandler } from "@root/server/lib/createAgentHandler";
import { askUserTool } from "@/modules/agent/tools/ask-user";
import { getRenderedPrompt } from "@root/server/lib/promptService";

export default createAgentHandler({
  tools: [askUserTool],
  getSystemPrompt: async () => getRenderedPrompt("agent-chat", {}),
});
