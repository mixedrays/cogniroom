import { defineEventHandler, readBody, HTTPError, getRouterParam } from "h3";
import { generateText } from "ai";
import { getLanguageModel, resolveModelId } from "@root/server/lib/llm";
import { getRenderedPrompt } from "@root/server/lib/promptService";
import { storageApi } from "@modules/storage";
import { storagePaths } from "@root/server/lib/storagePaths";
import { composeAdditionalInstructions } from "@root/server/lib/composeAdditionalInstructions";
import {
  loadLessonContext,
  loadLessonTheoryBlock,
  buildLessonPromptVars,
} from "@root/server/lib/lessonContext";
import { withErrorGuard } from "@root/server/lib/withErrorGuard";

export default defineEventHandler(
  withErrorGuard("Failed to generate exercises", async (event) => {
    const courseId = getRouterParam(event, "id");
    const lessonId = getRouterParam(event, "lessonId");
    const body = await readBody<{
      additionalInstructions?: string;
      model?: string;
      includeContent?: boolean;
      generationOptions?: string;
    }>(event);
    const model = resolveModelId(body?.model);

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
      "exercises-generation",
      buildLessonPromptVars(ctx, additionalInstructions, lessonContent)
    );

    const result = await generateText({
      model: getLanguageModel(model),
      prompt,
    });

    const content = result.text;

    await storageApi.put(storagePaths.exercise(courseId, lessonId), content);

    return { success: true, content };
  })
);
