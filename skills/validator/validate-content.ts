/**
 * CogniRoom content validator.
 *
 * Validates generated content files against the SAME parsers and schemas the
 * app uses at its write boundary, so externally-generated content (e.g. by an
 * AI agent skill) is guaranteed to load correctly in the app.
 *
 * This is the skills-owned validator harness. It is bundled into a standalone,
 * dependency-free artifact (skills/bin/validate-content.mjs) by
 * skills/validator/build.ts, so any agent can run it with bare `node`.
 *
 * Usage (provider-agnostic, no npm needed):
 *   node skills/bin/validate-content.mjs                 # validates the configured DATA_PATH
 *   node skills/bin/validate-content.mjs <path> [<path> ...]
 *   node skills/bin/validate-content.mjs "$DATA_PATH/courses/python-for-beginners"
 *
 * In-repo convenience aliases (same artifact under the hood):
 *   npm run validate:content
 *   npm run validate:content -- <path> [<path> ...]
 *
 * With no argument it validates the app's configured content root (the DATA_PATH
 * env var, default ./data), so it follows a custom data directory automatically.
 *
 * A <path> may be:
 *   - a course.md / flashcards.md / quiz.md / deck.json / lesson.md / exercise.md file
 *   - a course directory (course.md + lessons/<id>/{lesson,flashcards,quiz,exercise}.md)
 *   - a deck directory (deck.json + flashcards.md|quiz.md)
 *   - any parent directory (e.g. data/) — it is searched recursively
 *
 * ERRORS block loading in the app and set a non-zero exit code. WARNINGS flag
 * content that loads fine but falls short of the recommended generation targets
 * (>= 8 flashcards, >= 5 quiz questions); they do not fail the run.
 *
 * Exit code 0 = no errors, 1 = at least one error, 2 = bad invocation.
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import { z } from "zod";
import {
  mdToCourse,
  courseToMd,
  mdToFlashcards,
  flashcardsToMd,
  mdToQuiz,
  quizToMd,
  splitOnBoundaries,
} from "@modules/md-formats";
import { courseCreateSchema } from "@modules/core";
import type { Course, Deck } from "@modules/core";
import {
  FlashcardsContentOutputSchema,
  QuizContentOutputSchema,
} from "@/modules/agent/lib/contentOutputSchemas";

// Self-contained content-root resolution (mirrors server/env.ts) so the bundled
// validator carries no app-env coupling. Reads DATA_PATH from .env / process.env,
// defaulting to ./data relative to the current working directory.
loadEnv();
const DATA_PATH = resolve(process.cwd(), process.env.DATA_PATH || "./data");

type Kind = "course" | "flashcards" | "quiz" | "deck" | "prose";
type Target = { file: string; kind: Kind };

interface Issue {
  file: string;
  message: string;
  /** "error" blocks loading in the app; "warning" is a quality shortfall. */
  severity: "error" | "warning";
}

const asError = (file: string, message: string): Issue => ({
  file,
  message,
  severity: "error",
});
const asWarning = (file: string, message: string): Issue => ({
  file,
  message,
  severity: "warning",
});

/** Recommended generation targets (the app's generation contract). */
const RECOMMENDED_MIN = { flashcards: 8, quiz: 5 } as const;

const isoDate = z
  .string()
  .refine((v) => !Number.isNaN(Date.parse(v)), "must be an ISO date string");

/**
 * Per-item content schemas — reuse the app's element validation but drop the
 * bulk minimums (>=8, >=5), which we surface as warnings instead of errors.
 * Rebuilt from `.element` because chaining `.min(1)` would not remove `.min(8)`.
 */
const flashcardsItemsSchema = z.object({
  flashcards: z.array(FlashcardsContentOutputSchema.shape.flashcards.element).min(1),
});
const quizItemsSchema = z.object({
  quizQuestions: z.array(QuizContentOutputSchema.shape.quizQuestions.element).min(1),
});

/** deck.json shape — mirrors the persisted `Deck` core type. */
const deckJsonSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  kind: z.enum(["flashcards", "quiz"]),
  source: z.enum(["llm", "manual", "import"]),
  createdAt: isoDate,
  updatedAt: isoDate,
}) satisfies z.ZodType<Deck>;

/** Stable stringify with recursively sorted object keys (order-insensitive). */
function canonical(value: unknown): string {
  return JSON.stringify(value, (_key, val) => {
    if (val && typeof val === "object" && !Array.isArray(val)) {
      return Object.fromEntries(
        Object.entries(val as Record<string, unknown>).sort(([a], [b]) =>
          a.localeCompare(b)
        )
      );
    }
    return val;
  });
}

function flattenZodIssues(error: z.ZodError, file: string): Issue[] {
  return error.issues.map((i) =>
    asError(file, `${i.path.join(".") || "<root>"}: ${i.message}`)
  );
}

