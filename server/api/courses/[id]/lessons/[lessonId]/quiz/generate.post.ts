import { randomUUID } from "node:crypto";
import { defineEventHandler, readBody, HTTPError } from "h3";
import { generateText, Output } from "ai";
import { z } from "zod";
import { getLanguageModel, resolveModelId } from "@root/server/lib/llm";
import { getRenderedPrompt } from "@root/server/lib/promptService";
import { composeAdditionalInstructions } from "@root/server/lib/composeAdditionalInstructions";
import { buildLessonPromptVarsFromContext } from "@root/server/lib/lessonContext";
import { withErrorGuard } from "@root/server/lib/withErrorGuard";
import { lessonGenerationContextSchema } from "@modules/core";
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

/**
 * Stateless: returns generated quiz questions without persisting. The client
 * saves via the mode-dispatched `saveLessonQuiz`.
 */
export default defineEventHandler(
  withErrorGuard("Failed to generate quiz", async (event) => {
    const body = await readBody<{
      context?: unknown;
      additionalInstructions?: string;
      model?: string;
      generationOptions?: string;
    }>(event);

    const parsedContext = lessonGenerationContextSchema.safeParse(body?.context);
    if (!parsedContext.success) {
      throw new HTTPError({
        status: 400,
        message: `Invalid lesson context: ${parsedContext.error.issues[0]?.message ?? "validation failed"}`,
      });
    }

    const model = resolveModelId(body?.model);

    const additionalInstructions = await composeAdditionalInstructions(
      body?.generationOptions,
      body?.additionalInstructions
    );

    const prompt = await getRenderedPrompt(
      "quiz-generation",
      buildLessonPromptVarsFromContext(parsedContext.data, additionalInstructions)
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

    return { success: true, content };
  })
);
