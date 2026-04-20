/**
 * Compose the `{{additionalInstructions}}` block fed into generation prompts.
 * Combines client-supplied generation options (structured per-type tuning) with
 * the user's free-form instructions, so prompt templates only need a single hook.
 */
export function composeAdditionalInstructions(
  generationOptions?: string,
  userInstructions?: string
): string {
  const parts: string[] = [];

  const trimmedOptions = generationOptions?.trim();
  if (trimmedOptions) {
    parts.push(trimmedOptions);
  }

  const trimmedUser = userInstructions?.trim();
  if (trimmedUser) {
    parts.push(`Additional Instructions from user: ${trimmedUser}`);
  }

  if (parts.length === 0) return "";
  return `\n${parts.join("\n\n")}`;
}
