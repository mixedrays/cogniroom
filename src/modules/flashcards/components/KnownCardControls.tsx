import {
  ThumbsUp as IconKnow,
  ThumbsDown as IconDontKnow,
  LoaderCircle as IconLoader,
  Check as IconFinish,
} from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip.adapter";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useFlashcardsContext } from "./Flashcards";

interface KnownCardControlsProps {
  isFinishing?: boolean;
  isRecordingSession?: boolean;
  finishShortcutLabel?: string;
}

const KnownCardControls = ({
  isFinishing = false,
  isRecordingSession = false,
  finishShortcutLabel,
}: KnownCardControlsProps) => {
  const {
    trackProgress,
    canFinishStudy,
    onFinish,
    toggleKnownCardWithAutoScroll,
    slidesApi,
    currentCardId,
    getIsCardKnownStatus,
    finishStudy,
  } = useFlashcardsContext();

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
            variant={slidesApi.isLastSlide ? "default" : "secondary"}
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
};

export default KnownCardControls;
