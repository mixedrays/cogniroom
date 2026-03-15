import { useReducer, useRef, useCallback } from "react";
import type { ModelMessage } from "ai";
import type { AgentMessageState, AgentSseEvent } from "../types";

type State = {
  messages: AgentMessageState[];
  isStreaming: boolean;
};

type Action =
  | { type: "ADD_USER_MESSAGE"; id: string; text: string }
  | { type: "ADD_STREAMING_ASSISTANT"; id: string }
  | { type: "APPEND_TOKEN"; id: string; delta: string }
  | { type: "COMPLETE_ASSISTANT"; id: string }
  | {
      type: "ADD_TOOL_CALL";
      assistantId: string;
      toolCallId: string;
      toolName: string;
      params: unknown;
    }
  | { type: "SUBMIT_TOOL_RESULT"; toolCallId: string; result: unknown }
  | { type: "DISMISS_TOOL_CALL"; toolCallId: string }
  | { type: "SET_ERROR"; id: string; message: string };

function reducer(state: State, action: Action): State {
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
          {
            id: action.id,
            role: "assistant",
            status: "streaming",
            text: "",
          },
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
    case "ADD_TOOL_CALL":
      return {
        ...state,
        isStreaming: false,
        messages: [
          ...state.messages.filter((m) => m.id !== action.assistantId),
          {
            id: action.assistantId,
            role: "tool_call",
            toolName: action.toolName,
            toolCallId: action.toolCallId,
            params: action.params,
            status: "pending",
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
    default:
      return state;
  }
}

export function serializeMessages(messages: AgentMessageState[]): ModelMessage[] {
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

export interface UseAgentReturn {
  messages: AgentMessageState[];
  isStreaming: boolean;
  sendMessage: (text: string) => void;
  submitToolResult: (toolCallId: string, result: unknown) => void;
  dismissToolCall: (toolCallId: string) => void;
}

interface UseAgentConfig {
  endpoint: string;
  context?: Record<string, unknown>;
}

export function useAgent({
  endpoint,
  context = {},
}: UseAgentConfig): UseAgentReturn {
  const [state, dispatch] = useReducer(reducer, {
    messages: [],
    isStreaming: false,
  });

  const messagesRef = useRef<AgentMessageState[]>([]);
  messagesRef.current = state.messages;

  const abortRef = useRef<AbortController | null>(null);

  const sendToAPI = useCallback(
    async (messages: AgentMessageState[]) => {
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const assistantId = crypto.randomUUID();
      dispatch({ type: "ADD_STREAMING_ASSISTANT", id: assistantId });

      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: serializeMessages(messages),
            context,
          }),
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          const err = await response.json().catch(() => ({}));
          throw new Error(
            (err as Record<string, string>)?.statusMessage ??
              (err as Record<string, string>)?.message ??
              `Request failed (${response.status})`
          );
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split("\n\n");
          buffer = events.pop() ?? "";

          for (const eventStr of events) {
            const dataLine = eventStr
              .split("\n")
              .find((l) => l.startsWith("data: "));
            if (!dataLine) continue;
            const event = JSON.parse(dataLine.slice(6)) as AgentSseEvent;

            if (event.type === "token") {
              dispatch({
                type: "APPEND_TOKEN",
                id: assistantId,
                delta: event.delta,
              });
            } else if (event.type === "tool_call") {
              dispatch({
                type: "ADD_TOOL_CALL",
                assistantId,
                toolCallId: event.toolCallId,
                toolName: event.toolName,
                params: event.params,
              });
            } else if (event.type === "error") {
              dispatch({
                type: "SET_ERROR",
                id: assistantId,
                message: event.message,
              });
            } else if (event.type === "done") {
              dispatch({ type: "COMPLETE_ASSISTANT", id: assistantId });
            }
          }
        }
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        dispatch({
          type: "SET_ERROR",
          id: assistantId,
          message: (e as Error).message ?? "Something went wrong",
        });
      }
    },
    [endpoint, context]
  );

  const sendMessage = useCallback(
    (text: string) => {
      const id = crypto.randomUUID();
      dispatch({ type: "ADD_USER_MESSAGE", id, text });
      sendToAPI([...messagesRef.current, { id, role: "user", text }]);
    },
    [sendToAPI]
  );

  const submitToolResult = useCallback(
    (toolCallId: string, result: unknown) => {
      dispatch({ type: "SUBMIT_TOOL_RESULT", toolCallId, result });
      const updatedMessages = messagesRef.current.map((m) =>
        m.role === "tool_call" && m.toolCallId === toolCallId
          ? { ...m, status: "submitted" as const, result }
          : m
      );
      sendToAPI(updatedMessages);
    },
    [sendToAPI]
  );

  const dismissToolCall = useCallback((toolCallId: string) => {
    dispatch({ type: "DISMISS_TOOL_CALL", toolCallId });
  }, []);

  return {
    messages: state.messages,
    isStreaming: state.isStreaming,
    sendMessage,
    submitToolResult,
    dismissToolCall,
  };
}