/**
 * How many item blocks the author wrote, regardless of whether they parse.
 * The parsers silently skip blocks with missing/invalid fields (and choice
 * questions with no options), so comparing this against the parsed count
 * exposes items the app would silently drop.
 */
function countAuthoredBlocks(text: string): number {
  const parts = splitOnBoundaries(text.trim());
  return Math.max(0, Math.ceil((parts.length - 2) / 2));
}

function findDuplicates(ids: string[]): string[] {
  const seen = new Set<string>();
  const dupes = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) dupes.add(id);
    seen.add(id);
  }
  return [...dupes];
}

/**
 * Parse-stability invariant: parsing the re-serialized form must yield the same
 * object. Catches genuine corruption (e.g. a description/answer containing a
 * stray '---' that breaks item boundaries) while ignoring volatile fields like
 * lesson progress, since both sides pass through the same normalization.
 */
function assertParseStable<T>(
  file: string,
  value: T,
  reparse: () => T,
  issues: Issue[]
) {
  let again: T;
  try {
    again = reparse();
  } catch (error) {
    issues.push(asError(file, `re-parse after serialize failed: ${String(error)}`));
    return;
  }
  if (canonical(value) !== canonical(again)) {
    issues.push(
      asError(
        file,
        "content is not parse-stable — a value likely breaks item boundaries. " +
          "Check for a stray '---' line inside a description, answer, or question body."
      )
    );
  }
}

function validateCourse(file: string): Issue[] {
  const issues: Issue[] = [];
  const text = readFileSync(file, "utf-8");

  let course: Course;
  try {
    course = mdToCourse(text);
  } catch (error) {
    return [asError(file, `failed to parse course.md: ${String(error)}`)];
  }

  // The directory name is the canonical course id used by the app.
  const dirId = basename(dirname(file));
  if (course.id !== dirId)
    issues.push(
      asError(file, `frontmatter id "${course.id}" must equal the folder name "${dirId}"`)
    );
  if (!course.createdAt || Number.isNaN(Date.parse(course.createdAt)))
    issues.push(asError(file, "createdAt must be an ISO date string"));
  if (!course.updatedAt || Number.isNaN(Date.parse(course.updatedAt)))
    issues.push(asError(file, "updatedAt must be an ISO date string"));

  // Validate against the real server write-boundary schema (POST /api/courses).
  const asInput = {
    title: course.title,
    description: course.description,
    source: course.source,
    sourceUrl: course.sourceUrl,
    createdAt: course.createdAt,
    topics: course.topics.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      lessons: t.lessons.map((l) => ({
        id: l.id,
        title: l.title,
        description: l.description,
      })),
    })),
  };
  const parsed = courseCreateSchema.safeParse(asInput);
  if (!parsed.success) issues.push(...flattenZodIssues(parsed.error, file));

  if (course.topics.length === 0)
    issues.push(asError(file, "course must have at least one topic"));
  for (const topic of course.topics) {
    if (!topic.id) issues.push(asError(file, `topic "${topic.title}" is missing an id`));
    if (topic.lessons.length === 0)
      issues.push(asError(file, `topic "${topic.title}" must have at least one lesson`));
    for (const lesson of topic.lessons) {
      if (!lesson.id)
        issues.push(
          asError(file, `lesson "${lesson.title}" (topic "${topic.title}") is missing an id`)
        );
    }
  }

  const dupeTopics = findDuplicates(course.topics.map((t) => t.id).filter(Boolean));
  if (dupeTopics.length)
    issues.push(asError(file, `duplicate topic ids: ${dupeTopics.join(", ")}`));
  const dupeLessons = findDuplicates(
    course.topics.flatMap((t) => t.lessons.map((l) => l.id)).filter(Boolean)
  );
  if (dupeLessons.length)
    issues.push(asError(file, `duplicate lesson ids: ${dupeLessons.join(", ")}`));

  // The app locates per-lesson content by folder name === lesson id, so a
  // folder that matches no lesson id holds content the app will never show.
  const lessonsDir = join(dirname(file), "lessons");
  if (existsSync(lessonsDir)) {
    const lessonIds = new Set(
      course.topics.flatMap((t) => t.lessons.map((l) => l.id))
    );
    for (const entry of readdirSync(lessonsDir)) {
      if (!statSync(join(lessonsDir, entry)).isDirectory()) continue;
      if (!lessonIds.has(entry))
        issues.push(
          asError(
            file,
            `lessons/${entry}/ does not match any lesson id in course.md — its content will never appear in the app`
          )
        );
    }
  }

  assertParseStable(file, course, () => mdToCourse(courseToMd(course)), issues);
  return issues;
}

