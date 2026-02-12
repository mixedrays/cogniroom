import {
  createContext,
  useContext,
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
  type ReactNode,
} from "react";
import type {
  Settings,
  AppearanceSettings,
  LLMSettings,
  ThemeMode,
} from "../lib/settingsTypes";
import { DEFAULT_SETTINGS } from "../lib/settingsTypes";
import { getSettings, saveSettings as apiSaveSettings } from "../lib/settings";
import {
  applyThemeColors,
  applyRadius,
  applyDarkMode,
  getSystemPreference,
} from "../lib/themeColors";

const SETTINGS_CACHE_KEY = "settings-cache";

// Read cached settings from localStorage synchronously to prevent flicker
function getCachedSettings(): Settings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const cached = localStorage.getItem(SETTINGS_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      // Validate structure has required fields
      if (parsed.appearance && parsed.llm) {
        return parsed;
      }
    }
  } catch {
    // Invalid cache, use defaults
  }
  return DEFAULT_SETTINGS;
}

// Cache settings to localStorage
function cacheSettings(settings: Settings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(settings));
  } catch {
    // Storage full or unavailable, ignore
  }
}

interface SettingsContextType {
  settings: Settings;
  isLoading: boolean;
  error: string | null;

  // Update functions
  updateAppearance: (updates: Partial<AppearanceSettings>) => Promise<void>;
  updateLLM: (updates: Partial<LLMSettings>) => Promise<void>;
  saveSettings: (
    description?: string,
    addToHistory?: boolean
  ) => Promise<boolean>;
  loadSettings: () => Promise<void>;
  applySettings: (settings: Settings) => void;

  // Computed values
  resolvedMode: "light" | "dark";
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}

interface SettingsProviderProps {
  children: ReactNode;
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  // Always initialize with DEFAULT_SETTINGS for hydration consistency
  // The blocking script in <head> handles visual theme before React hydrates
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolvedMode, setResolvedMode] = useState<"light" | "dark">("light");

  // Resolve the actual mode based on setting and system preference
  const resolveMode = useCallback(
    (mode: ThemeMode): "light" | "dark" => {
      if (mode === "system") {
        return getSystemPreference();
      }
      return mode;
    },
    []
  );

  // Apply settings to the document
  const applySettings = useCallback(
    (settingsToApply: Settings) => {
      const actualMode = resolveMode(settingsToApply.appearance.mode);
      setResolvedMode(actualMode);

      // Apply dark mode class first
      applyDarkMode(actualMode === "dark");

      // Apply color theme
      applyThemeColors(settingsToApply.appearance.colorTheme, actualMode);

      // Apply radius
      applyRadius(settingsToApply.appearance.radius);
    },
    [resolveMode]
  );

  // Load settings from server (validates/updates cached settings)
  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getSettings();
      if (result.success && result.settings) {
        setSettings(result.settings);
        applySettings(result.settings);
        cacheSettings(result.settings);
      } else {
        setSettings(DEFAULT_SETTINGS);
        applySettings(DEFAULT_SETTINGS);
        cacheSettings(DEFAULT_SETTINGS);
      }
    } catch (e) {
      setError(String(e));
      // Keep cached settings on error, don't reset to defaults
    } finally {
      setIsLoading(false);
    }
  }, [applySettings]);

  // Apply cached settings immediately on mount (before paint)
  // This syncs React state with what the blocking script already applied
  useLayoutEffect(() => {
    const cached = getCachedSettings();
    setSettings(cached);
    applySettings(cached);
  }, [applySettings]);

  // Fetch latest settings from server in background
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Listen for system color scheme changes
  useEffect(() => {
    if (settings.appearance.mode !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      applySettings(settings);
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [settings, applySettings]);

  // Update appearance settings
  const updateAppearance = useCallback(
    async (updates: Partial<AppearanceSettings>) => {
      const newSettings: Settings = {
        ...settings,
        appearance: {
          ...settings.appearance,
          ...updates,
        },
        savedAt: new Date().toISOString(),
      };

      setSettings(newSettings);
      applySettings(newSettings);
      cacheSettings(newSettings);

      // Save to server
      const result = await apiSaveSettings(newSettings, {
        addToHistory: true,
      });

      if (!result.success) {
        setError(result.error || "Failed to save settings");
      }
    },
    [settings, applySettings]
  );

  // Update LLM settings
  const updateLLM = useCallback(
    async (updates: Partial<LLMSettings>) => {
      const newSettings: Settings = {
        ...settings,
        llm: {
          ...settings.llm,
          ...updates,
        },
        savedAt: new Date().toISOString(),
      };

      setSettings(newSettings);
      cacheSettings(newSettings);

      // Save to server
      const result = await apiSaveSettings(newSettings, {
        addToHistory: true,
      });

      if (!result.success) {
        setError(result.error || "Failed to save settings");
      }
    },
    [settings]
  );

  // Save current settings with optional description
  const saveSettingsToServer = useCallback(
    async (description?: string, addToHistory = true): Promise<boolean> => {
      const result = await apiSaveSettings(settings, {
        description,
        addToHistory,
      });

      if (!result.success) {
        setError(result.error || "Failed to save settings");
        return false;
      }

      return true;
    },
    [settings]
  );

  const value: SettingsContextType = {
    settings,
    isLoading,
    error,
    updateAppearance,
    updateLLM,
    saveSettings: saveSettingsToServer,
    loadSettings,
    applySettings,
    resolvedMode,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}
