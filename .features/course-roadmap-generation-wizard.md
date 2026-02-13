# Course Roadmap Generation Wizard

Smart assistant wizard that helps users generate an optimal course roadmap
based on their preferences, experience, and current skill level.

## Architecture

Implemented as a separate, independent module (`src/modules/roadmap-wizard/`).

## Location

Dialog on "Create Course" button click → "Generate" tab

## Flow

### Step 1: Initial Input

- **Topic** — Text input (broad to specific)
- **Level** — Button group (radio): Beginner / Intermediate / Advanced
- **Presets** — Show hardcoded popular presets + after topic entry, LLM suggests
  2-3 contextual preset paths. Selecting a preset pre-fills answers, skips to preview.

### Steps 2–N: Iterative Clarification (max 5 rounds)

- **First round (hybrid)**: Fixed core questions (learning goals, time commitment,
  learning style, scope preference, deadline) + 1-2 LLM-generated contextual
  questions based on topic
- **Subsequent rounds**: Fully LLM-generated based on accumulated context
- UI controls per question: checkboxes, button groups (radio), text input
- All questions rendered from JSON schema returned by LLM
- **Navigation**: Prev / Next buttons, clickable stepper bar
- **Actions**: "Generate" (skip remaining) or "More questions" (request extra round)

### Preview Step

- Read-only metaprompt preview with "Edit prompt" toggle for raw text editing
- Shows all collected context assembled into the final LLM prompt

### Generation

- Sends metaprompt to selected LLM model
- Loading state → full result

## Options

- LLM model selector (visible throughout)
