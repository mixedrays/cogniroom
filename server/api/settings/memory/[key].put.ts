import { defineEventHandler, getRouterParam, readBody, HTTPError } from "h3";
import { writeMemory } from "@root/server/lib/memoryService";
import { toErrorMessage } from "@root/server/lib/errors";
import { assertServerStorageEnabled } from "@root/server/lib/assertServerStorageEnabled";

export default defineEventHandler(async (event) => {
  try {
    assertServerStorageEnabled();
    const key = getRouterParam(event, "key");
    if (!key) return { success: false, error: "Missing key" };

    const body = await readBody<{ content?: string }>(event);
    const content = typeof body?.content === "string" ? body.content : "";

    await writeMemory(key, content);
    return { success: true };
  } catch (error: unknown) {
    if (error instanceof HTTPError) throw error;
    console.error("Error updating memory entry:", error);
    return { success: false, error: toErrorMessage(error) };
  }
});
