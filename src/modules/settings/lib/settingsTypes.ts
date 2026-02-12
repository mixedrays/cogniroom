// Settings Types for Theme Configuration System

// Available color themes compatible with ShadCN UI
export const COLOR_THEMES = {
  neutral: "Neutral",
  slate: "Slate",
  zinc: "Zinc",
  stone: "Stone",
  red: "Red",
  orange: "Orange",
  amber: "Amber",
  yellow: "Yellow",
  lime: "Lime",
  green: "Green",
  emerald: "Emerald",
  teal: "Teal",
  cyan: "Cyan",
  sky: "Sky",
  blue: "Blue",
  indigo: "Indigo",
  violet: "Violet",
  purple: "Purple",
  fuchsia: "Fuchsia",
  pink: "Pink",
  rose: "Rose",
} as const;

export type ColorTheme = keyof typeof COLOR_THEMES;

export type ThemeMode = "light" | "dark" | "system";

// Appearance settings
export interface AppearanceSettings {
  colorTheme: ColorTheme;
  mode: ThemeMode;
  radius: number; // 0 to 1 (rem units)
}

// LLM Model settings
export interface LLMSettings {
  defaultModel: string;
}

// Complete settings object
export interface Settings {
  appearance: AppearanceSettings;
  llm: LLMSettings;
  savedAt: string; // ISO timestamp
  version: number; // Settings schema version
}

// Settings history entry
export interface SettingsHistoryEntry {
  id: string;
  settings: Settings;
  savedAt: string; // ISO timestamp
  description?: string;
}

// Settings history
export interface SettingsHistory {
  entries: SettingsHistoryEntry[];
  maxEntries: number;
}

// Default settings
export const DEFAULT_SETTINGS: Settings = {
  appearance: {
    colorTheme: "neutral",
    mode: "light",
    radius: 0.625, // Default radius in rem
  },
  llm: {
    defaultModel: "gpt-4.1-mini",
  },
  savedAt: new Date().toISOString(),
  version: 1,
};

// Validation helpers
export function isValidColorTheme(theme: string): theme is ColorTheme {
  return theme in COLOR_THEMES;
}

export function isValidThemeMode(mode: string): mode is ThemeMode {
  return mode === "light" || mode === "dark" || mode === "system";
}

export function validateSettings(settings: unknown): settings is Settings {
  if (typeof settings !== "object" || settings === null) {
    return false;
  }

  const s = settings as Record<string, unknown>;

  // Check appearance
  if (typeof s.appearance !== "object" || s.appearance === null) {
    return false;
  }
  const appearance = s.appearance as Record<string, unknown>;
  if (
    typeof appearance.colorTheme !== "string" ||
    !isValidColorTheme(appearance.colorTheme)
  ) {
    return false;
  }
  if (
    typeof appearance.mode !== "string" ||
    !isValidThemeMode(appearance.mode)
  ) {
    return false;
  }
  if (typeof appearance.radius !== "number") {
    return false;
  }

  // Check llm
  if (typeof s.llm !== "object" || s.llm === null) {
    return false;
  }
  const llm = s.llm as Record<string, unknown>;
  if (typeof llm.defaultModel !== "string") {
    return false;
  }

  // Check metadata
  if (typeof s.savedAt !== "string") {
    return false;
  }
  if (typeof s.version !== "number") {
    return false;
  }

  return true;
}
