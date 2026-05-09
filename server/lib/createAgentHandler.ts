import { defineEventHandler, readBody, createEventStream } from "h3";
import type { ModelMessage } from "ai";
import {
  getDefaultModel,
  getOpenAIClient,
  type AvailableModelsId,
} from "./llm";
import type { AgentTool } from "@/modules/agent/types";
import { runAgentStream } from "@/modules/agent/lib/runAgentStream";
import { getMemoryContext } from "./memoryService";

export function createAgentHandler(config: {
  tools: AgentTool[] | ((context: Record<string, unknown>) => AgentTool[]);
  getSystemPrompt: (
    context: Record<string, unknown>
  ) => Promise<string> | string;
}) {
  return defineEventHandler(async (event) => {
    const body = await readBody<{
      messages: ModelMessage[];
      model?: string;
      context?: Record<string, unknown>;
    }>(event);

    if (!body) return new Response(null, { status: 400 });

    const context = body.context ?? {};
    const baseSystem = await config.getSystemPrompt(context);
    const memoryContext = await getMemoryContext();
    const system = memoryContext
      ? `${baseSystem}\n\n${memoryContext}`
      : baseSystem;
    const tools =
      typeof config.tools === "function"
        ? config.tools(context)
        : config.tools;

    const eventStream = createEventStream(event);

    void (async () => {
      try {
        const model = body.model
          ? getOpenAIClient(body.model as AvailableModelsId)
          : getDefaultModel();
        await runAgentStream({
          model,
          system,
          messages: body.messages,
          tools,
          onEvent: (e) => eventStream.push(JSON.stringify(e)),
        });
        await eventStream.push(JSON.stringify({ type: "done" }));
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        await eventStream.push(
          JSON.stringify({ type: "error", message: msg.slice(0, 300) })
        );
      } finally {
        await eventStream.close();
      }
    })();

    return eventStream.send();
  });
}
