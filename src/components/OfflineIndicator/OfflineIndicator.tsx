import { useEffect, useRef } from "react";
import { WifiOff } from "lucide-react";
import { toast } from "sonner";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function OfflineIndicator() {
  const online = useOnlineStatus();
  const previousOnline = useRef<boolean | null>(null);

  useEffect(() => {
    if (previousOnline.current === null) {
      previousOnline.current = online;
      return;
    }
    if (previousOnline.current === online) return;
    previousOnline.current = online;

    if (online) {
      toast.success("Back online");
    } else {
      toast.warning("You are offline", {
        description: "Cached content is still available.",
      });
    }
  }, [online]);

  if (online) return null;

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span
            aria-label="Offline"
            className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground"
          >
            <WifiOff className="size-4" />
          </span>
        }
      />
      <TooltipContent>You are offline</TooltipContent>
    </Tooltip>
  );
}
