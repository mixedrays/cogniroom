import { Search } from "lucide-react";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { useCommandPalette } from "../context/CommandPaletteContext";

function isMacPlatform() {
  if (typeof navigator === "undefined") return false;
  return /Mac|iPhone|iPad|iPod/i.test(navigator.platform);
}

export function CommandPaletteTrigger() {
  const { open } = useCommandPalette();
  const mac = isMacPlatform();

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <SidebarMenuButton onClick={open}>
            <Search />
            <span>Search…</span>
          </SidebarMenuButton>
        }
      />
      <TooltipContent side="right">
        <span>Open command palette</span>
        <KbdGroup>
          <Kbd>{mac ? "⌘" : "Ctrl"} + K</Kbd>
        </KbdGroup>
      </TooltipContent>
    </Tooltip>
  );
}
