import type { AgentMessageState, AgentSseEvent, ChatBackend } from "../types";
import type { MessagesAction } from "./messagesReducer";

/**
 * Translate a single streaming SSE event into the reducer action that applies
 * it to a conversation. Returns null for events that carry no state change.
 */
export function sseEventToMessagesAction(
  assistantId: string,
  event: AgentSseEvent
): MessagesAction | null {
  switch (event.type) {
    case "token":
      return { type: "APPEND_TOKEN", id: assistantId, delta: event.delta };
    case "tool_call_start":
      return {
        type: "START_TOOL_CALL_STREAM",
        assistantId,
        toolCallId: event.toolCallId,
        toolName: event.toolName,
      };
    case "tool_call_delta":
      return {
        type: "APPEND_TOOL_CALL_DELTA",
        toolCallId: event.toolCallId,
        delta: event.delta,
      };
    case "tool_call":
      return {
        type: "ADD_TOOL_CALL",
        assistantId,
        toolCallId: event.toolCallId,
        toolName: event.toolName,
        params: event.params,
      };
    case "error":
      return { type: "SET_ERROR", id: assistantId, message: event.message };
    case "done":
      return { type: "COMPLETE_ASSISTANT", id: assistantId };
    default:
      return null;
  }
}

interface StreamAssistantTurnConfig {
  backend: ChatBackend;
  messages: AgentMessageState[];
  model: string;
  context: Record<string, unknown>;
  signal: AbortSignal;
  dispatch: (action: MessagesAction) => void;
}

/**
 * Run one assistant turn against a backend: append a streaming assistant
 * placeholder, stream the backend's events into the conversation, and settle on
 * cancellation or error. The caller owns the AbortController so it can manage
 * one stream (single session) or many (keyed sessions).
 */
export async function streamAssistantTurn({
  backend,
  messages,
  model,
  context,
  signal,
  dispatch,
}: StreamAssistantTurnConfig): Promise<void> {
  const assistantId = crypto.randomUUID();
  dispatch({ type: "ADD_STREAMING_ASSISTANT", id: assistantId });

  try {
    await backend({
      messages,
      model,
      context,
      signal,
      onEvent: (event) => {
        const action = sseEventToMessagesAction(assistantId, event);
        if (action) dispatch(action);
      },
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
}
