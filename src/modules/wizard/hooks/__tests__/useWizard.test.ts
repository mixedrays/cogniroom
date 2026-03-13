import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useWizard } from "../useWizard";

beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ message: { type: "text", value: "ok" } }),
  });
});

const questionsWidget = {
  type: "questions" as const,
  questions: [
    {
      header: "Topic",
      question: "Pick one?",
      options: [{ label: "React", recommended: true }, { label: "TypeScript" }],
    },
    {
      header: "Notes",
      question: "Any notes?",
      allowFreeformInput: true,
    },
  ],
};

describe("useWizard — submitBatch", () => {
  it("exposes submitBatch and dismissWidget methods", () => {
    const { result } = renderHook(() => useWizard());
    expect(typeof result.current.submitBatch).toBe("function");
    expect(typeof result.current.dismissWidget).toBe("function");
  });

  it("removes the questions widget message by widgetId", async () => {
    const { result } = renderHook(() => useWizard());
    const answers = { Topic: "React", Notes: "hello" };

    await act(async () => {
      result.current.submitBatch(questionsWidget, "widget-to-remove", answers);
    });

    expect(
      result.current.messages.find((m) => m.id === "widget-to-remove")
    ).toBeUndefined();
  });

  it("adds a user message with JSON-serialized answers", async () => {
    const { result } = renderHook(() => useWizard());
    const answers = { Topic: "React", Notes: "hello" };

    await act(async () => {
      result.current.submitBatch(questionsWidget, "any-id", answers);
    });

    const userMsgs = result.current.messages.filter((m) => m.role === "user");
    expect(userMsgs).toHaveLength(1);
    expect(userMsgs[0].text).toBe(JSON.stringify(answers));
  });

  it("sets sourceWidget on the added user message", async () => {
    const { result } = renderHook(() => useWizard());

    await act(async () => {
      result.current.submitBatch(questionsWidget, "any-id", { Topic: "React" });
    });

    const userMsgs = result.current.messages.filter((m) => m.role === "user");
    expect(userMsgs[0].sourceWidget).toEqual(questionsWidget);
  });
});

describe("useWizard — dismissWidget", () => {
  it("does not call fetch when dismissing", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ message: { type: "text", value: "ok" } }),
    });
    global.fetch = fetchSpy;

    const { result } = renderHook(() => useWizard());

    await act(async () => {
      result.current.dismissWidget("some-id");
    });

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("removes the message with the matching id from state", async () => {
    const { result } = renderHook(() => useWizard());

    // The welcome message has id "welcome" — dismiss it to test actual removal
    expect(
      result.current.messages.find((m) => m.id === "welcome")
    ).toBeDefined();

    await act(async () => {
      result.current.dismissWidget("welcome");
    });

    expect(
      result.current.messages.find((m) => m.id === "welcome")
    ).toBeUndefined();
  });

  it("does not remove messages with non-matching ids", async () => {
    const { result } = renderHook(() => useWizard());
    const initialCount = result.current.messages.length;

    await act(async () => {
      result.current.dismissWidget("nonexistent-id");
    });

    expect(result.current.messages).toHaveLength(initialCount);
  });
});
