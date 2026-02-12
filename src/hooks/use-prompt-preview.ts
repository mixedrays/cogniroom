import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPrompts, type PromptInfo } from "@/lib/prompts";
import { renderPromptTemplate } from "@/lib/promptTemplate";

const promptsQueryOptions = {
  queryKey: ["prompts"] as const,
  queryFn: async () => {
    const result = await getPrompts();
    return result.success ? result.prompts : [];
  },
  staleTime: 5 * 60 * 1000,
};

export function usePromptPreview(
  promptId: string,
  variables: Record<string, string>
) {
  const { data: prompts, isLoading } = useQuery(promptsQueryOptions);

  const renderedPrompt = useMemo(() => {
    if (!prompts) return null;
    const prompt = prompts.find((p: PromptInfo) => p.id === promptId);
    if (!prompt) return null;
    return renderPromptTemplate(prompt.content, variables);
  }, [prompts, promptId, variables]);

  return { renderedPrompt, isLoading };
}
