import { defineEventHandler, readBody, HTTPError, getRouterParam } from "h3";
import { generateText } from "ai";
import {
  getOpenAIClient,
  type AvailableModelsId,
  DEFAULT_MODEL,
} from "@root/server/lib/llm";
import { getRenderedPrompt } from "@root/server/lib/promptService";
import { toErrorMessage } from "@root/server/lib/errors";
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
    }>(event);
    const model = (body?.model ?? DEFAULT_MODEL).trim() as AvailableModelsId;

    if (!courseId || !lessonId) {
      throw new HTTPError({
        status: 400,
        message: "Missing courseId or lessonId",
      });
    }

    // 1. Load Course
    const courseAdapter = getFormatAdapter("course");
    const courseResponse = await storageApi.get<string>(
      storagePaths.course(courseId)
    );
    if (!courseResponse.ok) {
      throw new HTTPError({
        status: courseResponse.status,
        message:
          courseResponse.status === 404
            ? "Course not found"
            : courseResponse.statusText,
      });
    }
    const course = courseAdapter.deserialize(await courseResponse.text());

    // 2. Find Lesson and Context
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
      throw new HTTPError({
        status: 404,
        message: "Lesson not found in course",
      });
    }

    // 3. Generate Content
    const additionalInstructions = body?.additionalInstructions?.trim()
      ? `\nAdditional Instructions from user: ${body.additionalInstructions.trim()}`
      : "";

    const prompt = await getRenderedPrompt("lesson-generation", {
      courseTitle: course.title,
      topicTitle: targetTopic.title,
      topicDescription: targetTopic.description ?? "",
      lessonTitle: targetLesson.title,
      lessonDescription: targetLesson.description ?? "",
      additionalInstructions,
    });

    const result = await generateText({
      model: getOpenAIClient(model),
      prompt,
    });

    const content = result.text;

    // 4. Save Content (auto-creates parent directories)
    await storageApi.post(storagePaths.lesson(courseId, lessonId), content);

    return { success: true, content };
  } catch (error: unknown) {
    if (error instanceof HTTPError) {
      throw error;
    }

    console.error("Error generating lesson:", error);
    throw new HTTPError({
      status: 500,
      message: `Failed to generate lesson: ${toErrorMessage(error)}`,
    });
  }
});
