import { NextUIProvider } from "@nextui-org/react";
import {
  Outlet,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { useEffect, useState } from "react";
import { Rule } from "../components/Broadsheet";

const TABS: { key: string; label: string; path: string }[] = [
  { key: "convert", label: "Convert", path: "/" },
  { key: "rates", label: "Rates", path: "/rates" },
  { key: "history", label: "History", path: "/history" },
];

function activeTab(pathname: string): string {
  const p = pathname.toLowerCase();
  if (p.startsWith("/rates")) return "rates";
  if (p.startsWith("/history")) return "history";
  return "convert";
}

function Root() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [theme, setTheme] = useState<"light" | "dark">(
    () => (localStorage.getItem("cl-theme") as "light" | "dark") || "light",
  );

  useEffect(() => {
    localStorage.setItem("cl-theme", theme);
    // Set on <html> so NextUI's body-portaled popovers inherit the edition.
    document.documentElement.setAttribute("data-theme", theme);
    document.body.style.background = theme === "dark" ? "#15110C" : "#F1EADC";
  }, [theme]);

  const current = activeTab(location.pathname);
  const date = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <NextUIProvider navigate={navigate}>
      <div className="bsheet" data-theme={theme}>
        <div className="bs-wrap">
          <header className="pt-[22px]">
            <Rule variant="heavy" />

            <div className="relative flex items-center justify-center px-0 pb-[9px] pt-[12px]">
              <h1 className="serif m-0 text-center font-normal leading-none text-ink [font-size:clamp(38px,9vw,58px)] [letter-spacing:1px]">
                Currency&nbsp;Link
              </h1>
              <button
                type="button"
                title="Toggle edition"
                aria-label="Toggle Morning / Evening edition"
                onClick={() =>
                  setTheme((t) => (t === "dark" ? "light" : "dark"))
                }
                className="bs-edition-toggle absolute right-0 top-1/2 -translate-y-1/2"
              >
                {theme === "dark" ? (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <circle cx="12" cy="12" r="4.2" />
                    <path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19" />
                  </svg>
                ) : (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 14.5A8 8 0 119.5 4a6.5 6.5 0 1010.5 10.5z" />
                  </svg>
                )}
                <span>{theme === "dark" ? "Evening" : "Morning"}</span>
              </button>
            </div>

            <Rule />

            <div className="flex items-center justify-between py-2">
              <span className="smallcap">Mid-Market Exchange</span>
              <span className="smallcap whitespace-nowrap !text-[10px] font-semibold !tracking-[1px] text-muted">
                {date}
              </span>
            </div>

            <Rule variant="hair" />

            <nav className="flex justify-center pt-[12px] [gap:clamp(20px,7vw,40px)]">
              {TABS.map(({ key, label, path }) => (
                <button
                  key={key}
                  type="button"
                  className="bs-tab"
                  data-on={current === key ? 1 : 0}
                  onClick={() =>
                    navigate({ pathname: path, search: `${searchParams}` })
                  }
                >
                  {label}
                </button>
              ))}
            </nav>

            <Rule variant="hair" />
          </header>

          <main key={current}>
            <Outlet />
          </main>

          <footer className="mt-10">
            <Rule variant="hair" className="mb-[10px]" />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="smallcap font-semibold !tracking-[1px] text-faint">
                Currency Link
              </span>
              <span className="smallcap font-semibold !tracking-[1px] text-faint">
                {theme === "dark" ? "Evening" : "Morning"} Edition
              </span>
            </div>
          </footer>
        </div>
      </div>
    </NextUIProvider>
  );
}

export default Root;
