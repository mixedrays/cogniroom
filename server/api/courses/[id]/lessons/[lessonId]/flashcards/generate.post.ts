import { randomUUID } from "node:crypto";
import { defineEventHandler, readBody, createError, getRouterParam } from "h3";
import { generateText, Output } from "ai";
import { z } from "zod";
import {
  getOpenAIClient,
  type AvailableModelsId,
  DEFAULT_MODEL,
} from "@root/server/lib/llm";
import { getRenderedPrompt } from "@root/server/lib/promptService";
import { storage, storageApi } from "@root/modules/storage";

const FlashcardsDraftSchema = z.object({
  flashcards: z.array(
    z.object({
      question: z.string(),
      answer: z.string(),
      hint: z.string().nullable(),
      difficulty: z.enum(["easy", "medium", "hard"]),
    })
  ),
});

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

    const courseResponse = await storage<any>(
      `courses/${courseId}/course.json`
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

    let lessonContent = "";
    if (body?.includeContent !== false) {
      const lessonResponse = await storageApi.get<string>(
        `courses/${courseId}/lessons/${lessonId}/lesson.md`
      );
      if (lessonResponse.ok) {
        const text = await lessonResponse.text();
        if (text?.trim()) {
          lessonContent = `\n\nLesson Theory Content:\n---\n${text.trim()}\n---`;
        }
      }
    }

    const prompt = await getRenderedPrompt("flashcards-generation", {
      courseTitle: course.title,
      topicTitle: targetTopic.title,
      topicDescription: targetTopic.description,
      lessonTitle: targetLesson.title,
      lessonDescription: targetLesson.description,
      lessonContent,
      additionalInstructions,
    });

    const result = await generateText({
      model: getOpenAIClient(model),
      prompt,
      output: Output.object({
        schema: FlashcardsDraftSchema,
        name: "flashcards",
        description: "Flashcards for a lesson.",
      }),
    });

    const draft = result.output as z.infer<typeof FlashcardsDraftSchema>;

    const content = {
      version: 2,
      flashcards: draft.flashcards.map((card) => ({
        id: randomUUID(),
        question: card.question,
        answer: card.answer,
        hint: card.hint ?? undefined,
        difficulty: card.difficulty,
      })),
    };

    await storageApi.post(
      `courses/${courseId}/lessons/${lessonId}/flashcards.json`,
      content
    );

    return { success: true, content };
  } catch (error: any) {
    if (error.statusCode) {
      throw error;
    }
    console.error("Error generating flashcards:", error);
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to generate flashcards: ${error.message}`,
    });
  }
});
