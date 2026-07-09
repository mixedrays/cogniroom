import { randomUUID } from "node:crypto";
import { defineEventHandler, readBody } from "h3";
import { generateText, Output } from "ai";
import { z } from "zod";
import { getLanguageModel, resolveModelId } from "@root/server/lib/llm";
import { getRenderedPrompt } from "@root/server/lib/promptService";
import { composeAdditionalInstructions } from "@root/server/lib/composeAdditionalInstructions";
import { withErrorGuard } from "@root/server/lib/withErrorGuard";
import type { QuizContent } from "@modules/core";

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
 * Stateless: returns generated quiz questions without creating a deck. The
 * client persists the deck via the mode-dispatched `createDeck`.
 */
export default defineEventHandler(
  withErrorGuard("Failed to generate quiz deck", async (event) => {
    const body = await readBody<{
      additionalInstructions?: string;
      model?: string;
      generationOptions?: string;
    }>(event);
    const model = resolveModelId(body?.model);

    const additionalInstructions = await composeAdditionalInstructions(
      body?.generationOptions,
      body?.additionalInstructions
    );

    const prompt = await getRenderedPrompt("deck-quiz-generation", {
      additionalInstructions,
    });

    const result = await generateText({
      model: getLanguageModel(model),
      prompt,
      output: Output.object({
        schema: QuizDraftSchema,
        name: "quiz",
        description: "Quiz questions for a standalone study deck.",
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

    const content: QuizContent = {
      version: 2,
      quizQuestions: quizQuestions as QuizContent["quizQuestions"],
    };

    return { success: true, content };
  })
);
