import { defineEventHandler, readBody, createError } from "h3";
import { generateText } from "ai";
import { getOpenAIClient, DEFAULT_MODEL } from "@root/server/lib/llm";
import { getRenderedPrompt } from "@root/server/lib/promptService";

type ApiMessage = { role: "user" | "assistant"; content: string };

export default defineEventHandler(async (event) => {
  const body = await readBody<{
    messages: ApiMessage[];
    context?: Record<string, unknown>;
  }>(event);

  if (!Array.isArray(body?.messages)) {
    throw createError({ statusCode: 400, statusMessage: "Missing messages" });
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
      model: getOpenAIClient(DEFAULT_MODEL),
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
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[wizard/chat] error:", msg);
    throw createError({ statusCode: 500, statusMessage: msg.slice(0, 300) });
  }
});
