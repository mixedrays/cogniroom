/**
 * Browser-mode custom-prompt persistence over the local IndexedDB store.
 * Prompt *defaults* live in the (pure, browser-safe) server registry; only
 * user overrides are stored, at `prompts/<id>.txt`, mirroring the server's
 * `promptService`.
 */

import type { StorageApi } from "@/modules/storage/client";
import {
  PROMPT_REGISTRY,
  getPromptDefinition,
} from "@root/server/lib/promptRegistry";
import type { PromptInfo } from "./prompts";

function promptPath(id: string): string {
  return `prompts/${id}.txt`;
}

export async function getAllPromptsLocal(
  api: StorageApi
): Promise<PromptInfo[]> {
  return Promise.all(
    PROMPT_REGISTRY.map(async (def) => {
      const res = await api.get<string>(promptPath(def.id));
      const isCustomized = res.ok;
      const content = isCustomized ? await res.text() : def.defaultContent;
      return { ...def, content, isCustomized };
    })
  );
}

export async function savePromptLocal(
  api: StorageApi,
  id: string,
  content: string
): Promise<{ success: boolean; content?: string; error?: string }> {
  const def = getPromptDefinition(id);
  if (!def) return { success: false, error: `Unknown prompt: ${id}` };
  await api.put(promptPath(id), content);
  return { success: true, content };
}

export async function resetPromptLocal(
  api: StorageApi,
  id: string
): Promise<{ success: boolean; content?: string; error?: string }> {
  const def = getPromptDefinition(id);
  if (!def) return { success: false, error: `Unknown prompt: ${id}` };
  await api.delete(promptPath(id));
  return { success: true, content: def.defaultContent };
}
