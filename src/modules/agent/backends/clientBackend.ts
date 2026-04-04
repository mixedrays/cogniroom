import { createOpenAI } from "@ai-sdk/openai";
import { APICallError } from "ai";
import type { AgentTool, ChatBackend } from "../types";
import { runAgentStream } from "../lib/runAgentStream";
import { serializeMessages } from "../hooks/useAgent";

export const OPENAI_API_KEY_STORAGE = "openai_api_key";

export function createClientBackend(
  tools: AgentTool[],
  getSystemPrompt: () => Promise<string>
): ChatBackend {
  const clientOnlyTools = tools.filter((t) => !t.server.execute);

  return async ({ messages, model, signal, onEvent }) => {
    const apiKey = localStorage.getItem(OPENAI_API_KEY_STORAGE) ?? "";
    if (!apiKey.trim()) {
      onEvent({
        type: "error",
        message: "OpenAI API key is not set. Please add it in Settings.",
      });
      return;
    }
    const openai = createOpenAI({ apiKey });
    const system = await getSystemPrompt();

    try {
      await runAgentStream({
        model: openai(model),
        system,
        messages: serializeMessages(messages),
        tools: clientOnlyTools,
        signal,
        onEvent,
      });
      onEvent({ type: "done" });
    } catch (e) {
      if ((e as Error).name === "AbortError") throw e;
      let message = (e as Error).message ?? "Something went wrong";
      if (APICallError.isInstance(e) && e.responseBody) {
        try {
          const body = JSON.parse(e.responseBody);
          const detail =
            body?.error?.message ?? body?.message ?? e.responseBody;
          message = `${e.statusCode ? `[${e.statusCode}] ` : ""}${detail}`;
        } catch {
          message = `${e.statusCode ? `[${e.statusCode}] ` : ""}${e.responseBody}`;
        }
      }
      onEvent({ type: "error", message });
    }
  };
}
