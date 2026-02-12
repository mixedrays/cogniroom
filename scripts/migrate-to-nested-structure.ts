#!/usr/bin/env node
/**
 * Migration script: Reorganize flat data structure into nested course folders
 *
 * Before:
 * data/
 *   courses/{courseId}.json
 *   lessons/{lessonId}.md
 *   tests/{lessonId}.json
 *   exercises/{lessonId}.md
 *
 * After:
 * data/
 *   courses/{courseId}/
 *     course.json
 *     lessons/{lessonId}.md
 *     tests/{lessonId}.json
 *     exercises/{lessonId}.md
 */

import { promises as fs } from "node:fs";
import { join, resolve } from "node:path";

const DATA_PATH = resolve(process.cwd(), process.env.DATA_PATH || "./data");
const COURSES_DIR = join(DATA_PATH, "courses");
const LESSONS_DIR = join(DATA_PATH, "lessons");
const TESTS_DIR = join(DATA_PATH, "tests");
const EXERCISES_DIR = join(DATA_PATH, "exercises");

interface LessonInfo {
  id: string;
  title: string;
  description?: string;
  completed?: boolean;
}

interface Topic {
  id: string;
  title: string;
  lessons?: LessonInfo[];
}

interface Course {
  id: string;
  title: string;
  topics?: Topic[];
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

async function getAllLessonIds(course: Course): Promise<string[]> {
  const lessonIds: string[] = [];
  for (const topic of course.topics ?? []) {
    for (const lesson of topic.lessons ?? []) {
      lessonIds.push(lesson.id);
    }
  }
  return lessonIds;
}

async function migrateData(): Promise<void> {
  console.log("Starting migration...\n");
  console.log(`Data path: ${DATA_PATH}`);
  console.log(`Courses dir: ${COURSES_DIR}\n`);

  // Get all files in courses directory
  const entries = await fs.readdir(COURSES_DIR, { withFileTypes: true });

  // Separate JSON files (old format) and directories (might be already migrated)
  const jsonFiles = entries.filter(
    (e) => e.isFile() && e.name.endsWith(".json")
  );
  const directories = entries.filter((e) => e.isDirectory());

  console.log(`Found ${jsonFiles.length} course JSON files to migrate`);
  console.log(`Found ${directories.length} existing course directories\n`);

  let migratedCount = 0;
  let skippedCount = 0;

  for (const jsonFile of jsonFiles) {
    const courseId = jsonFile.name.replace(".json", "");
    const oldCoursePath = join(COURSES_DIR, jsonFile.name);
    const newCourseDir = join(COURSES_DIR, courseId);
    const newCoursePath = join(newCourseDir, "course.json");

    console.log(`\nMigrating course: ${courseId}`);

    // Check if already migrated (directory exists with course.json)
    if (await fileExists(newCoursePath)) {
      console.log(`  - Already migrated, skipping`);
      skippedCount++;
      continue;
    }

    // Read course data
    const courseContent = await fs.readFile(oldCoursePath, "utf-8");
    const course: Course = JSON.parse(courseContent);
    const lessonIds = await getAllLessonIds(course);

    console.log(`  - Found ${lessonIds.length} lessons`);

    // Create course directory structure
    await fs.mkdir(newCourseDir, { recursive: true });
    await fs.mkdir(join(newCourseDir, "lessons"), { recursive: true });
    await fs.mkdir(join(newCourseDir, "tests"), { recursive: true });
    await fs.mkdir(join(newCourseDir, "exercises"), { recursive: true });

    // Move course.json
    await fs.rename(oldCoursePath, newCoursePath);
    console.log(`  - Moved course.json`);

    // Move lesson files
    let lessonsMovedCount = 0;
    for (const lessonId of lessonIds) {
      const oldLessonPath = join(LESSONS_DIR, `${lessonId}.md`);
      const newLessonPath = join(newCourseDir, "lessons", `${lessonId}.md`);

      if (await fileExists(oldLessonPath)) {
        await fs.rename(oldLessonPath, newLessonPath);
        lessonsMovedCount++;
      }
    }
    console.log(`  - Moved ${lessonsMovedCount} lesson files`);

    // Move test files
    let testsMovedCount = 0;
    for (const lessonId of lessonIds) {
      // Check for JSON format first
      const oldTestJsonPath = join(TESTS_DIR, `${lessonId}.json`);
      const newTestJsonPath = join(newCourseDir, "tests", `${lessonId}.json`);

      if (await fileExists(oldTestJsonPath)) {
        await fs.rename(oldTestJsonPath, newTestJsonPath);
        testsMovedCount++;
        continue;
      }

      // Check for legacy MD format
      const oldTestMdPath = join(TESTS_DIR, `${lessonId}.md`);
      const newTestMdPath = join(newCourseDir, "tests", `${lessonId}.md`);

      if (await fileExists(oldTestMdPath)) {
        await fs.rename(oldTestMdPath, newTestMdPath);
        testsMovedCount++;
      }
    }
    console.log(`  - Moved ${testsMovedCount} test files`);

    // Move exercise files
    let exercisesMovedCount = 0;
    for (const lessonId of lessonIds) {
      const oldExercisePath = join(EXERCISES_DIR, `${lessonId}.md`);
      const newExercisePath = join(newCourseDir, "exercises", `${lessonId}.md`);

      if (await fileExists(oldExercisePath)) {
        await fs.rename(oldExercisePath, newExercisePath);
        exercisesMovedCount++;
      }
    }
    console.log(`  - Moved ${exercisesMovedCount} exercise files`);

    migratedCount++;
  }

  // Clean up empty legacy directories
  console.log("\n\nCleaning up empty directories...");

  for (const dir of [LESSONS_DIR, TESTS_DIR, EXERCISES_DIR]) {
    try {
      const files = await fs.readdir(dir);
      if (files.length === 0) {
        await fs.rmdir(dir);
        console.log(`  - Removed empty directory: ${dir}`);
      } else {
        console.log(
          `  - Directory not empty (${files.length} files remaining): ${dir}`
        );
      }
    } catch (error) {
      // Directory might not exist, ignore
    }
  }

  console.log("\n========================================");
  console.log(`Migration complete!`);
  console.log(`  Migrated: ${migratedCount} courses`);
  console.log(`  Skipped:  ${skippedCount} courses (already migrated)`);
  console.log("========================================\n");
}

migrateData().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
