import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ThemeMode = "light" | "dark";

interface ThemeContextValue {
  theme: ThemeMode;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);
const THEME_KEY = "currencylink-theme";

function systemTheme(): ThemeMode {
  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

function initialTheme(): ThemeMode {
  const current = document.documentElement.dataset.theme;
  return current === "light" || current === "dark" ? current : systemTheme();
}

function applyTheme(theme: ThemeMode) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", theme === "dark" ? "#0c0a09" : "#f7f4ef");
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeMode>(initialTheme);

  useEffect(() => applyTheme(theme), [theme]);

  useEffect(() => {
    if (localStorage.getItem(THEME_KEY)) return;
    const media = window.matchMedia("(prefers-color-scheme: light)");
    const listener = () => setTheme(media.matches ? "light" : "dark");
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);

  const value = useMemo(
    () => ({
      theme,
      toggleTheme: () => {
        setTheme((current) => {
          const next = current === "dark" ? "light" : "dark";
          localStorage.setItem(THEME_KEY, next);
          return next;
        });
      },
    }),
    [theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useTheme must be used inside ThemeProvider");
  return value;
}
