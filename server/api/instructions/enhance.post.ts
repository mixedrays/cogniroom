import { defineEventHandler, readBody, createError } from "h3";
import { generateText } from "ai";
import {
  getOpenAIClient,
  type AvailableModelsId,
  DEFAULT_MODEL,
} from "@root/server/lib/llm";
import {
  validateInstructionForEnhancement,
  getContentTypeGuidelines,
  type InstructionEnhancementContext,
} from "@root/server/lib/instructionEnhancementPrompt";
import { getRenderedPrompt } from "@root/server/lib/promptService";

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
        throw createError({
          statusCode: 400,
          statusMessage: "Missing required field: userInstruction",
        });
      }

      if (!body?.contentType) {
        throw createError({
          statusCode: 400,
          statusMessage: "Missing required field: contentType",
        });
      }

      // Validate content type
      const validContentTypes = ["lesson", "exercise", "test", "course"];
      if (!validContentTypes.includes(body.contentType)) {
        throw createError({
          statusCode: 400,
          statusMessage: `Invalid contentType. Must be one of: ${validContentTypes.join(", ")}`,
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
      const model = (body?.model ?? DEFAULT_MODEL).trim() as AvailableModelsId;

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
        model: getOpenAIClient(model),
        prompt,
      });

      return {
        success: true,
        enhancedInstruction: result.text.trim(),
      };
    } catch (error: any) {
      console.error("Error enhancing instruction:", error);

      // If it's already an HTTP error, re-throw it
      if (error.statusCode) {
        throw error;
      }

      // Handle other errors
      throw createError({
        statusCode: 500,
        statusMessage: `Failed to enhance instruction: ${error.message}`,
      });
    }
  }
);
