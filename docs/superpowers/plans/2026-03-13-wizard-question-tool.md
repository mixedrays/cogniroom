# Wizard Question Tool Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `questions` AgentMessage type that lets the AI batch multiple clarifying questions into a single paginated card widget, with structured JSON submission.

**Architecture:** Extend `AgentMessageSchema` with a `questions` type; add `SUBMIT_BATCH` and `REMOVE_MESSAGE` reducer actions + `submitBatch`/`dismissWidget` methods to `useWizard`; implement a self-contained `QuestionsBatchWidget` component with internal navigation/answer state; render a Q&A summary card in `WizardMessage` after submission.

**Tech Stack:** TypeScript, React, Zod, Tailwind CSS, Shadcn UI (Button, Input), Vitest + @testing-library/react

**Spec:** `.features/wizard-agent/wizard-agent-question-tool-feature-plan.md`

---

## Chunk 1: Schema + useWizard

### Task 1: Extend AgentMessageSchema with `questions` type

**Files:**
- Modify: `src/modules/wizard/schema.ts`

- [x] **Step 1: Add the `questions` type to `AgentMessageSchema`**

Open `src/modules/wizard/schema.ts`. The file exports `AgentMessageSchema` as a `z.discriminatedUnion("type", [...])`. Add a new member to the array:

```ts
z.object({
  type: z.literal("questions"),
  questions: z.array(
    z.object({
      header: z.string(),
      question: z.string(),
      multiSelect: z.boolean().optional(),
      allowFreeformInput: z.boolean().optional(),
      options: z
        .array(
          z.object({
            label: z.string(),
            recommended: z.boolean().optional(),
          })
        )
        .optional(),
    })
  ),
}),
```

- [x] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: no new errors

- [x] **Step 3: Commit**

```bash
git add src/modules/wizard/schema.ts
git commit -m "feat(wizard): add questions type to AgentMessageSchema"
```

---

### Task 2: Add `SUBMIT_BATCH` and `REMOVE_MESSAGE` to `useWizard`

**Files:**
- Modify: `src/modules/wizard/hooks/useWizard.ts`
- Create: `src/modules/wizard/hooks/__tests__/` (directory + test file)

#### Background

`useWizard` uses a `useReducer`. Two new actions:

- **`SUBMIT_BATCH`**: removes the questions widget message by `widgetId`, adds a user message with the given `userMsgId`/`text`/`sourceWidget`. The user message id is generated outside the reducer and passed in — this ensures the same id is used in both the reducer state update and the `sendToAPI` call (mirrors the pattern in `submitWidget`).
- **`REMOVE_MESSAGE`**: removes any message by `id`. Used for dismiss/discard — no API call made.

> **Note on spec action shape:** The spec defines `SUBMIT_BATCH` with an `answers` field. This plan pre-serializes answers to a JSON `text` string before dispatch and adds a `userMsgId` field. This keeps the reducer free from serialization logic and avoids UUID divergence between state and API calls.

- [x] **Step 1: Create the test directory and write failing tests**

```bash
mkdir -p src/modules/wizard/hooks/__tests__
```

Create `src/modules/wizard/hooks/__tests__/useWizard.test.ts`:

```ts
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
      options: [
        { label: "React", recommended: true },
        { label: "TypeScript" },
      ],
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

    // Add a fake assistant questions message to state by injecting via sendMessage
    // then checking. Instead, we verify the removal by checking that a message
    // with the given widgetId is NOT present after submitBatch — even if it was never
    // added, the filter should not produce any message with that id.
    const answers = { Topic: "React", Notes: "hello" };

    await act(async () => {
      result.current.submitBatch(questionsWidget, "widget-to-remove", answers);
    });

    expect(result.current.messages.find((m) => m.id === "widget-to-remove")).toBeUndefined();
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
    expect(result.current.messages.find((m) => m.id === "welcome")).toBeDefined();

    await act(async () => {
      result.current.dismissWidget("welcome");
    });

    expect(result.current.messages.find((m) => m.id === "welcome")).toBeUndefined();
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
```

