import { createAgentHandler } from "@root/server/lib/createAgentHandler";
import { askUserV2Tool } from "@/modules/agent/tools/ask-user-v2";
import { memoryTool } from "@/modules/agent/tools/memory";
import { getRenderedPrompt } from "@root/server/lib/promptService";

export default createAgentHandler({
  tools: [askUserV2Tool, memoryTool],
  getSystemPrompt: async () => getRenderedPrompt("agent-chat", {}),
});
