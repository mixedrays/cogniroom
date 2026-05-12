import { useCallback } from "react";
import { useSettings } from "../context/SettingsContext";

export function useSidebarSectionState(sectionId: string): {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
} {
  const { settings, updateSidebar } = useSettings();
  const collapsed = settings.sidebar?.collapsedSections?.[sectionId] ?? false;
  const open = !collapsed;

  const setOpen = useCallback(
    (next: boolean) => {
      const current = settings.sidebar?.collapsedSections ?? {};
      const nextCollapsed = !next;
      if ((current[sectionId] ?? false) === nextCollapsed) return;
      updateSidebar({
        collapsedSections: {
          ...current,
          [sectionId]: nextCollapsed,
        },
      });
    },
    [settings.sidebar?.collapsedSections, sectionId, updateSidebar]
  );

  const toggle = useCallback(() => setOpen(!open), [open, setOpen]);

  return { open, setOpen, toggle };
}
