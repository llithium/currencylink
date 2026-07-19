import { useTheme } from "../hooks/useTheme";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const next = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={`Use ${next} theme`}
      title={`Use ${next} theme`}
    >
      {theme === "dark" ? (
        <svg width="17" height="17" viewBox="0 0 20 20" aria-hidden="true">
          <circle cx="10" cy="10" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M10 1.8v2M10 16.2v2M1.8 10h2M16.2 10h2M4.2 4.2l1.4 1.4M14.4 14.4l1.4 1.4M15.8 4.2l-1.4 1.4M5.6 14.4l-1.4 1.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ) : (
        <svg width="17" height="17" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M16.8 12.7A7 7 0 0 1 7.3 3.2 7.1 7.1 0 1 0 16.8 12.7Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}
