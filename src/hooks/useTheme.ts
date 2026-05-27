import { useState, useEffect } from "react";

export type Theme = "light" | "system" | "dark";

const STORAGE_KEY = "theme";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const shouldBeDark = theme === "dark" || (theme === "system" && prefersDark);
  root.classList.toggle("dark", shouldBeDark);
  // Force native browser primitives (inputs, scrollbars, etc.) to match the
  // selected theme instead of always following the OS preference.
  root.style.colorScheme = theme === "light" ? "light" : theme === "dark" ? "dark" : "light dark";
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return (stored as Theme) || "system";
  });

  // Apply theme class whenever theme changes
  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  // When theme === "system", react to OS-level changes in real time
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme("system");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  return { theme, setTheme: setThemeState };
}
