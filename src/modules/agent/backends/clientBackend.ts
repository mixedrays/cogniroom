import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { APICallError } from "ai";
import type { AgentTool, ChatBackend } from "../types";
import { runAgentStream } from "../lib/runAgentStream";
import { serializeMessages } from "../hooks/useAgent";
import { providers, getProviderForModel } from "@/lib/llm-models";

export const OPENAI_API_KEY_STORAGE = "openai_api_key";
export const ANTHROPIC_API_KEY_STORAGE = "anthropic_api_key";

function getClientModel(model: string) {
  const provider = getProviderForModel(model, providers);
  const providerId = provider?.id ?? "openai";

  if (providerId === "anthropic") {
    const apiKey = localStorage.getItem(ANTHROPIC_API_KEY_STORAGE) ?? "";
    if (!apiKey.trim()) {
      throw new Error(
        "Anthropic API key is not set. Please add it in [settings:api-key]."
      );
    }
    const anthropic = createAnthropic({ apiKey });
    return anthropic(model);
  }

  const apiKey = localStorage.getItem(OPENAI_API_KEY_STORAGE) ?? "";
  if (!apiKey.trim()) {
    throw new Error("OpenAI API key is not set. Please add it in [settings:api-key].");
  }
  const openai = createOpenAI({ apiKey });
  return openai(model);
}

export function createClientBackend(
  tools: AgentTool[],
  getSystemPrompt: () => Promise<string>
): ChatBackend {
  const clientOnlyTools = tools.filter((t) => !t.server.execute);

  return async ({ messages, model, signal, onEvent }) => {
    let languageModel;
    try {
      languageModel = getClientModel(model);
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
