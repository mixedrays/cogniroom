import type { ComponentType } from "react";
import { z, type ZodType } from "zod";

export interface AgentTool<TParams extends ZodType = ZodType> {
  server: {
    name: string;
    description: string;
    parameters: TParams;
    execute?: (params: z.infer<TParams>) => Promise<unknown>;
  };
  client?: {
    name: string;
    Widget: ComponentType<{
      params: unknown;
      streamingInput?: string;
      isStreaming?: boolean;
      onSubmit: (result: unknown) => void;
      onDismiss: () => void;
      context?: Record<string, unknown>;
      superseded?: boolean;
    }>;
    renderAbovePrompt?: boolean;
  };
}

export type AgentMessageState =
  | { id: string; role: "user"; text: string }
  | {
      id: string;
      role: "assistant";
      status: "streaming" | "complete" | "cancelled";
      text: string;
    }
  | {
      id: string;
      role: "tool_call";
      toolName: string;
      toolCallId: string;
      params: unknown;
      status: "streaming" | "pending" | "submitted" | "dismissed";
      streamingInput?: string;
      result?: unknown;
    }
  | { id: string; role: "error"; message: string };

export type AgentSseEvent =
  | { type: "token"; delta: string }
  | {
      type: "tool_call_start";
      toolCallId: string;
      toolName: string;
    }
  | { type: "tool_call_delta"; toolCallId: string; delta: string }
  | { type: "tool_call"; toolCallId: string; toolName: string; params: unknown }
  | { type: "error"; message: string }
  | { type: "done" };

export type ChatBackend = (params: {
  messages: AgentMessageState[];
  model: string;
  context: Record<string, unknown>;
  signal: AbortSignal;
  onEvent: (event: AgentSseEvent) => void;
}) => Promise<void>;
