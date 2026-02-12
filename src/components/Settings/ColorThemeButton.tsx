import { CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ColorTheme } from "@/lib/settingsTypes";

interface ColorThemeButtonProps {
  colorKey: ColorTheme;
  label: string;
  isSelected: boolean;
  onSelect: () => void;
}

const colorMap: Record<ColorTheme, string> = {
  neutral: "#525252",
  slate: "#475569",
  zinc: "#52525b",
  stone: "#57534e",
  red: "#ef4444",
  orange: "#f97316",
  amber: "#f59e0b",
  yellow: "#eab308",
  lime: "#84cc16",
  green: "#22c55e",
  emerald: "#10b981",
  teal: "#14b8a6",
  cyan: "#06b6d4",
  sky: "#0ea5e9",
  blue: "#3b82f6",
  indigo: "#6366f1",
  violet: "#8b5cf6",
  purple: "#a855f7",
  fuchsia: "#d946ef",
  pink: "#ec4899",
  rose: "#f43f5e",
};

export function ColorThemeButton({
  colorKey,
  label,
  isSelected,
  onSelect,
}: ColorThemeButtonProps) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "group relative flex flex-col items-center gap-1.5 rounded-lg transition-colors",
        isSelected
          ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
          : "hover:bg-accent/50"
      )}
    >
      <div
        className="w-full aspect-square rounded-md shadow-sm ring-1 ring-black/10"
        style={{ backgroundColor: colorMap[colorKey] }}
      >
        {isSelected && (
          <div className="flex size-full items-center justify-center">
            <CheckIcon className="size-4 text-white drop-shadow-md" />
          </div>
        )}
      </div>
      <span className="text-xs leading-tight font-medium truncate w-full text-center text-muted-foreground">
        {label}
      </span>
    </button>
  );
}
