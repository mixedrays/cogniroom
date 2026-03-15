import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAgent, serializeMessages } from "../useAgent";
import type { AgentMessageState } from "../../types";

function makeSSEStream(events: object[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const event of events) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      }
      controller.close();
    },
  });
}

function mockFetchSSE(events: object[]) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    body: makeSSEStream(events),
  });
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("useAgent — sendMessage", () => {
  it("adds user message and streaming assistant on sendMessage", async () => {
    mockFetchSSE([{ type: "done" }]);

    const { result } = renderHook(() => useAgent({ endpoint: "/api/agent/chat" }));

    await act(async () => {
      result.current.sendMessage("Hello");
    });

    const msgs = result.current.messages;
    expect(msgs[0]).toMatchObject({ role: "user", text: "Hello" });
  });

  it("appends token delta to streaming assistant message", async () => {
    mockFetchSSE([
      { type: "token", delta: "Hello " },
      { type: "token", delta: "world" },
      { type: "done" },
    ]);

    const { result } = renderHook(() => useAgent({ endpoint: "/api/agent/chat" }));

    await act(async () => {
      result.current.sendMessage("Hi");
    });

    const assistant = result.current.messages.find((m) => m.role === "assistant");
    expect(assistant).toMatchObject({ role: "assistant", text: "Hello world" });
  });

  it("marks assistant as complete and isStreaming false on done event", async () => {
    mockFetchSSE([{ type: "token", delta: "Hi" }, { type: "done" }]);

    const { result } = renderHook(() => useAgent({ endpoint: "/api/agent/chat" }));

    await act(async () => {
      result.current.sendMessage("Hello");
    });

    const assistant = result.current.messages.find((m) => m.role === "assistant");
    expect(assistant).toMatchObject({ role: "assistant", status: "complete" });
    expect(result.current.isStreaming).toBe(false);
  });

  it("replaces streaming assistant with tool_call on tool_call event", async () => {
    mockFetchSSE([
      {
        type: "tool_call",
        toolCallId: "tc1",
        toolName: "askUser",
        params: { question: "Q?", type: "radio", options: ["A", "B"] },
      },
      { type: "done" },
    ]);

    const { result } = renderHook(() => useAgent({ endpoint: "/api/agent/chat" }));

    await act(async () => {
      result.current.sendMessage("Go");
    });

    const toolCall = result.current.messages.find((m) => m.role === "tool_call");
    expect(toolCall).toMatchObject({
      role: "tool_call",
      toolName: "askUser",
      toolCallId: "tc1",
      status: "pending",
    });
    expect(result.current.isStreaming).toBe(false);
  });

  it("replaces streaming assistant with error message on error event", async () => {
    mockFetchSSE([{ type: "error", message: "Something went wrong" }]);

    const { result } = renderHook(() => useAgent({ endpoint: "/api/agent/chat" }));

    await act(async () => {
      result.current.sendMessage("Hi");
    });

    const error = result.current.messages.find((m) => m.role === "error");
    expect(error).toMatchObject({ role: "error", message: "Something went wrong" });
    expect(result.current.isStreaming).toBe(false);
  });
});

describe("useAgent — submitToolResult", () => {
  it("marks tool_call as submitted and calls API without adding user message", async () => {
    mockFetchSSE([
      {
        type: "tool_call",
        toolCallId: "tc1",
        toolName: "askUser",
        params: { question: "Q?", type: "radio", options: ["A"] },
      },
      { type: "done" },
    ]);

    const { result } = renderHook(() => useAgent({ endpoint: "/api/agent/chat" }));

    await act(async () => {
      result.current.sendMessage("Start");
    });

    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      body: makeSSEStream([{ type: "done" }]),
    });
    global.fetch = fetchSpy;

    await act(async () => {
      result.current.submitToolResult("tc1", "A");
    });

    const userMsgs = result.current.messages.filter((m) => m.role === "user");
    expect(userMsgs).toHaveLength(1);

    const toolCall = result.current.messages.find(
      (m) => m.role === "tool_call" && (m as Extract<AgentMessageState, { role: "tool_call" }>).toolCallId === "tc1"
    );
    expect(toolCall).toMatchObject({ status: "submitted" });

    expect(fetchSpy).toHaveBeenCalledOnce();
  });
});

describe("useAgent — dismissToolCall", () => {
  it("marks tool_call as dismissed without calling fetch", async () => {
    mockFetchSSE([
      {
        type: "tool_call",
        toolCallId: "tc1",
        toolName: "askUser",
        params: { question: "Q?", type: "text" },
      },
      { type: "done" },
    ]);

    const { result } = renderHook(() => useAgent({ endpoint: "/api/agent/chat" }));

    await act(async () => {
      result.current.sendMessage("Start");
    });

    const fetchSpy = vi.fn();
    global.fetch = fetchSpy;

    await act(async () => {
      result.current.dismissToolCall("tc1");
    });

    const toolCall = result.current.messages.find(
      (m) => m.role === "tool_call" && (m as Extract<AgentMessageState, { role: "tool_call" }>).toolCallId === "tc1"
    );
    expect(toolCall).toMatchObject({ status: "dismissed" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("serializeMessages", () => {
  it("serializes user message", () => {
    const msgs: AgentMessageState[] = [{ id: "1", role: "user", text: "Hello" }];
    expect(serializeMessages(msgs)).toEqual([{ role: "user", content: "Hello" }]);
  });

  it("serializes complete assistant message", () => {
    const msgs: AgentMessageState[] = [
      { id: "1", role: "assistant", status: "complete", text: "Hi there" },
    ];
    expect(serializeMessages(msgs)).toEqual([
      { role: "assistant", content: "Hi there" },
    ]);
  });

  it("excludes streaming assistant message", () => {
    const msgs: AgentMessageState[] = [
      { id: "1", role: "assistant", status: "streaming", text: "partial" },
    ];
    expect(serializeMessages(msgs)).toEqual([]);
  });

  it("serializes submitted tool_call as paired assistant + tool messages", () => {
    const msgs: AgentMessageState[] = [
      {
        id: "1",
        role: "tool_call",
        toolName: "askUser",
        toolCallId: "tc1",
        params: { question: "Q?" },
        status: "submitted",
        result: "Answer",
      },
    ];
    const serialized = serializeMessages(msgs);
    expect(serialized).toHaveLength(2);
    expect(serialized[0]).toMatchObject({
      role: "assistant",
      content: [{ type: "tool-call", toolCallId: "tc1", toolName: "askUser" }],
    });
    expect(serialized[1]).toMatchObject({
      role: "tool",
      content: [{ type: "tool-result", toolCallId: "tc1", toolName: "askUser" }],
    });
  });

  it("excludes dismissed tool_call", () => {
    const msgs: AgentMessageState[] = [
      {
        id: "1",
        role: "tool_call",
        toolName: "askUser",
        toolCallId: "tc1",
        params: {},
        status: "dismissed",
      },
    ];
    expect(serializeMessages(msgs)).toEqual([]);
  });

  it("excludes pending tool_call", () => {
    const msgs: AgentMessageState[] = [
      {
        id: "1",
        role: "tool_call",
        toolName: "askUser",
        toolCallId: "tc1",
        params: {},
        status: "pending",
      },
    ];
    expect(serializeMessages(msgs)).toEqual([]);
  });

  it("excludes error messages", () => {
    const msgs: AgentMessageState[] = [
      { id: "1", role: "error", message: "oops" },
    ];
    expect(serializeMessages(msgs)).toEqual([]);
  });
});
