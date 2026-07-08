import type { AgentTool } from "../../types";
import { MemoryParamsSchema } from "./schema";

// Shared, client-safe definition. The real `execute` lives in `./server` so the
// server-only memory service (fs / node:path) never gets pulled into the client
// bundle. The client only needs `execute` to be present so the tool is treated
// as server-executed; it never calls it.
export const memoryTool: AgentTool<typeof MemoryParamsSchema> = {
  server: {
    name: "memory",
    description:
      "Read or write persistent memory files. Use this to remember user preferences, " +
      "notes, or any information that should persist across conversations. " +
      "Use action 'read' to retrieve a memory by key, 'write' to save content under a key.",
    parameters: MemoryParamsSchema,
    execute: async () => {
      throw new Error("memory tool must be executed on the server");
    },
  },
};

export type { MemoryParams } from "./schema";
