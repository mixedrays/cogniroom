import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { WizardMessage } from "../WizardMessage";

const noopBatchSubmit = vi.fn();
const noopDismiss = vi.fn();
const noopWidgetAnswer = vi.fn();

const questionsWidget = {
  type: "questions" as const,
  questions: [
    { header: "Topic", question: "Pick a topic?", options: [{ label: "React" }] },
    { header: "Level", question: "Your level?", multiSelect: true, options: [{ label: "Beginner" }] },
  ],
};

describe("WizardMessage — Q&A summary card", () => {
  it("renders Q&A summary when sourceWidget is questions type", () => {
    const message = {
      id: "m1",
      role: "user" as const,
      text: JSON.stringify({ Topic: "React", Level: ["Beginner"] }),
      sourceWidget: questionsWidget,
    };

    render(
      <WizardMessage
        message={message}
        isAnswered={false}
        onWidgetAnswer={noopWidgetAnswer}
        onBatchSubmit={noopBatchSubmit}
        onDismissWidget={noopDismiss}
      />
    );

    expect(screen.getByText("Pick a topic?")).toBeInTheDocument();
    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByText("Your level?")).toBeInTheDocument();
    expect(screen.getByText("Beginner")).toBeInTheDocument();
  });

  it("shows — for empty answers", () => {
    const message = {
      id: "m1",
      role: "user" as const,
      text: JSON.stringify({ Topic: "", Level: [] }),
      sourceWidget: questionsWidget,
    };

    render(
      <WizardMessage
        message={message}
        isAnswered={false}
        onWidgetAnswer={noopWidgetAnswer}
        onBatchSubmit={noopBatchSubmit}
        onDismissWidget={noopDismiss}
      />
    );

    expect(screen.getAllByText("—")).toHaveLength(2);
  });

  it("renders plain text bubble for regular user messages", () => {
    const message = {
      id: "m1",
      role: "user" as const,
      text: "Hello world",
    };

    render(
      <WizardMessage
        message={message}
        isAnswered={false}
        onWidgetAnswer={noopWidgetAnswer}
        onBatchSubmit={noopBatchSubmit}
        onDismissWidget={noopDismiss}
      />
    );

    expect(screen.getByText("Hello world")).toBeInTheDocument();
  });
});
