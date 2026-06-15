import { useReducer, useRef, useCallback, useEffect } from "react";
import type { AgentMessageState, ChatBackend } from "../types";
import {
  messagesReducer,
  initialMessagesState,
} from "../lib/messagesReducer";
import { streamAssistantTurn } from "../lib/streamAssistantTurn";

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

  const sendToAPI = useCallback(
    async (messages: AgentMessageState[]) => {
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      await streamAssistantTurn({
        backend,
        messages,
        model: modelRef.current,
        context,
        signal: controller.signal,
        dispatch,
      });
    },
    [backend, context]
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
