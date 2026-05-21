import { defineEventHandler, readBody, HTTPError } from "h3";
import { generateText } from "ai";
import { getLanguageModel, DEFAULT_MODEL } from "@root/server/lib/llm";
import { getRenderedPrompt } from "@root/server/lib/promptService";
import { toErrorMessage } from "@root/server/lib/errors";

type ApiMessage = { role: "user" | "assistant"; content: string };

export default defineEventHandler(async (event) => {
  const body = await readBody<{
    messages: ApiMessage[];
    context?: Record<string, unknown>;
  }>(event);

  if (!Array.isArray(body?.messages)) {
    throw new HTTPError({ status: 400, message: "Missing messages" });
  }

  const context = JSON.stringify(body.context ?? {});
  const contentTypes = "lesson, flashcards, quiz, exercise, roadmap";
  const system = await getRenderedPrompt("wizard-chat", {
    context,
    contentTypes,
  });

  const messages: ApiMessage[] =
    body.messages.length > 0
      ? body.messages
      : [
          {
            role: "user",
            content: "Hello, please greet me and ask your first question.",
          },
        ];

  try {
    const result = await generateText({
      model: getLanguageModel(DEFAULT_MODEL),
      system,
      messages,
    });

    const text = result.text.trim();
    const cleaned = text
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    let message: unknown;
    try {
      message = JSON.parse(cleaned);
    } catch {
      const match = cleaned.match(/\{[\s\S]*\}/);
      message = match ? JSON.parse(match[0]) : { type: "text", value: text };
    }

    return { success: true, message };
  } catch (error: unknown) {
    const msg = toErrorMessage(error);
    console.error("[wizard/chat] error:", msg);
    throw new HTTPError({ status: 500, message: msg.slice(0, 300) });
  }
});
