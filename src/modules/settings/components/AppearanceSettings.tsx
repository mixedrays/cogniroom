import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SunIcon, MoonIcon, MonitorIcon } from "lucide-react";
import { useSettings } from "../context/SettingsContext";
import {
  COLOR_THEMES,
  type ColorTheme,
  type ThemeMode,
} from "../lib/settingsTypes";
import { ColorThemeButton } from "./ColorThemeButton";

const THEME_MODES: {
  value: ThemeMode;
  label: string;
  icon: React.ElementType;
}[] = [
  { value: "light", label: "Light", icon: SunIcon },
  { value: "dark", label: "Dark", icon: MoonIcon },
  { value: "system", label: "System", icon: MonitorIcon },
];

const RADIUS_OPTIONS = [
  { value: "0", label: "None" },
  { value: "0.3", label: "Small" },
  { value: "0.5", label: "Medium" },
  { value: "0.625", label: "Default" },
  { value: "0.75", label: "Large" },
  { value: "1", label: "XL" },
];

export function AppearanceSettings() {
  const { settings, updateAppearance, resolvedMode } = useSettings();

  return (
    <div className="divide-y divide-border">
      {/* Theme Mode */}
      <div className="py-4 first:pt-0">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Theme</p>
            {settings.appearance.mode === "system" && (
              <p className="text-sm text-muted-foreground mt-0.5">
                Currently using {resolvedMode}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 rounded-lg border p-1">
            {THEME_MODES.map(({ value, label, icon: Icon }) => (
              <Button
                key={value}
                variant={
                  settings.appearance.mode === value ? "secondary" : "ghost"
                }
                className="h-8 gap-1.5 px-3"
                onClick={() => updateAppearance({ mode: value })}
              >
                <Icon />
                {label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Color Theme */}
      <div className="py-4">
        <p className="font-medium mb-3">Color theme</p>
        <div className="grid grid-cols-5 gap-2">
          {Object.entries(COLOR_THEMES).map(([key, label]) => (
            <ColorThemeButton
              key={key}
              colorKey={key as ColorTheme}
              label={label}
              isSelected={settings.appearance.colorTheme === key}
              onSelect={() =>
                updateAppearance({ colorTheme: key as ColorTheme })
              }
            />
          ))}
        </div>
      </div>

      {/* Border Radius */}
      <div className="py-4">
        <div className="flex items-center justify-between">
          <p className="font-medium">Border radius</p>
          <Select
            value={settings.appearance.radius.toString()}
            onValueChange={(v) =>
              v && updateAppearance({ radius: parseFloat(v) })
            }
          >
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RADIUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label} ({opt.value}rem)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