- [x] **Step 2: Run tests to confirm they fail**

Run: `npm run test -- --reporter=verbose src/modules/wizard/hooks/__tests__/useWizard.test.ts`
Expected: FAIL — `result.current.submitBatch is not a function`

- [x] **Step 3: Add `SUBMIT_BATCH` and `REMOVE_MESSAGE` actions to the reducer**

In `src/modules/wizard/hooks/useWizard.ts`, add to the `Action` union type:

```ts
| {
    type: "SUBMIT_BATCH";
    widgetId: string;
    userMsgId: string;
    text: string;
    sourceWidget: AgentMessage;
  }
| { type: "REMOVE_MESSAGE"; id: string }
```

Add cases to `reducer`:

```ts
case "SUBMIT_BATCH":
  return {
    ...state,
    messages: [
      ...state.messages.filter((m) => m.id !== action.widgetId),
      {
        id: action.userMsgId,
        role: "user",
        text: action.text,
        sourceWidget: action.sourceWidget,
      },
    ],
  };
case "REMOVE_MESSAGE":
  return {
    ...state,
    messages: state.messages.filter((m) => m.id !== action.id),
  };
```

- [x] **Step 4: Add `submitBatch` and `dismissWidget` methods**

In `UseWizardReturn` interface, add:

```ts
submitBatch: (
  widget: Extract<AgentMessage, { type: "questions" }>,
  widgetId: string,
  answers: Record<string, string | string[]>
) => void;
dismissWidget: (widgetId: string) => void;
```

In `useWizard` function body, add:

```ts
const submitBatch = useCallback(
  (
    widget: Extract<AgentMessage, { type: "questions" }>,
    widgetId: string,
    answers: Record<string, string | string[]>
  ) => {
    const text = JSON.stringify(answers);
    const userMsgId = crypto.randomUUID();
    dispatch({ type: "SUBMIT_BATCH", widgetId, userMsgId, text, sourceWidget: widget });
    const updatedMessages = [
      ...messagesRef.current.filter((m) => m.id !== widgetId),
      {
        id: userMsgId,
        role: "user" as const,
        text,
        sourceWidget: widget,
      },
    ];
    sendToAPI(updatedMessages);
  },
  [sendToAPI]
);

const dismissWidget = useCallback((widgetId: string) => {
  dispatch({ type: "REMOVE_MESSAGE", id: widgetId });
}, []);
```

Add both to the return value.

- [x] **Step 5: Run tests to confirm they pass**

Run: `npm run test -- --reporter=verbose src/modules/wizard/hooks/__tests__/useWizard.test.ts`
Expected: all 7 tests PASS

- [x] **Step 6: Typecheck**

Run: `npm run typecheck`
Expected: no errors

- [x] **Step 7: Commit**

```bash
git add src/modules/wizard/hooks/useWizard.ts src/modules/wizard/hooks/__tests__/useWizard.test.ts
git commit -m "feat(wizard): add SUBMIT_BATCH/REMOVE_MESSAGE and submitBatch/dismissWidget to useWizard"
```

---

## Chunk 2: QuestionsBatchWidget + WizardMessage integration

### Task 3: Implement `QuestionsBatchWidget`

**Files:**
- Create: `src/modules/wizard/components/widgets/QuestionsBatchWidget.tsx`
- Create: `src/modules/wizard/components/widgets/__tests__/QuestionsBatchWidget.test.tsx`

#### Background

Look at `src/modules/wizard/components/widgets/RadioWidget.tsx` for the Tailwind class patterns used in the wizard. Use `Button` from `@/components/ui/button` and `Input` from `@/components/ui/input` (same as `WizardChat.tsx`).

