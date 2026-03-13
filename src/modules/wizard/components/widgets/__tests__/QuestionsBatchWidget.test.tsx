import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QuestionsBatchWidget } from "../QuestionsBatchWidget";

const data = {
  type: "questions" as const,
  questions: [
    {
      header: "Topic",
      question: "Pick a topic?",
      options: [
        { label: "React", recommended: true },
        { label: "TypeScript" },
      ],
    },
    {
      header: "Level",
      question: "Your level?",
      multiSelect: true,
      options: [
        { label: "Beginner", recommended: true },
        { label: "Advanced" },
      ],
    },
    {
      header: "Notes",
      question: "Any notes?",
      allowFreeformInput: true,
    },
  ],
};

describe("QuestionsBatchWidget", () => {
  it("renders first question with progress 1/3", () => {
    render(
      <QuestionsBatchWidget
        data={data}
        widgetId="w1"
        onSubmit={vi.fn()}
        onDismiss={vi.fn()}
      />
    );
    expect(screen.getByText("Pick a topic?")).toBeInTheDocument();
    expect(screen.getByText("1/3")).toBeInTheDocument();
  });

  it("pre-selects recommended options on mount", () => {
    render(
      <QuestionsBatchWidget
        data={data}
        widgetId="w1"
        onSubmit={vi.fn()}
        onDismiss={vi.fn()}
      />
    );
    const reactButton = screen.getByRole("button", { name: /React/i });
    expect(reactButton).toHaveAttribute("data-selected", "true");
  });

  it("navigates to next question on Next click", () => {
    render(
      <QuestionsBatchWidget
        data={data}
        widgetId="w1"
        onSubmit={vi.fn()}
        onDismiss={vi.fn()}
      />
    );
    fireEvent.click(screen.getByLabelText("Next question"));
    expect(screen.getByText("Your level?")).toBeInTheDocument();
    expect(screen.getByText("2/3")).toBeInTheDocument();
  });

  it("navigates back with Previous button", () => {
    render(
      <QuestionsBatchWidget
        data={data}
        widgetId="w1"
        onSubmit={vi.fn()}
        onDismiss={vi.fn()}
      />
    );
    fireEvent.click(screen.getByLabelText("Next question"));
    fireEvent.click(screen.getByLabelText("Previous question"));
    expect(screen.getByText("Pick a topic?")).toBeInTheDocument();
  });

  it("shows Submit button only on last question", () => {
    render(
      <QuestionsBatchWidget
        data={data}
        widgetId="w1"
        onSubmit={vi.fn()}
        onDismiss={vi.fn()}
      />
    );
    expect(screen.queryByRole("button", { name: /^submit$/i })).toBeNull();
    fireEvent.click(screen.getByLabelText("Next question"));
    fireEvent.click(screen.getByLabelText("Next question"));
    expect(screen.getByRole("button", { name: /^submit$/i })).toBeInTheDocument();
    expect(screen.getByText("3/3")).toBeInTheDocument();
  });

  it("calls onSubmit with answers when Submit is clicked", () => {
    const onSubmit = vi.fn();
    render(
      <QuestionsBatchWidget
        data={data}
        widgetId="w1"
        onSubmit={onSubmit}
        onDismiss={vi.fn()}
      />
    );
    fireEvent.click(screen.getByLabelText("Next question"));
    fireEvent.click(screen.getByLabelText("Next question"));
    fireEvent.click(screen.getByRole("button", { name: /^submit$/i }));
    expect(onSubmit).toHaveBeenCalledOnce();
    expect(onSubmit.mock.calls[0][0].Topic).toBe("React");
  });

  it("calls onSubmit on ⌘+Enter when on last question", () => {
    const onSubmit = vi.fn();
    render(
      <QuestionsBatchWidget
        data={data}
        widgetId="w1"
        onSubmit={onSubmit}
        onDismiss={vi.fn()}
      />
    );
    fireEvent.click(screen.getByLabelText("Next question"));
    fireEvent.click(screen.getByLabelText("Next question"));
    fireEvent.keyDown(window, { key: "Enter", metaKey: true });
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it("does NOT call onSubmit on ⌘+Enter when not on last question", () => {
    const onSubmit = vi.fn();
    render(
      <QuestionsBatchWidget
        data={data}
        widgetId="w1"
        onSubmit={onSubmit}
        onDismiss={vi.fn()}
      />
    );
    fireEvent.keyDown(window, { key: "Enter", metaKey: true });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("shows dismiss confirmation on X click and calls onDismiss on confirm", () => {
    const onDismiss = vi.fn();
    render(
      <QuestionsBatchWidget
        data={data}
        widgetId="w1"
        onSubmit={vi.fn()}
        onDismiss={onDismiss}
      />
    );
    fireEvent.click(screen.getByLabelText("Dismiss questions"));
    expect(screen.getByText(/discard these questions/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^discard$/i }));
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it("cancel dismiss keeps the widget open", () => {
    render(
      <QuestionsBatchWidget
        data={data}
        widgetId="w1"
        onSubmit={vi.fn()}
        onDismiss={vi.fn()}
      />
    );
    fireEvent.click(screen.getByLabelText("Dismiss questions"));
    fireEvent.click(screen.getByRole("button", { name: /^cancel$/i }));
    expect(screen.getByText("Pick a topic?")).toBeInTheDocument();
  });
});
