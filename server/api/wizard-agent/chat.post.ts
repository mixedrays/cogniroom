import { createAgentHandler } from "@root/server/lib/createAgentHandler";
import { askUserTool } from "@/modules/agent/tools/ask-user";
import { memoryToolServer } from "@/modules/agent/tools/memory/server";
import {
  getPresentToolForContentType,
  type PresentContentType,
} from "@/modules/wizard-agent/tools/present/registry";
import { getRenderedPrompt } from "@root/server/lib/promptService";
import { STORAGE_MODE } from "@root/server/env";

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
    // In browser mode the server filesystem is read-only, so the memory write
    // tool is omitted; memory reads still reach the model via the client-
    // supplied `memoryContext` in the system prompt.
    return [
      askUserTool,
      ...(STORAGE_MODE === "browser" ? [] : [memoryToolServer]),
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
