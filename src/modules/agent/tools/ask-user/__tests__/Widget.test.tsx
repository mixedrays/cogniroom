import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AskUserWidget } from "../Widget";

const radioParams = {
  question: "Pick one",
  type: "radio" as const,
  options: ["Option A", "Option B"],
};

const checkboxParams = {
  question: "Pick many",
  type: "checkbox" as const,
  options: ["Option A", "Option B", "Option C"],
};

const textParams = {
  question: "Type something",
  type: "text" as const,
  placeholder: "Enter text here",
};

describe("AskUserWidget — render", () => {
  it("renders question text", () => {
    render(<AskUserWidget params={radioParams} onSubmit={vi.fn()} onDismiss={vi.fn()} />);
    expect(screen.getByText("Pick one")).toBeInTheDocument();
  });

  it("renders null for invalid params", () => {
    const { container } = render(
      <AskUserWidget params={{ invalid: true }} onSubmit={vi.fn()} onDismiss={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });
});

describe("AskUserWidget — radio", () => {
  it("submit is disabled when nothing selected", () => {
    render(<AskUserWidget params={radioParams} onSubmit={vi.fn()} onDismiss={vi.fn()} />);
    expect(screen.getByRole("button", { name: /submit/i })).toBeDisabled();
  });

  it("clicking an option enables submit", () => {
    render(<AskUserWidget params={radioParams} onSubmit={vi.fn()} onDismiss={vi.fn()} />);
    fireEvent.click(screen.getByText("Option A"));
    expect(screen.getByRole("button", { name: /submit/i })).not.toBeDisabled();
  });

  it("clicking submit calls onSubmit with the selected string", () => {
    const onSubmit = vi.fn();
    render(<AskUserWidget params={radioParams} onSubmit={onSubmit} onDismiss={vi.fn()} />);
    fireEvent.click(screen.getByText("Option A"));
    fireEvent.click(screen.getByRole("button", { name: /submit/i }));
    expect(onSubmit).toHaveBeenCalledWith("Option A");
  });
});

describe("AskUserWidget — checkbox", () => {
  it("submit is disabled when nothing selected", () => {
    render(<AskUserWidget params={checkboxParams} onSubmit={vi.fn()} onDismiss={vi.fn()} />);
    expect(screen.getByRole("button", { name: /submit/i })).toBeDisabled();
  });

  it("selecting multiple options and submitting calls onSubmit with an array", () => {
    const onSubmit = vi.fn();
    render(<AskUserWidget params={checkboxParams} onSubmit={onSubmit} onDismiss={vi.fn()} />);
    fireEvent.click(screen.getByText("Option A"));
    fireEvent.click(screen.getByText("Option C"));
    fireEvent.click(screen.getByRole("button", { name: /submit/i }));
    expect(onSubmit).toHaveBeenCalledWith(["Option A", "Option C"]);
  });
});

describe("AskUserWidget — text", () => {
  it("submit is disabled when input is empty", () => {
    render(<AskUserWidget params={textParams} onSubmit={vi.fn()} onDismiss={vi.fn()} />);
    expect(screen.getByRole("button", { name: /submit/i })).toBeDisabled();
  });

  it("typing and submitting calls onSubmit with the trimmed string", () => {
    const onSubmit = vi.fn();
    render(<AskUserWidget params={textParams} onSubmit={onSubmit} onDismiss={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText("Enter text here"), {
      target: { value: "  my answer  " },
    });
    fireEvent.click(screen.getByRole("button", { name: /submit/i }));
    expect(onSubmit).toHaveBeenCalledWith("my answer");
  });

  it("pressing Enter submits the text", () => {
    const onSubmit = vi.fn();
    render(<AskUserWidget params={textParams} onSubmit={onSubmit} onDismiss={vi.fn()} />);
    const input = screen.getByPlaceholderText("Enter text here");
    fireEvent.change(input, { target: { value: "hello" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSubmit).toHaveBeenCalledWith("hello");
  });
});

describe("AskUserWidget — skip", () => {
  it("clicking skip calls onDismiss", () => {
    const onDismiss = vi.fn();
    render(<AskUserWidget params={radioParams} onSubmit={vi.fn()} onDismiss={onDismiss} />);
    fireEvent.click(screen.getByRole("button", { name: /skip/i }));
    expect(onDismiss).toHaveBeenCalledOnce();
  });
});
