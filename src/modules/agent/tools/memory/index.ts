import type { AgentTool } from "../../types";
import { MemoryParamsSchema } from "./schema";

export const memoryTool: AgentTool<typeof MemoryParamsSchema> = {
  server: {
    name: "memory",
    description:
      "Read or write persistent memory files. Use this to remember user preferences, " +
      "notes, or any information that should persist across conversations. " +
      "Use action 'read' to retrieve a memory by key, 'write' to save content under a key.",
    parameters: MemoryParamsSchema,
    execute: async (params) => {
      const { readMemory, writeMemory } =
        await import("@root/server/lib/memoryService");
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

export type { MemoryParams } from "./schema";
