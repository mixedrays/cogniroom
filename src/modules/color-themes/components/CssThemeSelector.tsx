import { cn } from "@/lib/utils";
import { CSS_THEMES } from "../lib/cssRegistry";

interface CssThemeSelectorProps {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

export function CssThemeSelector({
  selectedId,
  onSelect,
}: CssThemeSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {CSS_THEMES.map((cssTheme) => {
        const isSelected = selectedId === cssTheme.id;
        return (
          <div
            onClick={() => onSelect(cssTheme.id)}
            className={cn(
              "border-base-content/20 hover:border-base-content/40 overflow-hidden min-w-40",
              "rounded-md border-2 outline-2 outline-offset-2 outline-transparent",
              `${cssTheme.id}`,
              isSelected && "border-primary"
            )}
          >
            <div className="bg-base-100 text-base-content w-full cursor-pointer font-sans">
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
                    <div className="bg-primary flex aspect-square w-5 items-center justify-center rounded lg:w-6">
                      <div className="text-primary-foreground text-sm font-bold">
                        A
                      </div>
                    </div>
                    <div className="bg-secondary flex aspect-square w-5 items-center justify-center rounded lg:w-6">
                      <div className="text-secondary-foreground text-sm font-bold">
                        A
                      </div>
                    </div>
                    <div className="bg-accent flex aspect-square w-5 items-center justify-center rounded lg:w-6">
                      <div className="text-accent-foreground text-sm font-bold">
                        A
                      </div>
                    </div>
                    <div className="bg-muted flex aspect-square w-5 items-center justify-center rounded lg:w-6">
                      <div className="text-muted-foreground text-sm font-bold">
                        A
                      </div>
                    </div>
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
