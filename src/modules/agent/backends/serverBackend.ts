import type { AgentSseEvent, ChatBackend } from "../types";
import { serializeMessages } from "../hooks/useAgent";

export function createServerBackend(endpoint: string): ChatBackend {
  return async ({ messages, model, context, signal, onEvent }) => {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: serializeMessages(messages),
        model,
        context,
      }),
      signal,
    });

    if (!response.ok || !response.body) {
      const err = await response.json().catch(() => ({}));
      throw new Error(
        (err as Record<string, string>)?.message ??
          (err as Record<string, string>)?.statusMessage ??
          `Request failed (${response.status})`
      );
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split("\n\n");
      buffer = events.pop() ?? "";

      for (const eventStr of events) {
        const dataLine = eventStr
          .split("\n")
          .find((l) => l.startsWith("data: "));
        if (!dataLine) continue;
        onEvent(JSON.parse(dataLine.slice(6)) as AgentSseEvent);
      }
    }
  };
}