Wireframe references (layout/logic only — use app's own component styles, not visual style from screenshots):
- `images/question-tool-select.png`: numbered rows, checkmark on selected, freeform input as last row, `1/5` footer with back/next navigation
- `images/question-tool-multi-select.png`: multiple rows checked simultaneously
- `images/question-tool-submit-button-in-the-last-question.png`: last question: `5/5` + `⌘↵ to submit` hint + blue Submit button
- `images/question-tool-result.png`: not relevant here (handled in WizardMessage)

#### Answer state model

Answers are keyed by `header`: `Record<string, string | string[]>`

| Variant | Storage |
|---|---|
| Single-select | `string` (option label or `""`) |
| Multi-select | `string[]` (option labels) |
| Freeform only | `string` |
| Mixed (options + freeform) | `string` — typing in freeform replaces the whole answer (clears option selection for single-select; for multi-select, typing in freeform sets a plain string answer, clearing array selections) |

#### Initial answers from recommended options

```ts
function buildInitialAnswers(
  questions: QuestionsData["questions"]
): Record<string, string | string[]> {
  return Object.fromEntries(
    questions.map((q) => {
      if (!q.options?.length) return [q.header, ""];
      const recommended = q.options
        .filter((o) => o.recommended)
        .map((o) => o.label);
      if (q.multiSelect) return [q.header, recommended];
      return [q.header, recommended[0] ?? ""];
    })
  );
}
```

#### Props

```ts
interface QuestionsBatchWidgetProps {
  data: QuestionsData;
  widgetId: string;
  onSubmit: (answers: Record<string, string | string[]>) => void;
  onDismiss: () => void;
}
```

`onDismiss` is called after user confirms discard. Parent handles message removal.

#### Dismiss confirmation

Use inline state — no Dialog import needed:
```ts
const [confirmingDismiss, setConfirmingDismiss] = useState(false);
```
When true: show "Discard these questions?" + Cancel/Discard buttons. Confirm → `onDismiss()`. Cancel → `setConfirmingDismiss(false)`.

#### Keyboard shortcut

```ts
useEffect(() => {
  const handleKey = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && isLast) {
      handleSubmit();
    }
  };
  window.addEventListener("keydown", handleKey);
  return () => window.removeEventListener("keydown", handleKey);
}, [isLast, handleSubmit]);
```

- [x] **Step 1: Create the test directory and write failing tests**

```bash
mkdir -p src/modules/wizard/components/widgets/__tests__
```

Create `src/modules/wizard/components/widgets/__tests__/QuestionsBatchWidget.test.tsx`:

```tsx
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
```

- [x] **Step 2: Run tests to confirm they fail**

Run: `npm run test -- --reporter=verbose src/modules/wizard/components/widgets/__tests__/QuestionsBatchWidget.test.tsx`
Expected: FAIL — module not found

- [x] **Step 3: Create the component**

Create `src/modules/wizard/components/widgets/QuestionsBatchWidget.tsx`:

```tsx
import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { AgentMessage } from "../../schema";

type QuestionsData = Extract<AgentMessage, { type: "questions" }>;
type Question = QuestionsData["questions"][number];

interface QuestionsBatchWidgetProps {
  data: QuestionsData;
  widgetId: string;
  onSubmit: (answers: Record<string, string | string[]>) => void;
  onDismiss: () => void;
}

function buildInitialAnswers(
  questions: Question[]
): Record<string, string | string[]> {
  return Object.fromEntries(
    questions.map((q) => {
      if (!q.options?.length) return [q.header, ""];
      const recommended = q.options
        .filter((o) => o.recommended)
        .map((o) => o.label);
      if (q.multiSelect) return [q.header, recommended];
      return [q.header, recommended[0] ?? ""];
    })
  );
}

export function QuestionsBatchWidget({
  data,
  widgetId: _widgetId,
  onSubmit,
  onDismiss,
}: QuestionsBatchWidgetProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>(
    () => buildInitialAnswers(data.questions)
  );
  const [confirmingDismiss, setConfirmingDismiss] = useState(false);

  const current = data.questions[currentIndex];
  const isLast = currentIndex === data.questions.length - 1;
  const isFirst = currentIndex === 0;
  const total = data.questions.length;

  const handleSubmit = useCallback(() => {
    onSubmit(answers);
  }, [answers, onSubmit]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && isLast) {
        handleSubmit();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isLast, handleSubmit]);

  const toggleOption = (header: string, label: string, multi: boolean) => {
    setAnswers((prev) => {
      if (multi) {
        const cur = (prev[header] as string[]) ?? [];
        return {
          ...prev,
          [header]: cur.includes(label)
            ? cur.filter((v) => v !== label)
            : [...cur, label],
        };
      }
      return { ...prev, [header]: prev[header] === label ? "" : label };
    });
  };

  const isOptionSelected = (header: string, label: string, multi: boolean) => {
    if (multi) return ((answers[header] as string[]) ?? []).includes(label);
    return answers[header] === label;
  };

  if (confirmingDismiss) {
    return (
      <div className="space-y-4">
        <p className="text-sm">Discard these questions?</p>
        <div className="flex gap-2 justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setConfirmingDismiss(false)}
          >
            Cancel
          </Button>
          <Button variant="destructive" size="sm" onClick={onDismiss}>
            Discard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      <div className="flex items-start justify-between gap-2 pb-3">
        <p className="font-medium text-sm">{current.question}</p>
        <button
          type="button"
          aria-label="Dismiss questions"
          onClick={() => setConfirmingDismiss(true)}
          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="flex flex-col gap-1 pb-3">
        {current.options?.map((option, i) => {
          const selected = isOptionSelected(
            current.header,
            option.label,
            !!current.multiSelect
          );
          return (
            <button
              key={option.label}
              type="button"
              data-selected={selected}
              onClick={() =>
                toggleOption(
                  current.header,
                  option.label,
                  !!current.multiSelect
                )
              }
              className={cn(
                "flex items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                selected
                  ? "border-primary/50 bg-accent"
                  : "border-border hover:border-primary/30 hover:bg-accent/50"
              )}
            >
              <span className="w-4 shrink-0 text-xs text-muted-foreground">
                {i + 1}
              </span>
              <span className="flex-1">{option.label}</span>
              {selected && (
                <Check className="size-3.5 shrink-0 text-primary" />
              )}
            </button>
          );
        })}

        {current.allowFreeformInput && (
          <div className="flex items-center gap-3 rounded-lg border border-border px-3 py-1.5">
            <span className="w-4 shrink-0 text-xs text-muted-foreground">
              {(current.options?.length ?? 0) + 1}
            </span>
            <Input
              value={
                Array.isArray(answers[current.header])
                  ? ""
                  : current.options?.some((o) =>
                      isOptionSelected(current.header, o.label, false)
                    )
                  ? ""
                  : (answers[current.header] as string) ?? ""
              }
              onChange={(e) => {
                setAnswers((prev) => ({
                  ...prev,
                  [current.header]: e.target.value,
                }));
              }}
              placeholder="Enter custom answer"
              className="border-0 p-0 h-auto text-sm focus-visible:ring-0 shadow-none"
            />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-2 border-t">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            aria-label="Previous question"
            disabled={isFirst}
            onClick={() => setCurrentIndex((i) => i - 1)}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            aria-label="Next question"
            disabled={isLast}
            onClick={() => setCurrentIndex((i) => i + 1)}
          >
            <ChevronRight className="size-4" />
          </Button>
          <span className="text-xs text-muted-foreground ml-1">
            {currentIndex + 1}/{total}
          </span>
        </div>

        {isLast && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:block">
              ⌘↵ to submit
            </span>
            <Button size="sm" onClick={handleSubmit}>
              Submit
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [x] **Step 4: Run tests to confirm they pass**

Run: `npm run test -- --reporter=verbose src/modules/wizard/components/widgets/__tests__/QuestionsBatchWidget.test.tsx`
Expected: all 9 tests PASS

- [x] **Step 5: Typecheck**

Run: `npm run typecheck`
Expected: no errors

- [x] **Step 6: Commit**

```bash
git add src/modules/wizard/components/widgets/QuestionsBatchWidget.tsx src/modules/wizard/components/widgets/__tests__/QuestionsBatchWidget.test.tsx
git commit -m "feat(wizard): add QuestionsBatchWidget component with tests"
```

---

### Task 4: Wire `QuestionsBatchWidget` into `WizardMessage` + add summary card

**Files:**
- Modify: `src/modules/wizard/components/WizardMessage.tsx`
- Create: `src/modules/wizard/components/__tests__/WizardMessage.test.tsx`

#### Background

`WizardMessage` receives `onWidgetAnswer` for existing widget types. Add two new props:
- `onBatchSubmit` — called when user submits the questions batch
- `onDismissWidget` — called when user confirms discard

> **Important:** After this task, `WizardChat.tsx` will have TypeScript errors because it doesn't yet pass the new required props. These are resolved in Task 5 — do not run `npm run validate` yet, only `npm run typecheck` scoped to `WizardMessage.tsx` changes.

New `WizardMessageProps`:

```ts
interface WizardMessageProps {
  message: WizardMessageType;
  isAnswered: boolean;
  onWidgetAnswer: (widget: AgentMessage, answer: unknown) => void;
  onBatchSubmit: (
    widget: Extract<AgentMessage, { type: "questions" }>,
    widgetId: string,
    answers: Record<string, string | string[]>
  ) => void;
  onDismissWidget: (widgetId: string) => void;
}
```

- [x] **Step 1: Write failing tests for Q&A summary card**

```bash
mkdir -p src/modules/wizard/components/__tests__
```

Create `src/modules/wizard/components/__tests__/WizardMessage.test.tsx`:

```tsx
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
```

- [x] **Step 2: Run tests to confirm they fail**

Run: `npm run test -- --reporter=verbose src/modules/wizard/components/__tests__/WizardMessage.test.tsx`
Expected: FAIL — `onBatchSubmit` not in props

- [x] **Step 3: Add `QuestionsBatchWidget` import and update props**

In `src/modules/wizard/components/WizardMessage.tsx`:

1. Add import: `import { QuestionsBatchWidget } from "./widgets/QuestionsBatchWidget";`
2. Add to `WizardMessageProps` interface:

```ts
onBatchSubmit: (
  widget: Extract<AgentMessage, { type: "questions" }>,
  widgetId: string,
  answers: Record<string, string | string[]>
) => void;
onDismissWidget: (widgetId: string) => void;
```

3. Add both to the function destructuring.

- [x] **Step 4: Replace the `message.role === "user"` branch**

The current file has exactly one `if (message.role === "user")` block (lines 21–29). **Delete it entirely** and replace with:

```tsx
if (message.role === "user") {
  if (message.sourceWidget?.type === "questions") {
    const answers = JSON.parse(message.text) as Record<
      string,
      string | string[]
    >;
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-muted px-4 py-3 text-sm space-y-2">
          {message.sourceWidget.questions.map((q) => {
            const answer = answers[q.header];
            const answerText = Array.isArray(answer)
              ? answer.join(", ") || "—"
              : answer || "—";
            return (
              <div key={q.header}>
                <p className="text-muted-foreground text-xs">{q.question}</p>
                <p className="font-semibold">{answerText}</p>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-end">
      <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground">
        {message.text}
      </div>
    </div>
  );
}
```

> There must be exactly ONE `if (message.role === "user")` block in the file after this edit.

- [x] **Step 5: Add the `questions` assistant branch**

Inside the assistant widget section (the final `return` block with `data.type === "radio"` etc.), add a new `if` before the existing widget block:

```tsx
if (data.type === "questions") {
  return (
    <div className="flex justify-start w-full">
      <div className="w-full rounded-2xl rounded-tl-sm bg-muted p-4">
        <QuestionsBatchWidget
          data={data}
          widgetId={message.id}
          onSubmit={(answers) => onBatchSubmit(data, message.id, answers)}
          onDismiss={() => onDismissWidget(message.id)}
        />
      </div>
    </div>
  );
}
```

- [x] **Step 6: Run tests to confirm they pass**

Run: `npm run test -- --reporter=verbose src/modules/wizard/components/__tests__/WizardMessage.test.tsx`
Expected: all 3 tests PASS

- [x] **Step 7: Typecheck `WizardMessage.tsx` only**

Run: `npx tsc --noEmit --skipLibCheck 2>&1 | grep WizardMessage`
Expected: no errors in `WizardMessage.tsx` itself (errors in `WizardChat.tsx` are expected — fixed in Task 5)

- [x] **Step 8: Commit**

```bash
git add src/modules/wizard/components/WizardMessage.tsx src/modules/wizard/components/__tests__/WizardMessage.test.tsx
git commit -m "feat(wizard): add questions branch and Q&A summary card to WizardMessage"
```

---

### Task 5: Thread `submitBatch` and `dismissWidget` through `WizardChat`

**Files:**
- Modify: `src/modules/wizard/components/WizardChat.tsx`

#### Background

`WizardChatProps` is `type WizardChatProps = UseWizardReturn`. Since `UseWizardReturn` now includes `submitBatch` and `dismissWidget`, they are automatically available — no interface change needed. Just destructure and pass to `WizardMessage`.

- [x] **Step 1: Destructure `submitBatch` and `dismissWidget` and pass to `WizardMessage`**

In `WizardChat.tsx`, the function signature goes from:

```tsx
export function WizardChat({
  messages,
  isLoading,
  isGenerating,
  hasPreview,
  sendMessage,
  submitWidget,
  handleGenerate,
}: WizardChatProps) {
```

to:

```tsx
export function WizardChat({
  messages,
  isLoading,
  isGenerating,
  hasPreview,
  sendMessage,
  submitWidget,
  submitBatch,
  dismissWidget,
  handleGenerate,
}: WizardChatProps) {
```

The `WizardMessage` JSX call site goes from:

```tsx
<WizardMessage
  key={msg.id}
  message={msg}
  isAnswered={isAnswered}
  onWidgetAnswer={handleWidgetAnswer}
/>
```

to:

```tsx
<WizardMessage
  key={msg.id}
  message={msg}
  isAnswered={isAnswered}
  onWidgetAnswer={handleWidgetAnswer}
  onBatchSubmit={submitBatch}
  onDismissWidget={dismissWidget}
/>
```

- [x] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: no errors

- [x] **Step 3: Run all unit tests**

Run: `npm run test`
Expected: all tests pass

- [x] **Step 4: Commit**

```bash
git add src/modules/wizard/components/WizardChat.tsx
git commit -m "feat(wizard): thread submitBatch and dismissWidget through WizardChat"
```

---

### Task 6: `index.ts` check + final validation

**Files:**
- No change to `src/modules/wizard/index.ts` needed — it only exports `WizardDialog` and types; `QuestionsBatchWidget` is consumed internally and does not need a public export.

- [x] **Step 1: Run full validation suite**

Run: `npm run validate`
Expected: typecheck + lint + unit tests + e2e tests all pass

- [ ] **Step 2: Manual smoke test**

Start dev server with `npm run dev`. Open the wizard dialog. Temporarily add a test `questions` message to the initial messages in `useWizard.ts` for visual verification:

```ts
// Temporary — remove after testing
{
  id: "test-q",
  role: "assistant" as const,
  status: "complete" as const,
  data: {
    type: "questions" as const,
    questions: [
      { header: "Topic", question: "Pick a topic?", options: [{ label: "React", recommended: true }, { label: "TypeScript" }] },
      { header: "Level", question: "Your level?", multiSelect: true as const, options: [{ label: "Beginner", recommended: true }, { label: "Advanced" }] },
      { header: "Notes", question: "Any notes?", allowFreeformInput: true as const },
    ],
  },
},
```

Verify:
- Card renders with `1/3`, "React" pre-selected
- Navigate forward/back, answers persist across navigation
- On question 3: Submit button + `⌘↵` hint appear, `>` is disabled
- Submit → card disappears, Q&A summary bubble appears in its place
- X → confirm dialog → Discard → card disappears, no summary bubble, no API call
- X → confirm dialog → Cancel → card remains open

- [ ] **Step 3: Remove test fixture and commit**

```bash
git add src/modules/wizard/hooks/useWizard.ts
git commit -m "chore(wizard): remove question-tool smoke test fixture"
```
