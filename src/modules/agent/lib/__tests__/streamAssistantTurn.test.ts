import { describe, expect, it } from "vitest";
import { sseEventToMessagesAction } from "../streamAssistantTurn";
import type { AgentSseEvent } from "../../types";

const ASSISTANT_ID = "assistant-1";

describe("sseEventToMessagesAction", () => {
  it("maps a token event to an APPEND_TOKEN action", () => {
    expect(
      sseEventToMessagesAction(ASSISTANT_ID, { type: "token", delta: "hi" })
    ).toEqual({ type: "APPEND_TOKEN", id: ASSISTANT_ID, delta: "hi" });
  });

  it("maps tool-call streaming events", () => {
    expect(
      sseEventToMessagesAction(ASSISTANT_ID, {
        type: "tool_call_start",
        toolCallId: "t1",
        toolName: "askUserV2",
      })
    ).toEqual({
      type: "START_TOOL_CALL_STREAM",
      assistantId: ASSISTANT_ID,
      toolCallId: "t1",
      toolName: "askUserV2",
    });

    expect(
      sseEventToMessagesAction(ASSISTANT_ID, {
        type: "tool_call_delta",
        toolCallId: "t1",
        delta: "{",
      })
    ).toEqual({ type: "APPEND_TOOL_CALL_DELTA", toolCallId: "t1", delta: "{" });

    expect(
      sseEventToMessagesAction(ASSISTANT_ID, {
        type: "tool_call",
        toolCallId: "t1",
        toolName: "askUserV2",
        params: { a: 1 },
      })
    ).toEqual({
      type: "ADD_TOOL_CALL",
      assistantId: ASSISTANT_ID,
      toolCallId: "t1",
      toolName: "askUserV2",
      params: { a: 1 },
    });
  });

  it("maps error and done events", () => {
    expect(
      sseEventToMessagesAction(ASSISTANT_ID, { type: "error", message: "boom" })
    ).toEqual({ type: "SET_ERROR", id: ASSISTANT_ID, message: "boom" });

    expect(
      sseEventToMessagesAction(ASSISTANT_ID, { type: "done" })
    ).toEqual({ type: "COMPLETE_ASSISTANT", id: ASSISTANT_ID });
  });

  it("returns null for events that carry no state change", () => {
    expect(
      sseEventToMessagesAction(ASSISTANT_ID, {
        type: "unknown",
      } as unknown as AgentSseEvent)
    ).toBeNull();
  });
});
