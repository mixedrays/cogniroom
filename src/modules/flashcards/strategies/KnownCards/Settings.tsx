import { Settings2 as IconSettings } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip.adapter";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { useKnownCardsContext } from "./context";

export function Settings() {
  const {
    trackProgress,
    autoScroll,
    hideKnownCards,
    toggleTrackProgress,
    toggleAutoScroll,
    toggleHideKnownCards,
  } = useKnownCardsContext();

  return (
    <DropdownMenu modal={false}>
      <Tooltip content="Settings">
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" />}>
          <IconSettings />
        </DropdownMenuTrigger>
      </Tooltip>

      <DropdownMenuContent className="min-w-fit">
        <DropdownMenuGroup>
          <DropdownMenuItem
            className="gap-2"
            onClick={(e) => {
              e.preventDefault();
              toggleTrackProgress(!trackProgress);
            }}
          >
            <Switch checked={trackProgress} />
            Track progress
          </DropdownMenuItem>

          <DropdownMenuItem
            className="gap-2"
            disabled={!trackProgress}
            onClick={(e) => {
              e.preventDefault();
              toggleAutoScroll(!autoScroll);
            }}
          >
            <Switch checked={autoScroll} />
            Auto scroll
          </DropdownMenuItem>

          <DropdownMenuItem
            className="gap-2"
            disabled={!trackProgress}
            onClick={(e) => {
              e.preventDefault();
              toggleHideKnownCards(!hideKnownCards);
            }}
          >
            <Switch checked={hideKnownCards} />
            Hide known cards
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
