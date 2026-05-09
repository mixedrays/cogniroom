import { createAgentHandler } from "@root/server/lib/createAgentHandler";
import { askUserV2Tool } from "@/modules/agent/tools/ask-user-v2";
import { memoryTool } from "@/modules/agent/tools/memory";
import {
  getPresentToolForContentType,
  type PresentContentType,
} from "@/modules/agent/tools/present/registry";
import { getRenderedPrompt } from "@root/server/lib/promptService";

const VALID_CONTENT_TYPES: PresentContentType[] = [
  "roadmap",
  "lesson",
  "quiz",
  "flashcards",
  "exercise",
];

function resolveContentType(value: unknown): PresentContentType {
  return VALID_CONTENT_TYPES.includes(value as PresentContentType)
    ? (value as PresentContentType)
    : "lesson";
}

export default createAgentHandler({
  tools: (context) => {
    const contentType = resolveContentType(context.contentType);
    return [
      askUserV2Tool,
      memoryTool,
      getPresentToolForContentType(contentType),
    ];
  },
  getSystemPrompt: async (fullContext) => {
    const { contextPrompt: rawContextPrompt, ...restContext } =
      fullContext as Record<string, unknown>;
    const contextPromptStr = String(rawContextPrompt ?? "");
    return getRenderedPrompt("wizard-agent-chat", {
      contentType: String(restContext?.contentType ?? "lesson"),
      context: JSON.stringify(restContext),
      contextPrompt: contextPromptStr
        ? `\nADDITIONAL CONTEXT:\n${contextPromptStr}`
        : "",
    });
  },
});
