import { useMemo } from "react";
import { useSettings } from "@/modules/settings/context/SettingsContext";
import { createServerBackend } from "../backends/serverBackend";
import { createClientBackend } from "../backends/clientBackend";
import type { AgentTool, ChatBackend } from "../types";

export function useChatBackend(
  serverEndpoint: string,
  tools: AgentTool[],
  getSystemPrompt: () => Promise<string>
): ChatBackend {
  const { settings } = useSettings();
  const useOwnKey = settings.llm.useOwnKey ?? false;

  return useMemo(() => {
    if (useOwnKey) {
      return createClientBackend(tools, getSystemPrompt);
    }
    return createServerBackend(serverEndpoint);
  }, [useOwnKey, serverEndpoint, tools, getSystemPrompt]);
}
