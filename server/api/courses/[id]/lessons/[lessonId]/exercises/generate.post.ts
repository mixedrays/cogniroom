import { defineEventHandler, readBody, createError, getRouterParam } from "h3";
import { generateText } from "ai";
import {
  getOpenAIClient,
  type AvailableModelsId,
  DEFAULT_MODEL,
} from "@root/server/lib/llm";
import { getRenderedPrompt } from "@root/server/lib/promptService";
import { storageApi } from "@modules/storage";
import { getFormatAdapter } from "@modules/content-formats";
import { storagePaths } from "@root/server/lib/storagePaths";
import type { Lesson, Topic } from "@modules/core";

export default defineEventHandler(async (event) => {
  try {
    const courseId = getRouterParam(event, "id");
    const lessonId = getRouterParam(event, "lessonId");
    const body = await readBody<{
      additionalInstructions?: string;
      model?: string;
      includeContent?: boolean;
    }>(event);
    const model = (body?.model ?? DEFAULT_MODEL).trim() as AvailableModelsId;

    if (!courseId || !lessonId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Missing courseId or lessonId",
      });
    }

    const courseAdapter = getFormatAdapter("course");
    const courseResponse = await storageApi.get<string>(
      storagePaths.course(courseId)
    );
    if (!courseResponse.ok) {
      throw createError({
        statusCode: courseResponse.status,
        statusMessage:
          courseResponse.status === 404
            ? "Course not found"
            : courseResponse.statusText,
      });
    }
    const course = courseAdapter.deserialize(await courseResponse.text());

    let targetLesson: Lesson | null = null;
    let targetTopic: Topic | null = null;

    for (const topic of course.topics) {
      const lesson = topic.lessons?.find((l) => l.id === lessonId);
      if (lesson) {
        targetLesson = lesson;
        targetTopic = topic;
        break;
      }
    }

    if (!targetLesson || !targetTopic) {
      throw createError({
        statusCode: 404,
        statusMessage: "Lesson not found in course",
      });
    }

    const additionalInstructions = body?.additionalInstructions?.trim()
      ? `\nAdditional Instructions from user: ${body.additionalInstructions.trim()}`
      : "";

    let lessonContent = "";
    if (body?.includeContent !== false) {
      const lessonResponse = await storageApi.get<string>(
        storagePaths.lesson(courseId, lessonId)
      );
      if (lessonResponse.ok) {
        const text = await lessonResponse.text();
        if (text?.trim()) {
          lessonContent = `\n\nLesson Theory Content:\n---\n${text.trim()}\n---`;
        }
      }
    }

    const prompt = await getRenderedPrompt("exercises-generation", {
      courseTitle: course.title,
      topicTitle: targetTopic.title,
      topicDescription: targetTopic.description ?? "",
      lessonTitle: targetLesson.title,
      lessonDescription: targetLesson.description ?? "",
      lessonContent,
      additionalInstructions,
    });

    const result = await generateText({
      model: getOpenAIClient(model),
      prompt,
    });

    const content = result.text;

    // Save exercises (auto-creates parent directories)
    await storageApi.post(storagePaths.exercise(courseId, lessonId), content);

    return { success: true, content };
  } catch (error: any) {
    if (error.statusCode) {
      throw error;
    }

    console.error("Error generating exercises:", error);
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to generate exercises: ${error.message}`,
    });
  }
});
