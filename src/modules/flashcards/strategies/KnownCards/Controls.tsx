import {
  ThumbsUp as IconKnow,
  ThumbsDown as IconDontKnow,
  LoaderCircle as IconLoader,
  Check as IconFinish,
} from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip.adapter";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useKnownCardsContext } from "./context";

interface ControlsProps {
  isLastSlide: boolean;
  isFinishing?: boolean;
  isRecordingSession?: boolean;
  finishShortcutLabel?: string;
}

export function Controls({
  isLastSlide,
  isFinishing = false,
  isRecordingSession = false,
  finishShortcutLabel,
}: ControlsProps) {
  const {
    trackProgress,
    canFinishStudy,
    onFinish,
    toggleKnownCardWithAutoScroll,
    currentCardId,
    getIsCardKnownStatus,
    finishStudy,
  } = useKnownCardsContext();

  if (!trackProgress) return null;

  const showFinish = Boolean(onFinish);
  const isCardKnown = getIsCardKnownStatus(currentCardId) === true;
  const isCardUnknown = getIsCardKnownStatus(currentCardId) === false;

  return (
    <>
      <Tooltip
        content={
          <>
            I don&apos;t know this card{" "}
            <span className="text-muted-foreground text-xs">(Arrow Left)</span>
          </>
        }
      >
        <Button
          variant={isCardUnknown ? "default" : "ghost"}
          size="icon-lg"
          className="mr-auto"
          onClick={() => toggleKnownCardWithAutoScroll(false)}
        >
          <IconDontKnow className={cn(!isCardUnknown && "text-red-500")} />
        </Button>
      </Tooltip>

      {showFinish && (
        <Tooltip
          content={
            <>
              Finish session{" "}
              {finishShortcutLabel && (
                <span className="text-muted-foreground text-xs">
                  ({finishShortcutLabel})
                </span>
              )}
            </>
          }
        >
          <Button
            size="lg"
            variant={isLastSlide ? "default" : "secondary"}
            className="m-auto"
            onClick={finishStudy}
            disabled={isFinishing || isRecordingSession || !canFinishStudy}
          >
            {isFinishing || isRecordingSession ? (
              <IconLoader size={16} className="animate-spin" />
            ) : (
              <IconFinish />
            )}
            Finish
          </Button>
        </Tooltip>
      )}

      <Tooltip
        content={
          <>
            I know this card{" "}
            <span className="text-muted-foreground text-xs">(Arrow Right)</span>
          </>
        }
      >
        <Button
          variant={isCardKnown ? "default" : "ghost"}
          size="icon-lg"
          className="ml-auto"
          onClick={() => toggleKnownCardWithAutoScroll(true)}
        >
          <IconKnow className={cn(!isCardKnown && "text-green-500")} />
        </Button>
      </Tooltip>
    </>
  );
}
