import type { ModelMessage } from "ai";
import type { AgentMessageState } from "../types";

export type MessagesState = {
  messages: AgentMessageState[];
  isStreaming: boolean;
};

export const initialMessagesState: MessagesState = {
  messages: [],
  isStreaming: false,
};

export type MessagesAction =
  | { type: "ADD_USER_MESSAGE"; id: string; text: string }
  | { type: "ADD_STREAMING_ASSISTANT"; id: string }
  | { type: "APPEND_TOKEN"; id: string; delta: string }
  | { type: "COMPLETE_ASSISTANT"; id: string }
  | { type: "CANCEL_ASSISTANT"; id: string }
  | {
      type: "START_TOOL_CALL_STREAM";
      assistantId: string;
      toolCallId: string;
      toolName: string;
    }
  | { type: "APPEND_TOOL_CALL_DELTA"; toolCallId: string; delta: string }
  | {
      type: "ADD_TOOL_CALL";
      assistantId: string;
      toolCallId: string;
      toolName: string;
      params: unknown;
    }
  | { type: "SUBMIT_TOOL_RESULT"; toolCallId: string; result: unknown }
  | { type: "DISMISS_TOOL_CALL"; toolCallId: string }
  | { type: "SET_ERROR"; id: string; message: string }
  | { type: "LOAD_MESSAGES"; messages: AgentMessageState[] };

export function messagesReducer(
  state: MessagesState,
  action: MessagesAction
): MessagesState {
  switch (action.type) {
    case "ADD_USER_MESSAGE":
      return {
        ...state,
        messages: [
          ...state.messages,
          { id: action.id, role: "user", text: action.text },
        ],
      };
    case "ADD_STREAMING_ASSISTANT":
      return {
        ...state,
        isStreaming: true,
        messages: [
          ...state.messages,
          { id: action.id, role: "assistant", status: "streaming", text: "" },
        ],
      };
    case "APPEND_TOKEN":
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.id === action.id && m.role === "assistant"
            ? { ...m, text: m.text + action.delta }
            : m
        ),
      };
    case "COMPLETE_ASSISTANT":
      return {
        ...state,
        isStreaming: false,
        messages: state.messages.map((m) =>
          m.id === action.id && m.role === "assistant"
            ? { ...m, status: "complete" }
            : m
        ),
      };
    case "CANCEL_ASSISTANT":
      return {
        ...state,
        isStreaming: false,
        messages: state.messages.map((m) =>
          m.id === action.id
            ? m.role === "assistant"
              ? { ...m, status: "cancelled" }
              : { id: m.id, role: "assistant", status: "cancelled", text: "" }
            : m
        ),
      };
    case "START_TOOL_CALL_STREAM":
      return {
        ...state,
        isStreaming: true,
        messages: [
          ...state.messages.filter((m) => m.id !== action.assistantId),
          {
            id: action.assistantId,
            role: "tool_call",
            toolName: action.toolName,
            toolCallId: action.toolCallId,
            params: undefined,
            streamingInput: "",
            status: "streaming",
          },
        ],
      };
    case "APPEND_TOOL_CALL_DELTA":
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.role === "tool_call" &&
          m.toolCallId === action.toolCallId &&
          m.status === "streaming"
            ? { ...m, streamingInput: (m.streamingInput ?? "") + action.delta }
            : m
        ),
      };
    case "ADD_TOOL_CALL":
      return {
        ...state,
        isStreaming: false,
        messages: state.messages.some(
          (m) => m.role === "tool_call" && m.toolCallId === action.toolCallId
        )
          ? state.messages.map((m) =>
              m.role === "tool_call" && m.toolCallId === action.toolCallId
                ? {
                    ...m,
                    params: action.params,
                    streamingInput: undefined,
                    status: "pending" as const,
                  }
                : m
            )
          : [
              ...state.messages.filter((m) => m.id !== action.assistantId),
              {
                id: action.assistantId,
                role: "tool_call" as const,
                toolName: action.toolName,
                toolCallId: action.toolCallId,
                params: action.params,
                status: "pending" as const,
              },
            ],
      };
    case "SUBMIT_TOOL_RESULT":
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.role === "tool_call" && m.toolCallId === action.toolCallId
            ? { ...m, status: "submitted", result: action.result }
            : m
        ),
      };
    case "DISMISS_TOOL_CALL":
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.role === "tool_call" && m.toolCallId === action.toolCallId
            ? { ...m, status: "dismissed" }
            : m
        ),
      };
    case "SET_ERROR":
      return {
        ...state,
        isStreaming: false,
        messages: state.messages.map((m) =>
          m.id === action.id
            ? { id: m.id, role: "error", message: action.message }
            : m
        ),
      };
    case "LOAD_MESSAGES":
      return { ...state, messages: action.messages, isStreaming: false };
    default:
      return state;
  }
}

export function serializeMessages(
  messages: AgentMessageState[]
): ModelMessage[] {
  const result: ModelMessage[] = [];
  for (const msg of messages) {
    if (msg.role === "user") {
      result.push({ role: "user", content: msg.text });
    } else if (msg.role === "assistant" && msg.status === "complete") {
      result.push({ role: "assistant", content: msg.text });
    } else if (msg.role === "tool_call" && msg.status === "submitted") {
      result.push({
        role: "assistant",
        content: [
          {
            type: "tool-call",
            toolCallId: msg.toolCallId,
            toolName: msg.toolName,
            input: msg.params,
          },
        ],
      });
      result.push({
        role: "tool",
        content: [
          {
            type: "tool-result",
            toolCallId: msg.toolCallId,
            toolName: msg.toolName,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            output: { type: "json" as const, value: msg.result as any },
          },
        ],
      });
    }
  }
  return result;
}
