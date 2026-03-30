import { streamText, type LanguageModel, type ModelMessage } from "ai";
import type { ZodType } from "zod";
import type { AgentSseEvent, AgentTool } from "../types";

export interface RunAgentStreamConfig {
  model: LanguageModel;
  system: string;
  messages: ModelMessage[];
  tools: AgentTool[];
  signal?: AbortSignal;
  onEvent: (event: AgentSseEvent) => Promise<void> | void;
}

export async function runAgentStream({
  model,
  system,
  messages,
  tools,
  signal,
  onEvent,
}: RunAgentStreamConfig): Promise<void> {
  const clientToolNames = new Set(
    tools.filter((t) => !t.server.execute).map((t) => t.server.name)
  );

  const toolSet = Object.fromEntries(
    tools.map((t) => [
      t.server.name,
      {
        description: t.server.description,
        inputSchema: t.server.parameters as ZodType,
        ...(t.server.execute ? { execute: t.server.execute } : {}),
      },
    ])
  );

  const result = streamText({
    model,
    system,
    messages,
    tools: toolSet,
    abortSignal: signal,
  });

  for await (const part of result.fullStream) {
    if (part.type === "text-delta") {
      await onEvent({ type: "token", delta: part.text });
    } else if (
      part.type === "tool-call" &&
      clientToolNames.has(part.toolName)
    ) {
      await onEvent({
        type: "tool_call",
        toolCallId: part.toolCallId,
        toolName: part.toolName,
        params: part.input,
      });
      break;
    } else if (part.type === "error") {
      throw part.error;
    }
  }
}
