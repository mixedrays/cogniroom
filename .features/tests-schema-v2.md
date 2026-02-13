# Tests Schema V2 — Flashcards & Quizzes

## Goal

Upgrade the LLM generation schema and storage format for flashcards and quiz questions to support richer content and multiple quiz types. No backward compatibility with V1 — old test data can be regenerated.

## LLM Generation Schema (Zod)

```typescript
const TestsDraftSchema = z.object({
  flashcards: z.array(z.object({
    question: z.string(),
    answer: z.string(),
    hint: z.string().optional(),
    difficulty: z.enum(["easy", "medium", "hard"]),
  })),
  quizQuestions: z.array(z.discriminatedUnion("type", [
    z.object({
      type: z.literal("choice"),
      question: z.string(),
      options: z.array(z.object({ text: z.string(), isCorrect: z.boolean() })),
      explanation: z.string().optional(),
      difficulty: z.enum(["easy", "medium", "hard"]),
    }),
    z.object({
      type: z.literal("true-false"),
      question: z.string(),
      answer: z.boolean(),
      explanation: z.string().optional(),
      difficulty: z.enum(["easy", "medium", "hard"]),
    }),
  ])),
});
```

## Storage Types (TypeScript)

```typescript
// --- Content types (LLM-generated, immutable after generation) ---

interface Flashcard {
  id: string;
  question: string;
  answer: string;
  hint?: string;
  difficulty: "easy" | "medium" | "hard";
}

interface ChoiceQuizQuestion {
  type: "choice";
  id: string;
  question: string;
  options: { text: string; isCorrect: boolean }[];
  explanation?: string;
  difficulty: "easy" | "medium" | "hard";
}

interface TrueFalseQuizQuestion {
  type: "true-false";
  id: string;
  question: string;
  answer: boolean;
  explanation?: string;
  difficulty: "easy" | "medium" | "hard";
}

type QuizQuestion = ChoiceQuizQuestion | TrueFalseQuizQuestion;

interface TestsContent {
  version: 2;
  flashcards: Flashcard[];
  quizQuestions: QuizQuestion[];
}

// --- Review data (user progress, stored separately) ---

interface ReviewEntry {
  itemId: string;            // references Flashcard.id or QuizQuestion.id
  repetitions: number;       // consecutive correct recalls (resets to 0 on incorrect)
  easeFactor: number;        // SM-2 ease factor, initial 2.5, minimum 1.3
  interval: number;          // current interval in days
  lastReviewedAt: string;    // ISO timestamp of last review
  nextReviewAt: string;      // ISO timestamp when item is due
}

interface ReviewData {
  lessonId: string;
  entries: ReviewEntry[];
}
```

## Choice Question — UI Rendering Rule

Determine input type by counting correct options:
- `options.filter(o => o.isCorrect).length === 1` → radio inputs (single answer)
- `options.filter(o => o.isCorrect).length > 1` → checkbox inputs (multiple answers)

No separate type needed; the data itself drives the UI.

## Spaced Repetition (Future)

Uses the SM-2 algorithm. Review progress is stored separately from content, matched by `itemId` → `Flashcard.id` / `QuizQuestion.id`. A `ReviewEntry` is created on first review of an item. Items with no matching entry are treated as new (never reviewed).

### SM-2 Algorithm Summary

After each review, the user rates quality `q` (0–5):
- `q < 3` → incorrect: reset `repetitions = 0`, `interval = 1`
- `q >= 3` → correct:
  - `repetitions === 0` → `interval = 1`
  - `repetitions === 1` → `interval = 6`
  - `repetitions >= 2` → `interval = Math.round(interval * easeFactor)`
  - `easeFactor = Math.max(1.3, easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)))`
  - `repetitions += 1`
- Set `lastReviewedAt = now`, `nextReviewAt = now + interval days`

### Quality Rating Mapping

| Context | User action | Quality `q` |
|---------|-------------|-------------|
| Flashcard | Knew immediately | 5 |
| Flashcard | Knew after hesitation | 4 |
| Flashcard | Knew after hint | 3 |
| Flashcard | Didn't know | 1 |
| Quiz | Correct on first try | 5 |
| Quiz | Correct after elimination | 3 |
| Quiz | Incorrect | 1 |

### Study Session Flow

1. Load `TestsContent` for target lessons + load `ReviewData` for same lessons
2. Match entries by `itemId`; items with no entry are new
3. Collect due items (`nextReviewAt <= now`) and new items
4. Sort: due items first (oldest `nextReviewAt`), then new items
5. After each item review, upsert `ReviewEntry` in `ReviewData` and persist
6. Session ends when no due/new items remain

### Storage Layout

Content and review data are stored in separate files:

```
data/courses/[courseId]/
├── tests/
│   └── [lessonId].json        # TestsContent (immutable after generation)
└── reviews/
    └── [lessonId].json        # ReviewData (mutated on each review)
```

Regenerating tests for a lesson replaces `tests/[lessonId].json` with new IDs — the corresponding `reviews/[lessonId].json` becomes orphaned and should be deleted.

## Design Decisions

| Decision | Rationale |
|----------|-----------|
| `hint` on flashcards (optional) | Helps study without flipping; cheap for LLM to generate |
| `difficulty` on both types | Enables filtered study sessions; LLM estimates well |
| No `tags` on flashcards | Over-engineering for per-lesson scoped cards |
| `isCorrect` flag on options instead of separate `answer` string | Eliminates fragile string matching; naturally supports multi-select |
| Merged multiple-choice and multiple-select into `"choice"` | Distinguishable by `isCorrect` count; fewer types, same expressiveness |
| `true-false` as separate type | Distinct UX (statement + agree/disagree), no options array needed |
| `explanation` on quiz questions (optional) | High learning value at moment of feedback; trivial for LLM |
| Content and review data stored separately | Content is immutable after generation; review data mutates frequently. Separate files avoid rewriting content on every review |
| `ReviewEntry.itemId` references content IDs | Loose coupling — content can be regenerated independently; orphaned reviews are simply deleted |
| SM-2 over Leitner | SM-2 adapts per-card based on user performance; Leitner uses fixed box intervals |
| `ReviewEntry` created on first review only | No need to pre-populate entries for all items; items without entries = new |
| No fill-in-the-blank or open-ended | Hard to validate client-side without LLM grading |
| No V1 backward compatibility | Old test data can be regenerated; avoids migration complexity |

## Files to Modify

| File | Change |
|------|--------|
| `src/lib/types.ts` | Replace `Flashcard`, `QuizQuestion`, `TestsContent` types with V2 definitions |
| `server/api/courses/[id]/lessons/[lessonId]/tests/generate.post.ts` | Replace `TestsDraftSchema` Zod schema and normalization logic |
| `server/lib/promptRegistry.ts` | Update `tests-generation` prompt to instruct LLM about new format (hint, difficulty, question types, `isCorrect` flag) |
| `src/modules/quiz/hooks/useQuiz.ts` | Handle `choice` and `true-false` types; shuffle options for choice only |
| `src/modules/quiz/hooks/useQuizAnswers.ts` | Support boolean answers (true-false) and multi-select checking (checkbox) |
| `src/modules/quiz/components/*` | Render radio vs checkbox based on `isCorrect` count; render true-false; show explanation after check |
| `src/modules/flashcards/components/*` | Render optional hint (e.g. toggle or subtle text); show difficulty badge |
