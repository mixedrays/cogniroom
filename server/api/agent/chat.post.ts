import { createAgentHandler } from "@root/server/lib/createAgentHandler";
import { askUserTool } from "@/modules/agent/tools/ask-user";
import { memoryToolServer } from "@/modules/agent/tools/memory/server";
import { getRenderedPrompt } from "@root/server/lib/promptService";
import { STORAGE_MODE } from "@root/server/env";

export default createAgentHandler({
  // Memory writes are filesystem-backed; omit the tool in browser mode.
  tools:
    STORAGE_MODE === "browser"
      ? [askUserTool]
      : [askUserTool, memoryToolServer],
  getSystemPrompt: async () => getRenderedPrompt("agent-chat", {}),
});
