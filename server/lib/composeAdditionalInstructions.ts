import { getMemoryContext } from "./memoryService";

/**
 * Compose the `{{additionalInstructions}}` block fed into generation prompts.
 * Combines client-supplied generation options (structured per-type tuning),
 * the user's free-form instructions, and any persisted user memory, so prompt
 * templates only need a single hook.
 */
export async function composeAdditionalInstructions(
  generationOptions?: string,
  userInstructions?: string
): Promise<string> {
  const parts: string[] = [];

  const trimmedOptions = generationOptions?.trim();
  if (trimmedOptions) {
    parts.push(trimmedOptions);
  }

  const trimmedUser = userInstructions?.trim();
  if (trimmedUser) {
    parts.push(`Additional Instructions from user: ${trimmedUser}`);
  }

  const memoryContext = (await getMemoryContext()).trim();
  if (memoryContext) {
    parts.push(memoryContext);
  }

  if (parts.length === 0) return "";
  return `\n${parts.join("\n\n")}`;
}
