export interface PromptInfo {
  id: string;
  label: string;
  description: string;
  category: string;
  variables: string[];
  defaultContent: string;
  content: string;
  isCustomized: boolean;
}

function getBaseUrl() {
  if (typeof window !== "undefined") return "";
  return "http://localhost:3000";
}

export async function getPrompts(): Promise<{
  success: boolean;
  prompts: PromptInfo[];
  error?: string;
}> {
  try {
    const response = await fetch(`${getBaseUrl()}/api/prompts`);
    if (!response.ok) {
      return { success: false, prompts: [], error: response.statusText };
    }
    return await response.json();
  } catch (e) {
    return { success: false, prompts: [], error: String(e) };
  }
}

export async function savePrompt(
  id: string,
  content: string
): Promise<{ success: boolean; content?: string; error?: string }> {
  try {
    const response = await fetch(`${getBaseUrl()}/api/prompts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    return await response.json();
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function resetPrompt(
  id: string
): Promise<{ success: boolean; content?: string; error?: string }> {
  try {
    const response = await fetch(`${getBaseUrl()}/api/prompts/${id}`, {
      method: "DELETE",
    });
    return await response.json();
  } catch (e) {
    return { success: false, error: String(e) };
  }
}
