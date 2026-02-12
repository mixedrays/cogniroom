import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuizOptionProps {
  option: string;
  isSelected: boolean;
  isChecked: boolean;
  isCorrectOption: boolean;
  onClick: () => void;
}

export function QuizOption({
  option,
  isSelected,
  isChecked,
  isCorrectOption,
  onClick,
}: QuizOptionProps) {
  const showCorrect = isChecked && isCorrectOption;
  const showIncorrect = isChecked && isSelected && !isCorrectOption;

  return (
    <button
      type="button"
      onClick={isChecked ? undefined : onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-colors",
        !isChecked && !isSelected && "border-border hover:border-primary/50 hover:bg-accent cursor-pointer",
        !isChecked && isSelected && "border-primary bg-primary/10 cursor-pointer",
        isChecked && "cursor-default",
        showCorrect && "border-green-500 bg-green-500/10",
        showIncorrect && "border-red-500 bg-red-500/10",
        isChecked && !showCorrect && !showIncorrect && "border-border opacity-60"
      )}
    >
      <div
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
          !isChecked && !isSelected && "border-muted-foreground/40",
          !isChecked && isSelected && "border-primary bg-primary",
          showCorrect && "border-green-500 bg-green-500",
          showIncorrect && "border-red-500 bg-red-500",
          isChecked && !showCorrect && !showIncorrect && "border-muted-foreground/30"
        )}
      >
        {!isChecked && isSelected && (
          <div className="h-2 w-2 rounded-full bg-primary-foreground" />
        )}
        {showCorrect && <Check className="h-3 w-3 text-white" />}
        {showIncorrect && <X className="h-3 w-3 text-white" />}
      </div>
      <span className={cn(
        showCorrect && "text-green-700 dark:text-green-400",
        showIncorrect && "text-red-700 dark:text-red-400"
      )}>
        {option}
      </span>
    </button>
  );
}
