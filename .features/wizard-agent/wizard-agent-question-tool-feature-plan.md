# Wizard Agent — Question Tool (Batch Questions)

## Overview

A new `questions` AgentMessage type that lets the AI send a batch of clarifying questions in a single turn. The user navigates through them in a paginated card, then submits all answers at once as structured JSON. This reduces round-trips compared to one-widget-per-turn and gives the AI richer context in a single response.

## Schema

New discriminated union member added to `AgentMessageSchema` in `src/modules/wizard/schema.ts`:

```ts
z.object({
  type: z.literal("questions"),
  questions: z.array(z.object({
    header: z.string(),           // short label, used as answer key
    question: z.string(),         // full question text shown to user
    multiSelect: z.boolean().optional(),
    allowFreeformInput: z.boolean().optional(),
    options: z.array(z.object({
      label: z.string(),
      recommended: z.boolean().optional(),
    })).optional(),
  })),
})
```

### Question variants

| Variant | Conditions |
|---|---|
| Single-select | `options` present, no `multiSelect` |
| Multi-select | `options` + `multiSelect: true` |
| Freeform only | `allowFreeformInput: true`, no `options` |
| Mixed | `options` + `allowFreeformInput: true` |

## Component: `QuestionsBatchWidget`

**Location**: `src/modules/wizard/components/widgets/QuestionsBatchWidget.tsx`

### Internal state

- `currentIndex: number` — active question (0-based), initialized to `0`
- `answers: Record<string, string | string[]>` — keyed by `header`; on mount, recommended options are pre-populated as default answers

### UI structure

> **Wireframe references** (layout and interaction logic only — use existing app UI components, not the style from screenshots):
> - `images/question-tool-select.png` — single-select question with numbered options, checkmark on selected, freeform input row, `1/5` footer with back/next
> - `images/question-tool-multi-select.png` — multi-select question with checkboxes, multiple items checked simultaneously
> - `images/question-tool-submit-button-in-the-last-question.png` — last question footer: `5/5`, `⌘↵ to submit` hint, blue Submit button
> - `images/question-tool-result.png` — post-submit summary card with Q/A pairs listed, `Analyzing your answers...` status text above

```
┌─────────────────────────────────────────┐
│ [question text]                     [X] │
├─────────────────────────────────────────┤
│ 1  Option A                         ✓  │
│ 2  Option B                             │
│ 3  Option C                             │
│ 4  [Enter custom answer          ]      │  ← only when allowFreeformInput
├─────────────────────────────────────────┤
│ < >  2/5           ⌘↵ to submit [Submit]│  ← Submit only on last question
└─────────────────────────────────────────┘
```

- Numbered rows; selected rows show a checkmark on the right
- Freeform input always appears as the last numbered row when present
- `<` back button: always available (disabled on first question)
- `>` next button: disabled on last question
- `n/total` progress indicator in footer
- On last question: keyboard hint (`⌘↵ to submit`) + blue `Submit` button replace the `>` button
- Answers persist as user navigates — back/forward freely edits any question

### Dismiss behavior

Clicking X opens a confirmation dialog. On confirm, the widget is discarded with no message sent to the AI. On cancel, the dialog closes and the widget remains.

### Submission

On submit (button click or `⌘↵` on last question):
- Calls `submitBatch(widget, answers)` from `useWizard`
- The widget collapses/disappears from the chat
- A summary user message bubble appears in its place

## `useWizard` changes

### New action: `SUBMIT_BATCH`

```ts
| {
    type: "SUBMIT_BATCH";
    widgetId: string;
    answers: Record<string, string | string[]>;
    sourceWidget: Extract<AgentMessage, { type: "questions" }>;
  }
```

Reducer behavior:
1. Remove the `questions` widget message (matched by `widgetId`) from the messages list
2. Add a new user message with `role: "user"`, `sourceWidget` set to the original widget, and `text` as the JSON-serialized answers

### New method: `submitBatch`

```ts
submitBatch: (
  widget: Extract<AgentMessage, { type: "questions" }>,
  widgetId: string,
  answers: Record<string, string | string[]>
) => void
```

Serializes answers to JSON string and triggers `sendToAPI` with the updated message list.

### Answers JSON format (sent to AI as user message text)

```json
{
  "Scenario": "Bug report",
  "Fields": ["Single choice", "Multi-select", "Freeform text"],
  "ShortText": "some value",
  "MixedField": "Option B",
  "Repeat": "Yes"
}
```

- Single-select → `string`
- Multi-select → `string[]`
- Freeform → `string`
- Mixed (option selected) → `string` (the option label)
- Mixed (custom text entered) → `string` (the freeform value)

## Summary bubble (`WizardMessage`)

When a user message has `sourceWidget.type === "questions"`, render a Q&A summary card instead of a plain text bubble:

```
Q: What kind of scenario should this test simulate?
A: Bug report

Q: Which field types are most important to verify?
A: Single choice, Multi-select, Freeform text

...
```

- Question label in normal weight, answer in bold
- Compact card style, consistent with existing widget styling

## Files changed

| File | Change |
|---|---|
| `src/modules/wizard/schema.ts` | Add `questions` type to `AgentMessageSchema` |
| `src/modules/wizard/hooks/useWizard.ts` | Add `SUBMIT_BATCH` action, `submitBatch` method, export from `UseWizardReturn` |
| `src/modules/wizard/components/widgets/QuestionsBatchWidget.tsx` | New component |
| `src/modules/wizard/components/WizardMessage.tsx` | Add `questions` render branch + summary card for `sourceWidget.type === "questions"` |
| `src/modules/wizard/index.ts` | Export new component if needed |
