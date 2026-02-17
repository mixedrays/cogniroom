import { defineEventHandler, readBody, createError, getRouterParam } from "h3";
import { generateText } from "ai";
import {
  getOpenAIClient,
  type AvailableModelsId,
  DEFAULT_MODEL,
} from "@root/server/lib/llm";
import { getRenderedPrompt } from "@root/server/lib/promptService";
import { storage, storageApi } from "@root/modules/storage";

export default defineEventHandler(async (event) => {
  try {
    const courseId = getRouterParam(event, "id");
    const lessonId = getRouterParam(event, "lessonId");
    const body = await readBody<{
      additionalInstructions?: string;
      model?: string;
    }>(event);
    const model = (body?.model ?? DEFAULT_MODEL).trim() as AvailableModelsId;

    if (!courseId || !lessonId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Missing courseId or lessonId",
      });
    }

    const courseResponse = await storage<any>(`courses/${courseId}/course.json`);
    if (!courseResponse.ok) {
      throw createError({
        statusCode: courseResponse.status,
        statusMessage: courseResponse.status === 404 ? "Course not found" : courseResponse.statusText,
      });
    }
    const course = await courseResponse.json();

    let targetLesson: any = null;
    let targetTopic: any = null;

    for (const topic of course.topics) {
      const lesson = topic.lessons?.find((l: any) => l.id === lessonId);
      if (lesson) {
        targetLesson = lesson;
        targetTopic = topic;
        break;
      }
    }

    if (!targetLesson) {
      throw createError({
        statusCode: 404,
        statusMessage: "Lesson not found in course",
      });
    }

    const additionalInstructions = body?.additionalInstructions?.trim()
      ? `\nAdditional Instructions from user: ${body.additionalInstructions.trim()}`
      : "";

    const prompt = await getRenderedPrompt("exercises-generation", {
      courseTitle: course.title,
      topicTitle: targetTopic.title,
      topicDescription: targetTopic.description,
      lessonTitle: targetLesson.title,
      lessonDescription: targetLesson.description,
      additionalInstructions,
    });

    const result = await generateText({
      model: getOpenAIClient(model),
      prompt,
    });

    const content = result.text;

    // Save exercises (auto-creates parent directories)
    await storageApi.post(`courses/${courseId}/lessons/${lessonId}/exercise.md`, content);

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
