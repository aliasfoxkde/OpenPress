import { useState, useEffect, useCallback } from "react";

export type ThemeMode = "auto" | "light" | "dark" | "liquid-glass";

const STORAGE_KEY = "theme-mode";
const LEGACY_KEY = "dark-mode";

const MODES: ThemeMode[] = ["auto", "light", "dark", "liquid-glass"];

function getStoredMode(): ThemeMode {
  // Migrate legacy key
  const legacy = localStorage.getItem(LEGACY_KEY);
  if (legacy !== null) {
    localStorage.removeItem(LEGACY_KEY);
    localStorage.setItem(STORAGE_KEY, legacy === "true" ? "dark" : "auto");
    return legacy === "true" ? "dark" : "auto";
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && MODES.includes(stored as ThemeMode)) {
    return stored as ThemeMode;
  }
  return "auto";
}

function applyMode(mode: ThemeMode, systemDark: boolean) {
  const root = document.documentElement;

  // Remove all theme classes first
  root.classList.remove("dark", "light", "liquid-glass");

  const effectiveDark =
    mode === "dark" || mode === "liquid-glass" || (mode === "auto" && systemDark);

  if (effectiveDark) {
    root.classList.add("dark");
  } else {
    root.classList.add("light");
  }

  if (mode === "liquid-glass") {
    root.classList.add("liquid-glass");
  }
}

export function useTheme() {
  const [mode, setModeState] = useState<ThemeMode>(getStoredMode);
  const [systemDark, setSystemDark] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  // Listen for system preference changes
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      setSystemDark(e.matches);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Apply mode whenever mode or systemDark changes
  useEffect(() => {
    applyMode(mode, systemDark);
  }, [mode, systemDark]);

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem(STORAGE_KEY, newMode);
  }, []);

  const cycleMode = useCallback(() => {
    const currentIdx = MODES.indexOf(mode);
    const nextIdx = (currentIdx + 1) % MODES.length;
    const next = MODES[nextIdx];
    setModeState(next);
    localStorage.setItem(STORAGE_KEY, next);
  }, [mode]);

  const isDark =
    mode === "dark" || mode === "liquid-glass" || (mode === "auto" && systemDark);

  return { mode, setMode, cycleMode, isDark };
}
