import { useLocation, useNavigate } from "@tanstack/react-router";

const VALID_TABS = [
  "appearance",
  "llm",
  "api-key",
  "prompts",
  "memory",
  "history",
] as const;

type SettingsTab = (typeof VALID_TABS)[number];

function parseSettingsParam(value: string | null): {
  tab: SettingsTab | undefined;
  section: string | undefined;
} {
  if (!value) return { tab: undefined, section: undefined };

  const [rawTab, rawSection] = value.split("/");
  if (VALID_TABS.includes(rawTab as SettingsTab)) {
    return { tab: rawTab as SettingsTab, section: rawSection || undefined };
  }

  return { tab: "appearance", section: undefined };
}

export function useSettingsSearch() {
  const location = useLocation();
  const navigate = useNavigate();

  const searchParams = new URLSearchParams(location.searchStr);
  const { tab, section } = parseSettingsParam(
    searchParams.has("settings") ? searchParams.get("settings") || "" : null
  );

  const isOpen = tab !== undefined;

  const open = (path?: string) => {
    const params = new URLSearchParams(location.searchStr);
    params.set("settings", path || "appearance");
    navigate({
      to: location.pathname,
      search: Object.fromEntries(params),
    } as never);
  };

  const close = () => {
    const params = new URLSearchParams(location.searchStr);
    params.delete("settings");
    navigate({
      to: location.pathname,
      search: Object.fromEntries(params),
    } as never);
  };

  return { isOpen, tab, section, open, close };
}
