import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AgentMessage } from "../AgentMessage";
import type { AgentTool } from "../../types";

vi.mock("@/modules/markdown", () => ({
  Markdown: ({ content }: { content: string }) => <div data-testid="markdown">{content}</div>,
}));

const MockWidget = ({ params }: { params: unknown }) => (
  <div data-testid="widget">{JSON.stringify(params)}</div>
);

const mockTool: AgentTool = {
  server: {
    name: "askUser",
    description: "Ask the user a question",
    parameters: {} as never,
  },
  client: {
    name: "askUser",
    Widget: MockWidget,
  },
};

describe("AgentMessage — user", () => {
  it("renders user bubble with message text", () => {
    render(
      <AgentMessage
        message={{ id: "1", role: "user", text: "Hello there" }}
        tools={[]}
        onToolSubmit={vi.fn()}
        onToolDismiss={vi.fn()}
      />
    );
    expect(screen.getByText("Hello there")).toBeInTheDocument();
  });
});

describe("AgentMessage — assistant", () => {
  it("renders spinner when streaming with no text", () => {
    render(
      <AgentMessage
        message={{ id: "1", role: "assistant", status: "streaming", text: "" }}
        tools={[]}
        onToolSubmit={vi.fn()}
        onToolDismiss={vi.fn()}
      />
    );
    expect(screen.getByText(/thinking/i)).toBeInTheDocument();
  });

  it("renders Markdown for complete assistant message", () => {
    render(
      <AgentMessage
        message={{ id: "1", role: "assistant", status: "complete", text: "## Answer" }}
        tools={[]}
        onToolSubmit={vi.fn()}
        onToolDismiss={vi.fn()}
      />
    );
    expect(screen.getByTestId("markdown")).toBeInTheDocument();
    expect(screen.getByTestId("markdown")).toHaveTextContent("## Answer");
  });
});

describe("AgentMessage — tool_call", () => {
  it("renders Widget for known tool name", () => {
    render(
      <AgentMessage
        message={{
          id: "1",
          role: "tool_call",
          toolName: "askUser",
          toolCallId: "tc1",
          params: { question: "Q?", type: "radio" },
          status: "pending",
        }}
        tools={[mockTool]}
        onToolSubmit={vi.fn()}
        onToolDismiss={vi.fn()}
      />
    );
    expect(screen.getByTestId("widget")).toBeInTheDocument();
  });

  it("returns null for unknown tool name", () => {
    const { container } = render(
      <AgentMessage
        message={{
          id: "1",
          role: "tool_call",
          toolName: "unknownTool",
          toolCallId: "tc1",
          params: {},
          status: "pending",
        }}
        tools={[mockTool]}
        onToolSubmit={vi.fn()}
        onToolDismiss={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });
});

describe("AgentMessage — error", () => {
  it("renders error message text", () => {
    render(
      <AgentMessage
        message={{ id: "1", role: "error", message: "Something failed" }}
        tools={[]}
        onToolSubmit={vi.fn()}
        onToolDismiss={vi.fn()}
      />
    );
    expect(screen.getByText("Something failed")).toBeInTheDocument();
  });
});
