import { DEFAULT_SETTINGS } from "@/modules/settings/lib/settingsTypes";

// Blocking script to prevent theme flash — runs before React hydrates.
// Reads cached settings from localStorage and applies dark mode, CSS theme class, and radius.
// On first load (no cache), falls back to the app's default appearance so the initial
// paint already matches the theme React will apply after hydration.
export const themeInitScript = `(function(){try{var d=${JSON.stringify(
  DEFAULT_SETTINGS.appearance
)};var s=JSON.parse(localStorage.getItem('settings-cache')||'null');var a=(s&&s.appearance)||d;var isDark=a.mode==='dark'||(a.mode==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(isDark)document.documentElement.classList.add('dark');if(a.cssThemeId)document.documentElement.classList.add(a.cssThemeId);if(typeof a.radius==='number')document.documentElement.style.setProperty('--radius',a.radius+'rem');}catch(e){}})();`;

export const ThemeInitScriptElement = () => (
  <script
    key="theme-init"
    dangerouslySetInnerHTML={{ __html: themeInitScript }}
  />
);