function validateFlashcards(file: string): Issue[] {
  const issues: Issue[] = [];
  const text = readFileSync(file, "utf-8");

  let content;
  try {
    content = mdToFlashcards(text);
  } catch (error) {
    return [asError(file, `failed to parse flashcards.md: ${String(error)}`)];
  }

  const parsed = flashcardsItemsSchema.safeParse({ flashcards: content.flashcards });
  if (!parsed.success) issues.push(...flattenZodIssues(parsed.error, file));

  const dupes = findDuplicates(content.flashcards.map((c) => c.id));
  if (dupes.length) issues.push(asError(file, `duplicate card ids: ${dupes.join(", ")}`));

  const authored = countAuthoredBlocks(text);
  if (authored > content.flashcards.length)
    issues.push(
      asError(
        file,
        `${authored - content.flashcards.length} of ${authored} card blocks failed to parse and would be silently dropped — check each block has id and question fields and the file ends with '---'`
      )
    );

  if (content.flashcards.length < RECOMMENDED_MIN.flashcards)
    issues.push(
      asWarning(
        file,
        `only ${content.flashcards.length} cards — aim for >= ${RECOMMENDED_MIN.flashcards}`
      )
    );

  assertParseStable(file, content, () => mdToFlashcards(flashcardsToMd(content)), issues);
  return issues;
}

function validateQuiz(file: string): Issue[] {
  const issues: Issue[] = [];
  const text = readFileSync(file, "utf-8");

  let content;
  try {
    content = mdToQuiz(text);
  } catch (error) {
    return [asError(file, `failed to parse quiz.md: ${String(error)}`)];
  }

  const parsed = quizItemsSchema.safeParse({ quizQuestions: content.quizQuestions });
  if (!parsed.success) issues.push(...flattenZodIssues(parsed.error, file));

  for (const q of content.quizQuestions) {
    if (q.type === "choice") {
      if (q.options.length < 2)
        issues.push(asError(file, `choice question "${q.id}" needs at least 2 options`));
      if (!q.options.some((o) => o.isCorrect))
        issues.push(asError(file, `choice question "${q.id}" has no correct option`));
    }
  }

  const dupes = findDuplicates(content.quizQuestions.map((q) => q.id));
  if (dupes.length) issues.push(asError(file, `duplicate question ids: ${dupes.join(", ")}`));

  const authored = countAuthoredBlocks(text);
  if (authored > content.quizQuestions.length)
    issues.push(
      asError(
        file,
        `${authored - content.quizQuestions.length} of ${authored} question blocks failed to parse and would be silently dropped — check id/type fields, the '## ' question line, options on choice questions, and the trailing '---'`
      )
    );

  if (content.quizQuestions.length < RECOMMENDED_MIN.quiz)
    issues.push(
      asWarning(
        file,
        `only ${content.quizQuestions.length} questions — aim for >= ${RECOMMENDED_MIN.quiz}`
      )
    );

  assertParseStable(file, content, () => mdToQuiz(quizToMd(content)), issues);
  return issues;
}

function validateDeck(file: string): Issue[] {
  const issues: Issue[] = [];

  // A deck folder without deck.json never registers in the app, even if its
  // markdown is perfect. Still validate any content files so all problems
  // surface in one run.
  if (!existsSync(file)) {
    issues.push(
      asError(file, "deck.json is missing — the app only registers decks that have one")
    );
    for (const kind of ["flashcards", "quiz"] as const) {
      const contentFile = join(dirname(file), `${kind}.md`);
      if (existsSync(contentFile))
        issues.push(
          ...(kind === "flashcards"
            ? validateFlashcards(contentFile)
            : validateQuiz(contentFile))
        );
    }
    return issues;
  }

  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(file, "utf-8"));
  } catch (error) {
    return [asError(file, `deck.json is not valid JSON: ${String(error)}`)];
  }

  const parsed = deckJsonSchema.safeParse(raw);
  if (!parsed.success) return flattenZodIssues(parsed.error, file);
  const deck = parsed.data;

  const dirId = basename(dirname(file));
  if (deck.id !== dirId)
    issues.push(asError(file, `deck id "${deck.id}" must equal the folder name "${dirId}"`));

  // The content file must exist and match the deck kind.
  const contentFile = join(dirname(file), `${deck.kind}.md`);
  if (!existsSync(contentFile)) {
    issues.push(asError(file, `missing content file ${deck.kind}.md for this ${deck.kind} deck`));
  } else {
    issues.push(
      ...(deck.kind === "flashcards"
        ? validateFlashcards(contentFile)
        : validateQuiz(contentFile))
    );
  }
  return issues;
}

/**
 * Theory (lesson.md) and exercise (exercise.md) bodies are free-form markdown.
 * The app only treats them as present when the file is non-empty, so that is the
 * one hard requirement.
 */
