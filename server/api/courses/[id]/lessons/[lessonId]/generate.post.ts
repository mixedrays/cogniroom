import { defineEventHandler, readBody, HTTPError, getRouterParam } from "h3";
import { generateText } from "ai";
import {
  getLanguageModel,
  type AvailableModelsId,
  DEFAULT_MODEL,
} from "@root/server/lib/llm";
import { getRenderedPrompt } from "@root/server/lib/promptService";
import { storageApi } from "@modules/storage";
import { storagePaths } from "@root/server/lib/storagePaths";
import { composeAdditionalInstructions } from "@root/server/lib/composeAdditionalInstructions";
import {
  loadLessonContext,
  buildLessonPromptVars,
} from "@root/server/lib/lessonContext";
import { withErrorGuard } from "@root/server/lib/withErrorGuard";

export default defineEventHandler(
  withErrorGuard("Failed to generate lesson", async (event) => {
    const courseId = getRouterParam(event, "id");
    const lessonId = getRouterParam(event, "lessonId");
    const body = await readBody<{
      additionalInstructions?: string;
      model?: string;
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

    const prompt = await getRenderedPrompt(
      "lesson-generation",
      buildLessonPromptVars(ctx, additionalInstructions)
    );

    const result = await generateText({
      model: getLanguageModel(model),
      prompt,
    });

    const content = result.text;

    await storageApi.post(storagePaths.lesson(courseId, lessonId), content);

    return { success: true, content };
  })
);
