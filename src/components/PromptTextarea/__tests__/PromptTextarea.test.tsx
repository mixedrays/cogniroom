import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PromptTextarea } from "../PromptTextarea";

vi.mock("@/modules/settings/context/SettingsContext", () => ({
  useSettings: () => ({
    settings: { llm: { defaultModel: "gpt-5-mini" } },
  }),
}));

describe("PromptTextarea", () => {
  it("renders with placeholder", () => {
    render(
      <PromptTextarea
        value=""
        onChange={vi.fn()}
        onSubmit={vi.fn()}
        placeholder="Describe what to build"
      />
    );
    expect(screen.getByPlaceholderText("Describe what to build")).toBeInTheDocument();
  });

  it("calls onChange when typing", () => {
    const onChange = vi.fn();
    render(
      <PromptTextarea value="" onChange={onChange} onSubmit={vi.fn()} />
    );
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "hello" } });
    expect(onChange).toHaveBeenCalledWith("hello");
  });

  it("calls onSubmit with trimmed text and model on Enter", () => {
    const onSubmit = vi.fn();
    render(
      <PromptTextarea value="  hello  " onChange={vi.fn()} onSubmit={onSubmit} />
    );
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter", shiftKey: false });
    expect(onSubmit).toHaveBeenCalledWith("hello", "gpt-5-mini");
  });

  it("does not submit on Shift+Enter", () => {
    const onSubmit = vi.fn();
    render(
      <PromptTextarea value="hello" onChange={vi.fn()} onSubmit={onSubmit} />
    );
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter", shiftKey: true });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("does not submit when value is empty", () => {
    const onSubmit = vi.fn();
    render(
      <PromptTextarea value="   " onChange={vi.fn()} onSubmit={onSubmit} />
    );
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter", shiftKey: false });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("does not submit when disabled", () => {
    const onSubmit = vi.fn();
    render(
      <PromptTextarea value="hello" onChange={vi.fn()} onSubmit={onSubmit} disabled />
    );
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter", shiftKey: false });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("disables the textarea when disabled prop is true", () => {
    render(
      <PromptTextarea value="hello" onChange={vi.fn()} onSubmit={vi.fn()} disabled />
    );
    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it("uses default placeholder when none provided", () => {
    render(
      <PromptTextarea value="" onChange={vi.fn()} onSubmit={vi.fn()} />
    );
    expect(screen.getByPlaceholderText("Type a message...")).toBeInTheDocument();
  });

  it("calls onSubmit when send button is clicked", () => {
    const onSubmit = vi.fn();
    render(
      <PromptTextarea value="hello" onChange={vi.fn()} onSubmit={onSubmit} />
    );
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(onSubmit).toHaveBeenCalledWith("hello", "gpt-5-mini");
  });
});
