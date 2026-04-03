import {
  defineEventHandler,
  readBody,
  HTTPError,
  getRouterParam,
} from "h3";
import { storageApi } from "@modules/storage";
import { getFormatAdapter } from "@modules/content-formats";
import { storagePaths } from "@root/server/lib/storagePaths";
import type { Lesson, LessonSection } from "@modules/core";

interface UpdateLessonBody {
  completed?: boolean;
  section?: LessonSection;
}

export default defineEventHandler(async (event) => {
  try {
    const courseId = getRouterParam(event, "id");
    const lessonId = getRouterParam(event, "lessonId");
    const body = await readBody<UpdateLessonBody>(event);

    if (!courseId || !lessonId) {
      throw new HTTPError({
        status: 400,
        message: "Missing courseId or lessonId",
      });
    }

    const courseAdapter = getFormatAdapter("course");
    const section: LessonSection = body?.section ?? "theory";
    const coursePath = storagePaths.course(courseId);
    const response = await storageApi.get<string>(coursePath);

    if (!response.ok) {
      throw new HTTPError({
        status: response.status,
        message:
          response.status === 404 ? "Course not found" : response.statusText,
      });
    }

    const course = courseAdapter.deserialize(await response.text());

    let targetLesson: Lesson | null = null;

    for (const topic of course.topics ?? []) {
      const lesson = topic.lessons?.find((l) => l.id === lessonId);
      if (lesson) {
        targetLesson = lesson;
        break;
      }
    }

    if (!targetLesson) {
      throw new HTTPError({
        status: 404,
        message: "Lesson not found in course",
      });
    }

    const now = new Date().toISOString();

    // Get the field names based on section
    const completedField = `${section}Completed`;
    const completedAtField = `${section}CompletedAt`;
    const lessonRecord = targetLesson as unknown as Record<string, unknown>;

    // Determine the current value (handle legacy 'completed' field for theory)
    const currentValue =
      section === "theory"
        ? ((lessonRecord[completedField] as boolean | undefined) ??
          targetLesson.completed ??
          false)
        : ((lessonRecord[completedField] as boolean | undefined) ?? false);

    const nextCompleted =
      typeof body?.completed === "boolean" ? body.completed : !currentValue;

    // Update the section-specific fields
    lessonRecord[completedField] = nextCompleted;
    if (nextCompleted) {
      lessonRecord[completedAtField] = now;
    } else {
      delete lessonRecord[completedAtField];
    }

    // For backwards compatibility, also update legacy fields for theory
    if (section === "theory") {
      targetLesson.completed = nextCompleted;
      if (nextCompleted) {
        targetLesson.completedAt = now;
      } else {
        delete targetLesson.completedAt;
      }
    }

    course.updatedAt = now;

    await storageApi.put(coursePath, courseAdapter.serialize(course));

    return {
      success: true,
      section,
      completed: nextCompleted,
      completedAt: nextCompleted ? now : null,
    };
  } catch (error: unknown) {
    if (error instanceof HTTPError) {
      throw error;
    }

    console.error("Error updating lesson completion:", error);
    throw new HTTPError({
      status: 500,
      message: "Internal server error",
    });
  }
});
