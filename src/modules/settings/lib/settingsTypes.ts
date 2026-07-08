// Settings Types for Theme Configuration System

export type ThemeMode = "light" | "dark" | "system";

// Appearance settings
export interface AppearanceSettings {
  cssThemeId: string | null;
  mode: ThemeMode;
  radius: number; // 0 to 1 (rem units)
}

// LLM Model settings
export interface LLMSettings {
  defaultModel: string;
  useOwnKey?: boolean;
  hiddenModels?: string[];
}

// Sidebar UI settings
export interface SidebarSettings {
  collapsedSections: Record<string, boolean>;
}

// Complete settings object
export interface Settings {
  appearance: AppearanceSettings;
  llm: LLMSettings;
  sidebar: SidebarSettings;
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
    cssThemeId: "one",
    mode: "light",
    radius: 0.625, // Default radius in rem
  },
  llm: {
    defaultModel: "gpt-4.1-mini",
  },
  sidebar: {
    collapsedSections: {},
  },
  savedAt: new Date().toISOString(),
  version: 1,
};

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
    appearance.cssThemeId !== null &&
    typeof appearance.cssThemeId !== "string"
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

  // Check sidebar (optional for backwards compatibility)
  if (s.sidebar !== undefined) {
    if (typeof s.sidebar !== "object" || s.sidebar === null) {
      return false;
    }
    const sidebar = s.sidebar as Record<string, unknown>;
    if (
      typeof sidebar.collapsedSections !== "object" ||
      sidebar.collapsedSections === null
    ) {
      return false;
    }
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
