import { defineEventHandler, readBody, createEventStream } from "h3";
import type { ModelMessage } from "ai";
import {
  DEFAULT_MODEL,
  getDefaultModel,
  getLanguageModel,
  resolveModelId,
} from "./llm";
import type { AgentTool } from "@/modules/agent/types";
import { runAgentStream } from "@/modules/agent/lib/runAgentStream";
import { getMemoryContext } from "./memoryService";
import { hydrateSources } from "./sources/hydrate";

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
      typeof config.tools === "function" ? config.tools(context) : config.tools;

    const eventStream = createEventStream(event);

    const modelId = body.model ? resolveModelId(body.model) : DEFAULT_MODEL;
    const sourceIds = Array.isArray(context.sourceIds)
      ? (context.sourceIds as string[])
      : undefined;

    void (async () => {
      try {
        const model = body.model
          ? getLanguageModel(modelId)
          : getDefaultModel();
        const messages = await hydrateSources(body.messages, sourceIds, modelId);
        await runAgentStream({
          model,
          system,
          messages,
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
