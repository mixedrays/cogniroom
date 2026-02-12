import { defineEventHandler, readBody, createError, getRouterParam } from "h3";
import { storage, storageApi } from "@root/modules/storage";

type LessonSection = "theory" | "tests" | "exercises";

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
      throw createError({
        statusCode: 400,
        statusMessage: "Missing courseId or lessonId",
      });
    }

    const section: LessonSection = body?.section ?? "theory";
    const coursePath = `courses/${courseId}/course.json`;
    const response = await storage<any>(coursePath);

    if (!response.ok) {
      throw createError({
        statusCode: response.status,
        statusMessage: response.status === 404 ? "Course not found" : response.statusText,
      });
    }

    const course = await response.json();

    let targetLesson: any = null;

    for (const topic of course.topics ?? []) {
      const lesson = topic.lessons?.find((l: any) => l.id === lessonId);
      if (lesson) {
        targetLesson = lesson;
        break;
      }
    }

    if (!targetLesson) {
      throw createError({
        statusCode: 404,
        statusMessage: "Lesson not found in course",
      });
    }

    const now = new Date().toISOString();

    // Get the field names based on section
    const completedField = `${section}Completed`;
    const completedAtField = `${section}CompletedAt`;

    // Determine the current value (handle legacy 'completed' field for theory)
    const currentValue =
      section === "theory"
        ? targetLesson[completedField] ?? targetLesson.completed ?? false
        : targetLesson[completedField] ?? false;

    const nextCompleted =
      typeof body?.completed === "boolean" ? body.completed : !currentValue;

    // Update the section-specific fields
    targetLesson[completedField] = nextCompleted;
    if (nextCompleted) {
      targetLesson[completedAtField] = now;
    } else {
      delete targetLesson[completedAtField];
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

    await storageApi.put(coursePath, course);

    return {
      success: true,
      section,
      completed: nextCompleted,
      completedAt: nextCompleted ? now : null,
    };
  } catch (error: any) {
    if (error?.statusCode) {
      throw error;
    }

    console.error("Error updating lesson completion:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal server error",
    });
  }
});
