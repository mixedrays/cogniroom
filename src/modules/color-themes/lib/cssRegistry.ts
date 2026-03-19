import {
  Waves,
  Atom,
  Leaf,
  Sun,
  Flame,
  Zap,
  Trees,
  Snowflake,
  Sparkles,
  Palette,
} from "lucide-react";

import oneUrl from "../themes/one.css?url";
import oceanUrl from "../themes/ocean.css?url";
import mintUrl from "../themes/mint.css?url";
import solarizedUrl from "../themes/solarized.css?url";
import sunsetUrl from "../themes/sunset.css?url";
import cyberpunkUrl from "../themes/cyberpunk.css?url";
import forestUrl from "../themes/forest.css?url";
import nordUrl from "../themes/nord.css?url";
import auroraUrl from "../themes/aurora.css?url";

export interface CssTheme {
  id: string;
  label: string;
  cssClass: string;
  url?: string;
  icon?: React.ComponentType;
}

// Registry of extra CSS theme files.
// To add a new theme: drop a CSS file in themes/, import its ?url here, and add an entry.
// The "default" theme has no cssClass and no url — it uses the :root variables from styles.css.
// Each theme file contains both light and dark variants (.theme and .dark.theme selectors).
export const CSS_THEMES: CssTheme[] = [
  {
    id: "default",
    label: "Default",
    cssClass: "",
    icon: Palette,
  },
  {
    id: "one",
    label: "One",
    cssClass: "one",
    url: oneUrl,
    icon: Atom,
  },
  {
    id: "ocean",
    label: "Ocean",
    cssClass: "ocean",
    url: oceanUrl,
    icon: Waves,
  },
  {
    id: "mint",
    label: "Mint",
    cssClass: "mint",
    url: mintUrl,
    icon: Leaf,
  },
  {
    id: "solarized",
    label: "Solarized",
    cssClass: "solarized",
    url: solarizedUrl,
    icon: Sun,
  },
  {
    id: "sunset",
    label: "Sunset",
    cssClass: "sunset",
    url: sunsetUrl,
    icon: Flame,
  },
  {
    id: "cyberpunk",
    label: "Cyberpunk",
    cssClass: "cyberpunk",
    url: cyberpunkUrl,
    icon: Zap,
  },
  {
    id: "forest",
    label: "Forest",
    cssClass: "forest",
    url: forestUrl,
    icon: Trees,
  },
  {
    id: "nord",
    label: "Nord",
    cssClass: "nord",
    url: nordUrl,
    icon: Snowflake,
  },
  {
    id: "aurora",
    label: "Aurora",
    cssClass: "aurora",
    url: auroraUrl,
    icon: Sparkles,
  },
];
