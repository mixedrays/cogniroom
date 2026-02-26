export function applyCssTheme(
  cssThemeId: string | null,
  cssThemes: { id: string; cssClass: string }[]
): void {
  const root = document.documentElement;
  for (const theme of cssThemes) {
    if (theme.cssClass) root.classList.remove(theme.cssClass);
  }
  if (cssThemeId) {
    const theme = cssThemes.find((t) => t.id === cssThemeId);
    if (theme?.cssClass) root.classList.add(theme.cssClass);
  }
}

export function applyRadius(radius: number): void {
  document.documentElement.style.setProperty("--radius", `${radius}rem`);
}

export function applyDarkMode(isDark: boolean): void {
  if (isDark) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

export function getSystemPreference(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}
