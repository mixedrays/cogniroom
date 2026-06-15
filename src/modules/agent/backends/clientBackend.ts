import { APICallError } from "ai";
import type { AgentTool, ChatBackend } from "../types";
import { runAgentStream } from "../lib/runAgentStream";
import { serializeMessages } from "../lib/messagesReducer";
import { getBrowserLanguageModel } from "@/lib/llm-models/browserClient";
import { getProviderLocalStorageKeyName } from "@/lib/llm-models";

export const OPENAI_API_KEY_STORAGE = getProviderLocalStorageKeyName("openai");
export const ANTHROPIC_API_KEY_STORAGE =
  getProviderLocalStorageKeyName("anthropic");

export function createClientBackend(
  tools: AgentTool[],
  getSystemPrompt: () => Promise<string>
): ChatBackend {
  const clientOnlyTools = tools.filter((t) => !t.server.execute);

  return async ({ messages, model, signal, onEvent }) => {
    let languageModel;
    try {
      languageModel = getBrowserLanguageModel(model);
    } catch (e) {
      onEvent({ type: "error", message: (e as Error).message });
      return;
    }

    const system = await getSystemPrompt();

    try {
      await runAgentStream({
        model: languageModel,
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
