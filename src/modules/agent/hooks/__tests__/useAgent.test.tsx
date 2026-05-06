import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useAgent } from "../useAgent";
import type { ChatBackend } from "../../types";

describe("useAgent", () => {
  it("replaces a streaming tool call with a cancelled assistant message when aborted", async () => {
    const backend: ChatBackend = async ({ onEvent, signal }) => {
      onEvent({
        type: "tool_call_start",
        toolCallId: "tool-1",
        toolName: "presentRoadmap",
      });

      await new Promise<void>((_, reject) => {
        signal.addEventListener(
          "abort",
          () => reject(new DOMException("Aborted", "AbortError")),
          { once: true }
        );
      });
    };

    const { result } = renderHook(() => useAgent({ backend, context: {} }));

    act(() => {
      result.current.sendMessage("Show me a roadmap", "test-model");
    });

    await waitFor(() => {
      expect(result.current.messages.at(-1)).toMatchObject({
        role: "tool_call",
        status: "streaming",
        toolCallId: "tool-1",
      });
    });

    act(() => {
      result.current.stopStreaming();
    });

    await waitFor(() => {
      expect(result.current.messages.at(-1)).toMatchObject({
        role: "assistant",
        status: "cancelled",
        text: "",
      });
    });
  });
});
