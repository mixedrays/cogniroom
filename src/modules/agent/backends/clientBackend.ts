import { createOpenAI } from "@ai-sdk/openai";
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
      onEvent({
        type: "error",
        message: (e as Error).message ?? "Something went wrong",
      });
    }
  };
}
