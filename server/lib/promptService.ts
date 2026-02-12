import { storageApi } from "@root/modules/storage";
import { getPromptDefinition, PROMPT_REGISTRY } from "./promptRegistry";
import { renderPromptTemplate } from "./promptTemplate";

function promptPath(id: string): string {
  return `prompts/${id}.txt`;
}

/** Load a prompt's content — custom override or default. */
export async function loadPrompt(id: string): Promise<string> {
  const def = getPromptDefinition(id);
  if (!def) throw new Error(`Unknown prompt id: ${id}`);

  const response = await storageApi.get<string>(promptPath(id));
  if (response.ok) {
    const text = await response.text();
    return text;
  }

  return def.defaultContent;
}

/** Save a custom override for a prompt. */
export async function savePrompt(id: string, content: string): Promise<void> {
  const def = getPromptDefinition(id);
  if (!def) throw new Error(`Unknown prompt id: ${id}`);

  await storageApi.post(promptPath(id), content);
}

/** Delete the override file, reverting to the default content. */
export async function resetPrompt(id: string): Promise<string> {
  const def = getPromptDefinition(id);
  if (!def) throw new Error(`Unknown prompt id: ${id}`);

  await storageApi.delete(promptPath(id));
  return def.defaultContent;
}

/** Load a prompt and render its template variables. */
export async function getRenderedPrompt(
  id: string,
  variables: Record<string, string>
): Promise<string> {
  const content = await loadPrompt(id);
  return renderPromptTemplate(content, variables);
}

/** Check whether a prompt has a custom override file. */
export async function isPromptCustomized(id: string): Promise<boolean> {
  return storageApi.exists(promptPath(id));
}

/** Return metadata + content for every registered prompt. */
export async function getAllPrompts() {
  return Promise.all(
    PROMPT_REGISTRY.map(async (def) => {
      const customized = await isPromptCustomized(def.id);
      const content = await loadPrompt(def.id);
      return { ...def, content, isCustomized: customized };
    })
  );
}
