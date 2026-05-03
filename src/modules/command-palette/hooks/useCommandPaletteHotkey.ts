import { useEffect } from "react";
import { useCommandPalette } from "../context/CommandPaletteContext";

export function useCommandPaletteHotkey() {
  const { toggle } = useCommandPalette();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggle]);
}
