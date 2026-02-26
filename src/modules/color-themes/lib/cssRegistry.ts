import { Waves, Atom } from "lucide-react";

import oneLightUrl from "../themes/onelight.css?url";
import oceanUrl from "../themes/ocean.css?url";

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
export const CSS_THEMES: CssTheme[] = [
  {
    id: "default",
    label: "Default",
    cssClass: "",
  },
  {
    id: "onelight",
    label: "One Light",
    cssClass: "onelight",
    url: oneLightUrl,
    icon: Atom,
  },
  {
    id: "ocean",
    label: "Ocean",
    cssClass: "ocean",
    url: oceanUrl,
    icon: Waves,
  },
];
