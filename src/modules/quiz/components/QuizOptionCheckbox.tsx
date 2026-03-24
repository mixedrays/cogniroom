import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Kbd } from "@/components/ui/kbd";
import { InlineMarkdown } from "@/modules/markdown";

interface QuizOptionProps {
  option: { text: string; isCorrect: boolean };
  isSelected: boolean;
  isChecked: boolean;
  onClick: () => void;
  shortcutKey?: number;
}

export function QuizOptionCheckbox({
  option,
  isSelected,
  isChecked,
  onClick,
  shortcutKey,
}: QuizOptionProps) {
  const showCorrect = isChecked && option.isCorrect && isSelected;
  const showIncorrect = isChecked && option.isCorrect !== isSelected;
  const showNeutral = !isChecked && !isSelected;
  const showSelected = !isChecked && isSelected;
  const showChecked = isChecked && isSelected;

  return (
    <button
      type="button"
      onClick={isChecked ? undefined : onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg border p-3 text-left text-sm transition-colors",
        showNeutral &&
          "border-border hover:border-primary/50 hover:bg-accent cursor-pointer",
        "border-border hover:border-primary/50 hover:bg-accent cursor-pointer",
        showSelected && "border-primary bg-primary/10 cursor-pointer",
        isChecked && "cursor-default",
        showCorrect && "border-green-500 bg-green-500/10",
        showIncorrect && "border-red-500 bg-red-500/10"
      )}
    >
      <div
        className={cn(
          "flex size-5 shrink-0 items-center justify-center border rounded-sm",
          showNeutral && "border-muted-foreground/40",
          showSelected && "border-primary bg-primary",
          showCorrect && "border-green-500 bg-green-500",
          showIncorrect && "border-red-500"
        )}
      >
        {showSelected && <Check className="size-3 text-primary-foreground" />}
        {showChecked && <Check className="size-3 text-white" />}
      </div>

      <InlineMarkdown
        content={option.text}
        className={cn(
          "flex-1",
          showCorrect && "text-green-700 dark:text-green-400",
          showIncorrect && "text-red-700 dark:text-red-400"
        )}
      />

      {shortcutKey !== undefined && (
        <Kbd className="ml-auto shrink-0">{shortcutKey}</Kbd>
      )}
    </button>
  );
}
