import type { AgentTool } from "../../types";
import { readMemory, writeMemory } from "@root/server/lib/memoryService";
import { memoryTool } from "./index";
import { MemoryParamsSchema } from "./schema";

// Server-only variant with the real implementation. Import this from server
// route handlers instead of `memoryTool` so the memory service is never bundled
// into the client.
export const memoryToolServer: AgentTool<typeof MemoryParamsSchema> = {
  server: {
    ...memoryTool.server,
    execute: async (params) => {
      if (params.action === "read") {
        const content = await readMemory(params.key);
        return content ?? null;
      }
      if (!params.content) return { error: "content is required for write" };
      await writeMemory(params.key, params.content);
      return { ok: true };
    },
  },
};
