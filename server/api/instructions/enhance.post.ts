import { defineEventHandler, readBody, HTTPError } from "h3";
import { generateText } from "ai";
import { getLanguageModel, resolveModelId } from "@root/server/lib/llm";
import {
  validateInstructionForEnhancement,
  getContentTypeGuidelines,
  type InstructionEnhancementContext,
} from "@root/server/lib/instructionEnhancementPrompt";
import { getRenderedPrompt } from "@root/server/lib/promptService";
import { toErrorMessage } from "@root/server/lib/errors";

interface EnhanceInstructionRequest extends InstructionEnhancementContext {
  model?: string;
}

interface EnhanceInstructionResponse {
  success: boolean;
  enhancedInstruction?: string;
  error?: string;
}

export default defineEventHandler(
  async (event): Promise<EnhanceInstructionResponse> => {
    try {
      const body = await readBody<EnhanceInstructionRequest>(event);

      // Validate required fields
      if (!body?.userInstruction) {
        throw new HTTPError({
          status: 400,
          message: "Missing required field: userInstruction",
        });
      }

      if (!body?.contentType) {
        throw new HTTPError({
          status: 400,
          message: "Missing required field: contentType",
        });
      }

      // Validate content type
      const validContentTypes = ["lesson", "exercise", "test", "course"];
      if (!validContentTypes.includes(body.contentType)) {
        throw new HTTPError({
          status: 400,
          message: `Invalid contentType. Must be one of: ${validContentTypes.join(", ")}`,
        });
      }

      // Validate instruction content
      const validationError = validateInstructionForEnhancement(
        body.userInstruction
      );
      if (validationError) {
        return {
          success: false,
          error: validationError,
        };
      }

      // Get model from request or use default
      const model = resolveModelId(body?.model);

      // Build the enhancement prompt
      const prompt = await getRenderedPrompt("instruction-enhancement", {
        contentType: body.contentType,
        courseTitle: body.courseTitle ?? "",
        topicTitle: body.topicTitle ?? "",
        lessonTitle: body.lessonTitle ?? "",
        skillLevel: body.skillLevel ?? "",
        contentTypeGuidelines: getContentTypeGuidelines(body.contentType),
        userInstruction: body.userInstruction,
      });

      // Call LLM to enhance the instruction
      const result = await generateText({
        model: getLanguageModel(model),
        prompt,
      });

      return {
        success: true,
        enhancedInstruction: result.text.trim(),
      };
    } catch (error: unknown) {
      console.error("Error enhancing instruction:", error);

      if (error instanceof HTTPError) {
        throw error;
      }

      throw new HTTPError({
        status: 500,
        message: `Failed to enhance instruction: ${toErrorMessage(error)}`,
      });
    }
  }
);
