import { useReducer, useRef, useCallback, useEffect } from "react";
import type { AgentMessageState, AgentSseEvent, ChatBackend } from "../types";
import {
  messagesReducer,
  initialMessagesState,
  serializeMessages,
} from "../lib/messagesReducer";

export { serializeMessages };

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
  const [state, dispatch] = useReducer(messagesReducer, initialMessagesState);

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
