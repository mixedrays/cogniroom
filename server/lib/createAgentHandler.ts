import { defineEventHandler, readBody, createEventStream } from "h3";
import {
  streamText,
  type LanguageModel,
  type ModelMessage,
  type ToolSet,
} from "ai";
import type { ZodType } from "zod";
import {
  getDefaultModel,
  getOpenAIClient,
  type AvailableModelsId,
} from "./llm";
import type { AgentTool } from "@/modules/agent/types";

export function createAgentHandler(config: {
  tools: AgentTool[];
  getSystemPrompt: (
    context: Record<string, unknown>
  ) => Promise<string> | string;
  model?: LanguageModel;
}) {
  return defineEventHandler(async (event) => {
    const body = await readBody<{
      messages: ModelMessage[];
      model?: string;
      context?: Record<string, unknown>;
    }>(event);

    if (!body) return new Response(null, { status: 400 });

    const context = body.context ?? {};
    const system = await config.getSystemPrompt(context);
    const model =
      config.model ??
      (body.model
        ? getOpenAIClient(body.model as AvailableModelsId)
        : getDefaultModel());

    const clientToolNames = new Set(
      config.tools.filter((t) => !t.server.execute).map((t) => t.server.name)
    );

    const tools: ToolSet = {};
    for (const agentTool of config.tools) {
      (tools as Record<string, unknown>)[agentTool.server.name] = {
        description: agentTool.server.description,
        inputSchema: agentTool.server.parameters as ZodType,
        ...(agentTool.server.execute
          ? { execute: agentTool.server.execute }
          : {}),
      };
    }

    const eventStream = createEventStream(event);

    void (async () => {
      try {
        const result = streamText({
          model,
          system,
          messages: body.messages,
          tools,
        });

        for await (const part of result.fullStream) {
          if (part.type === "text-delta") {
            await eventStream.push(
              JSON.stringify({ type: "token", delta: part.text })
            );
          } else if (
            part.type === "tool-call" &&
            clientToolNames.has(part.toolName)
          ) {
            await eventStream.push(
              JSON.stringify({
                type: "tool_call",
                toolCallId: part.toolCallId,
                toolName: part.toolName,
                params: part.input,
              })
            );
            break;
          }
        }

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
