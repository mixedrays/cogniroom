import { defineEventHandler, readBody, HTTPError } from "h3";
import { generateText } from "ai";
import { getLanguageModel, resolveModelId } from "@root/server/lib/llm";
import { getRenderedPrompt } from "@root/server/lib/promptService";
import { composeAdditionalInstructions } from "@root/server/lib/composeAdditionalInstructions";
import { buildLessonPromptVarsFromContext } from "@root/server/lib/lessonContext";
import { withErrorGuard } from "@root/server/lib/withErrorGuard";
import { lessonGenerationContextSchema } from "@modules/core";

/**
 * Stateless: generates lesson theory from the client-supplied context and
 * returns it without persisting. The client saves via the mode-dispatched
 * `saveLessonContent` (server filesystem or browser IndexedDB).
 */
export default defineEventHandler(
  withErrorGuard("Failed to generate lesson", async (event) => {
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
      "lesson-generation",
      buildLessonPromptVarsFromContext(parsedContext.data, additionalInstructions)
    );

    const result = await generateText({
      model: getLanguageModel(model),
      prompt,
    });

    return { success: true, content: result.text };
  })
);
