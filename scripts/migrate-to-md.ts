/**
 * One-time migration script: converts existing .json data files to .md format.
 *
 * Converts:
 *   data/courses/<id>/course.json         → course.md
 *   data/courses/<id>/lessons/<id>/flashcards.json → flashcards.md
 *   data/courses/<id>/lessons/<id>/quiz.json        → quiz.md
 *
 * Deletes the original .json files after successful conversion.
 * reviews.json is intentionally left as JSON (system/machine data).
 *
 * Usage:
 *   npx tsx scripts/migrate-to-md.ts
 */

import { readFileSync, writeFileSync, unlinkSync, readdirSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { courseToMd, flashcardsToMd, quizToMd } from "../modules/md-formats/index.js";
import type { Course, FlashcardsContent, QuizContent } from "../src/lib/types.js";

const DATA_DIR = resolve(process.cwd(), "data");
const COURSES_DIR = join(DATA_DIR, "courses");

let converted = 0;
let skipped = 0;
let errors = 0;

function migrateJson<T>(
  jsonPath: string,
  mdPath: string,
  serialize: (data: T) => string,
  label: string
): void {
  if (!existsSync(jsonPath)) return;
  if (existsSync(mdPath)) {
    console.log(`  SKIP  ${label} (${mdPath} already exists)`);
    skipped++;
    return;
  }
  try {
    const raw = readFileSync(jsonPath, "utf-8");
    const data = JSON.parse(raw) as T;
    const md = serialize(data);
    writeFileSync(mdPath, md, "utf-8");
    unlinkSync(jsonPath);
    console.log(`  OK    ${label}`);
    converted++;
  } catch (err) {
    console.error(`  ERROR ${label}: ${err}`);
    errors++;
  }
}

function migrateCourse(courseDir: string, courseId: string): void {
  const jsonPath = join(courseDir, "course.json");
  const mdPath = join(courseDir, "course.md");
  migrateJson<Course>(jsonPath, mdPath, courseToMd, `course ${courseId}`);

  const lessonsDir = join(courseDir, "lessons");
  if (!existsSync(lessonsDir)) return;

  for (const lessonId of readdirSync(lessonsDir)) {
    const lessonDir = join(lessonsDir, lessonId);

    migrateJson<FlashcardsContent>(
      join(lessonDir, "flashcards.json"),
      join(lessonDir, "flashcards.md"),
      flashcardsToMd,
      `  flashcards ${courseId}/${lessonId}`
    );

    migrateJson<QuizContent>(
      join(lessonDir, "quiz.json"),
      join(lessonDir, "quiz.md"),
      quizToMd,
      `  quiz ${courseId}/${lessonId}`
    );
  }
}

console.log(`Migrating data files in: ${COURSES_DIR}\n`);

for (const courseId of readdirSync(COURSES_DIR)) {
  const courseDir = join(COURSES_DIR, courseId);
  migrateCourse(courseDir, courseId);
}

console.log(`\nDone. Converted: ${converted}, Skipped: ${skipped}, Errors: ${errors}`);
if (errors > 0) process.exit(1);
