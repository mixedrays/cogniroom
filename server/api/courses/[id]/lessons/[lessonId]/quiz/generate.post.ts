import { randomUUID } from "node:crypto";
import { defineEventHandler, readBody, HTTPError, getRouterParam } from "h3";
import { generateText, Output } from "ai";
import { z } from "zod";
import {
  getLanguageModel,
  type AvailableModelsId,
  DEFAULT_MODEL,
} from "@root/server/lib/llm";
import { getRenderedPrompt } from "@root/server/lib/promptService";
import { storageApi } from "@modules/storage";
import { getFormatAdapter } from "@modules/content-formats";
import { storagePaths } from "@root/server/lib/storagePaths";
import { composeAdditionalInstructions } from "@root/server/lib/composeAdditionalInstructions";
import {
  loadLessonContext,
  loadLessonTheoryBlock,
  buildLessonPromptVars,
} from "@root/server/lib/lessonContext";
import { withErrorGuard } from "@root/server/lib/withErrorGuard";
import type { QuizContent } from "@modules/core";

// Flat schema required because OpenAI structured outputs do not support oneOf/discriminatedUnion.
// Fields that belong only to one type are nullable; type is reconstructed after parsing.
const QuizDraftSchema = z.object({
  quizQuestions: z.array(
    z.object({
      type: z.enum(["choice", "true-false"]),
      question: z.string(),
      options: z
        .array(z.object({ text: z.string(), isCorrect: z.boolean() }))
        .nullable(),
      answer: z.boolean().nullable(),
      explanation: z.string().nullable(),
      difficulty: z.enum(["easy", "medium", "hard"]),
    })
  ),
});

export default defineEventHandler(
  withErrorGuard("Failed to generate quiz", async (event) => {
    const courseId = getRouterParam(event, "id");
    const lessonId = getRouterParam(event, "lessonId");
    const body = await readBody<{
      additionalInstructions?: string;
      model?: string;
      includeContent?: boolean;
      generationOptions?: string;
    }>(event);
    const model = (body?.model ?? DEFAULT_MODEL).trim() as AvailableModelsId;

    if (!courseId || !lessonId) {
      throw new HTTPError({
        status: 400,
        message: "Missing courseId or lessonId",
      });
    }

    const ctx = await loadLessonContext(courseId, lessonId);

    const additionalInstructions = await composeAdditionalInstructions(
      body?.generationOptions,
      body?.additionalInstructions
    );

    const lessonContent = await loadLessonTheoryBlock(
      courseId,
      lessonId,
      body?.includeContent !== false
    );

    const prompt = await getRenderedPrompt(
      "quiz-generation",
      buildLessonPromptVars(ctx, additionalInstructions, lessonContent)
    );

    const result = await generateText({
      model: getLanguageModel(model),
      prompt,
      output: Output.object({
        schema: QuizDraftSchema,
        name: "quiz",
        description: "Multiple-choice quiz questions for a lesson.",
      }),
    });

    const draft = result.output as z.infer<typeof QuizDraftSchema>;

    const quizQuestions = draft.quizQuestions
      .map((q) => {
        const base = {
          id: randomUUID(),
          question: q.question,
          difficulty: q.difficulty,
          ...(q.explanation ? { explanation: q.explanation } : {}),
        };
        if (
          q.type === "choice" &&
          Array.isArray(q.options) &&
          q.options.length > 0
        ) {
          return { ...base, type: "choice" as const, options: q.options };
        }
        if (q.type === "true-false" && q.answer !== null) {
          return { ...base, type: "true-false" as const, answer: q.answer };
        }
        return null;
      })
      .filter(Boolean);

    const content = {
      version: 2 as const,
      quizQuestions: quizQuestions as QuizContent["quizQuestions"],
    };

    const quizAdapter = getFormatAdapter("quiz");
    await storageApi.post(
      storagePaths.quiz(courseId, lessonId),
      quizAdapter.serialize(content)
    );

    return { success: true, content };
  })
);
