/**
 * Renders a prompt template by replacing {{varName}} placeholders with values.
 * Unrecognized placeholders are left as-is.
 */
export function renderPromptTemplate(
  template: string,
  variables: Record<string, string>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return key in variables ? variables[key] : match;
  });
}
