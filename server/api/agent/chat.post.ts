import { createAgentHandler } from "@root/server/lib/createAgentHandler";
import { askUserTool } from "@/modules/agent/tools/ask-user";
import { memoryToolServer } from "@/modules/agent/tools/memory/server";
import { getRenderedPrompt } from "@root/server/lib/promptService";

export default createAgentHandler({
  tools: [askUserTool, memoryToolServer],
  getSystemPrompt: async () => getRenderedPrompt("agent-chat", {}),
});