function validateProse(file: string): Issue[] {
  const text = readFileSync(file, "utf-8");
  if (text.trim().length === 0)
    return [asError(file, "file is empty — the app ignores zero-size content files")];
  return [];
}

function classify(file: string): Kind | null {
  const name = basename(file);
  if (name === "course.md") return "course";
  if (name === "flashcards.md") return "flashcards";
  if (name === "quiz.md") return "quiz";
  if (name === "deck.json") return "deck";
  if (name === "lesson.md" || name === "exercise.md") return "prose";
  return null;
}

const LESSON_CONTENT_FILES = ["lesson.md", "flashcards.md", "quiz.md", "exercise.md"];

/** Collect the per-lesson content files under a course's lessons/ directory. */
function collectLessonContent(courseDir: string): Target[] {
  const lessonsDir = join(courseDir, "lessons");
  if (!existsSync(lessonsDir)) return [];
  const out: Target[] = [];
  for (const lessonId of readdirSync(lessonsDir)) {
    const lessonDir = join(lessonsDir, lessonId);
    if (!statSync(lessonDir).isDirectory()) continue;
    for (const name of LESSON_CONTENT_FILES) {
      const file = join(lessonDir, name);
      if (existsSync(file)) out.push({ file, kind: classify(file)! });
    }
  }
  return out;
}

/** Expand a path into concrete content files to validate. */
function collectTargets(path: string): Target[] {
  if (!existsSync(path)) {
    console.error(`✗ path does not exist: ${path}`);
    process.exitCode = 1;
    return [];
  }

  if (statSync(path).isFile()) {
    const kind = classify(path);
    if (!kind) {
      console.error(`✗ unrecognized file (expected course.md|flashcards.md|quiz.md|deck.json): ${path}`);
      process.exitCode = 1;
      return [];
    }
    return [{ file: path, kind }];
  }

  // Directory: a deck dir, a course dir, or a parent to recurse.
  if (existsSync(join(path, "deck.json")))
    return [{ file: join(path, "deck.json"), kind: "deck" }];
  // A folder directly under the app's deck root must have a deck.json (other
  // "decks" dirs, e.g. under history/, are not loaded by the app); hand the
  // missing file to validateDeck so the error shows up in the normal report.
  if (resolve(dirname(path)) === join(DATA_PATH, "decks"))
    return [{ file: join(path, "deck.json"), kind: "deck" }];
  if (existsSync(join(path, "course.md")))
    return [{ file: join(path, "course.md"), kind: "course" }, ...collectLessonContent(path)];

  // Otherwise pick up any recognized files directly inside (e.g. a lone lesson
  // directory) and recurse into subdirectories.
  const out: Target[] = [];
  for (const entry of readdirSync(path)) {
    const child = join(path, entry);
    if (statSync(child).isDirectory()) {
      out.push(...collectTargets(child));
    } else {
      const kind = classify(child);
      if (kind) out.push({ file: child, kind });
    }
  }
  return out;
}

function validateTarget({ file, kind }: Target): Issue[] {
  switch (kind) {
    case "course":
      return validateCourse(file);
    case "flashcards":
      return validateFlashcards(file);
    case "quiz":
      return validateQuiz(file);
    case "deck":
      return validateDeck(file);
    case "prose":
      return validateProse(file);
  }
}

function main() {
  // Default to the app's configured content root (DATA_PATH) when no path given.
  const paths = process.argv.slice(2);
  if (paths.length === 0) {
    console.log(`No path given — validating configured DATA_PATH: ${DATA_PATH}`);
    paths.push(DATA_PATH);
  }

  const targets = paths.flatMap(collectTargets);
  if (targets.length === 0) {
    console.error("No content files found to validate.");
    process.exit(process.exitCode ?? 1);
  }

  let errorFiles = 0;
  let warningFiles = 0;
  for (const target of targets) {
    const issues = validateTarget(target);
    const errors = issues.filter((i) => i.severity === "error");
    const warnings = issues.filter((i) => i.severity === "warning");

    if (errors.length === 0 && warnings.length === 0) {
      console.log(`✓ ${target.file} (${target.kind})`);
      continue;
    }

    if (errors.length > 0) {
      errorFiles++;
      console.error(`✗ ${target.file} (${target.kind})`);
    } else {
      warningFiles++;
      console.warn(`⚠ ${target.file} (${target.kind})`);
    }
    for (const issue of errors) console.error(`    error:   ${issue.message}`);
    for (const issue of warnings) console.warn(`    warning: ${issue.message}`);
  }

  const ok = targets.length - errorFiles - warningFiles;
  console.log(
    `\n${ok}/${targets.length} clean` +
      (warningFiles ? `, ${warningFiles} with warnings` : "") +
      (errorFiles ? `, ${errorFiles} with errors.` : ". No errors.")
  );
  process.exit(errorFiles ? 1 : 0);
}

main();
