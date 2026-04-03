import { useReducer, useRef, useCallback, useEffect } from "react";
import type { ModelMessage } from "ai";
import type { AgentMessageState, AgentSseEvent, ChatBackend } from "../types";

type State = {
  messages: AgentMessageState[];
  isStreaming: boolean;
};

type Action =
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
          (m) =>
            m.role === "tool_call" && m.toolCallId === action.toolCallId
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

export interface UseAgentReturn {
  messages: AgentMessageState[];
  isStreaming: boolean;
  sendMessage: (text: string, model: string) => void;
  stopStreaming: () => void;
  submitToolResult: (toolCallId: string, result: unknown) => void;
  dismissToolCall: (toolCallId: string) => void;
  loadMessages: (messages: AgentMessageState[]) => void;
}

interface UseAgentConfig {
  backend: ChatBackend;
  context?: Record<string, unknown>;
}

export function useAgent({
  backend,
  context = {},
}: UseAgentConfig): UseAgentReturn {
  const [state, dispatch] = useReducer(reducer, {
    messages: [],
    isStreaming: false,
  });

  const messagesRef = useRef<AgentMessageState[]>([]);
  useEffect(() => {
    messagesRef.current = state.messages;
  }, [state.messages]);

  const abortRef = useRef<AbortController | null>(null);
  const modelRef = useRef<string>("");

  const handleEvent = useCallback(
    (assistantId: string, event: AgentSseEvent) => {
      if (event.type === "token") {
        dispatch({ type: "APPEND_TOKEN", id: assistantId, delta: event.delta });
      } else if (event.type === "tool_call_start") {
        dispatch({
          type: "START_TOOL_CALL_STREAM",
          assistantId,
          toolCallId: event.toolCallId,
          toolName: event.toolName,
        });
      } else if (event.type === "tool_call_delta") {
        dispatch({
          type: "APPEND_TOOL_CALL_DELTA",
          toolCallId: event.toolCallId,
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
    },
    []
  );

  const sendToAPI = useCallback(
    async (messages: AgentMessageState[]) => {
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const assistantId = crypto.randomUUID();
      dispatch({ type: "ADD_STREAMING_ASSISTANT", id: assistantId });

      try {
        await backend({
          messages,
          model: modelRef.current,
          context,
          signal: controller.signal,
          onEvent: (event) => handleEvent(assistantId, event),
        });
      } catch (e) {
        if ((e as Error).name === "AbortError") {
          dispatch({ type: "CANCEL_ASSISTANT", id: assistantId });
          return;
        }
        dispatch({
          type: "SET_ERROR",
          id: assistantId,
          message: (e as Error).message ?? "Something went wrong",
        });
      }
    },
    [backend, context, handleEvent]
  );

  const sendMessage = useCallback(
    (text: string, model: string) => {
      modelRef.current = model;
      const id = crypto.randomUUID();
      dispatch({ type: "ADD_USER_MESSAGE", id, text });
      sendToAPI([...messagesRef.current, { id, role: "user", text }]);
    },
    [sendToAPI]
  );

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

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

  const loadMessages = useCallback((messages: AgentMessageState[]) => {
    dispatch({ type: "LOAD_MESSAGES", messages });
  }, []);

  return {
    messages: state.messages,
    isStreaming: state.isStreaming,
    sendMessage,
    stopStreaming,
    submitToolResult,
    dismissToolCall,
    loadMessages,
  };
}
