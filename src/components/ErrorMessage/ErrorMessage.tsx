import { useSettingsSearch } from "@/modules/settings";

const SETTINGS_LINK_RE = /\[settings:([^\]]+)\]/g;

export function ErrorMessage({ message }: { message: string }) {
  const { open } = useSettingsSearch();

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  for (const match of message.matchAll(SETTINGS_LINK_RE)) {
    const before = message.slice(lastIndex, match.index);
    if (before) parts.push(before);

    const path = match[1];
    parts.push(
      <button
        key={match.index}
        type="button"
        className="underline underline-offset-2 font-medium hover:opacity-80 cursor-pointer"
        onClick={() => open(path)}
      >
        Settings
      </button>
    );
    lastIndex = match.index + match[0].length;
  }

  const remaining = message.slice(lastIndex);
  if (remaining) parts.push(remaining);

  if (parts.length === 0) return <>{message}</>;
  return <>{parts}</>;
}
