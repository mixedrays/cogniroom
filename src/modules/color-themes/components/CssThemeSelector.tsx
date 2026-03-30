import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { CSS_THEMES } from "../lib/cssRegistry";

const COLOR_SWATCHES = [
  { bg: "bg-primary", fg: "text-primary-foreground", label: "Primary" },
  { bg: "bg-secondary", fg: "text-secondary-foreground", label: "Secondary" },
  { bg: "bg-accent", fg: "text-accent-foreground", label: "Accent" },
  { bg: "bg-muted", fg: "text-muted-foreground", label: "Muted" },
];

interface CssThemeSelectorProps {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  isDark?: boolean;
}

export function CssThemeSelector({
  selectedId,
  onSelect,
  isDark,
}: CssThemeSelectorProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {CSS_THEMES.map((cssTheme) => {
        const isSelected = selectedId === cssTheme.id;
        return (
          <div
            key={cssTheme.id}
            onClick={() => onSelect(cssTheme.id)}
            className={cn(
              "border-base-content/20 hover:border-base-content/40 overflow-hidden",
              "rounded-md border-2 outline-2 outline-offset-2 outline-transparent",
              cssTheme.id,
              isDark && "dark",
              isSelected && "border-primary"
            )}
          >
            <div className="text-base-content w-full cursor-pointer font-sans">
              <div className="flex">
                <div className="bg-sidebar w-6 border-r" />

                <div className="bg-background grow flex flex-col gap-2 p-2">
                  <div className="capitalize text-foreground flex gap-1 items-center whitespace-nowrap">
                    {cssTheme.icon && (
                      // @ts-expect-error - icon is optional and can be a string, but we know it's a component here
                      <cssTheme.icon className="size-4 text-primary" />
                    )}
                    {cssTheme.label}
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {COLOR_SWATCHES.map(({ bg, fg, label }) => (
                      <Tooltip key={label}>
                        <TooltipTrigger>
                          <div
                            className={cn(
                              bg,
                              "flex aspect-square w-5 items-center justify-center rounded lg:w-6"
                            )}
                          >
                            <div className={cn(fg, "text-sm font-bold")}>A</div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>{label}</TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
