import { useEffect, useState } from "react";

export type OS = "mac" | "windows" | "linux" | "other";

export function useOS() {
  // Use "other" as default to avoid hydration mismatch with "mac" specific content
  // Ideally this would be determined on server if possible, but UAParser is usually client side or via headers.
  // For client-side only hook:
  const [os, setOs] = useState<OS>("other");

  useEffect(() => {
    const { userAgent } = window.navigator;
    const ua = userAgent.toLowerCase();
    if (ua.includes("mac")) setOs("mac");
    else if (ua.includes("win")) setOs("windows");
    else if (ua.includes("linux")) setOs("linux");
  }, []);

  return {
    os,
    isMac: os === "mac",
    isWindows: os === "windows",
    isLinux: os === "linux",
  };
}
