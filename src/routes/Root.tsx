import { NextUIProvider } from "@nextui-org/react";
import {
  Outlet,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { Chg } from "../components/Signal";
import { apiURL, isoDaysAgo } from "./ConversionPage";
import { fmtRate } from "../utils/format";

const TABS: { key: string; label: string; path: string }[] = [
  { key: "convert", label: "Convert", path: "/" },
  { key: "rates", label: "Rates", path: "/rates" },
  { key: "history", label: "History", path: "/history" },
];

const TICKER = ["EUR", "GBP", "JPY", "CHF", "AUD", "CAD", "CNY"];

function activeTab(pathname: string): string {
  const p = pathname.toLowerCase();
  if (p.startsWith("/rates")) return "rates";
  if (p.startsWith("/history")) return "history";
  return "convert";
}

interface TickerEntry {
  rate: number;
  change: number;
}

function Root() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [ticker, setTicker] = useState<Record<string, TickerEntry>>({});

  // Live USD-base ticker: latest rates + a 24h change derived from the two
  // most recent business days.
  useEffect(() => {
    async function loadTicker() {
      try {
        const to = TICKER.join(",");
        const history = await axios.get(
          `${apiURL}/${isoDaysAgo(7)}..?from=USD&to=${to}`,
        );
        const byDate = history.data.rates as {
          [date: string]: { [code: string]: number };
        };
        const dates = Object.keys(byDate).sort((a, b) => a.localeCompare(b));
        if (dates.length === 0) return;
        const latest = byDate[dates[dates.length - 1]];
        const next: Record<string, TickerEntry> = {};
        for (const code of TICKER) {
          const series = dates
            .map((d) => byDate[d]?.[code])
            .filter((v): v is number => typeof v === "number");
          const last = series[series.length - 1] ?? latest[code];
          const prev = series.length >= 2 ? series[series.length - 2] : last;
          next[code] = {
            rate: latest[code] ?? last,
            change: prev ? ((last - prev) / prev) * 100 : 0,
          };
        }
        setTicker(next);
      } catch (error) {
        console.log(error);
      }
    }
    loadTicker();
  }, []);

  const current = activeTab(location.pathname);

  return (
    <NextUIProvider navigate={navigate}>
      <div className="signal">
        <div className="signal-glow" />
        <div className="signal-wrap">
          <header>
            <div className="flex items-center gap-[10px] pb-[12px] pt-[20px]">
              <span className="signal-diamond" />
              <span className="text-[16.5px] font-bold leading-none tracking-[-0.2px] text-text">
                Currency Link
              </span>
              <span className="micro ml-auto !text-accent">
                Live · Mid-Market
              </span>
            </div>

            <div className="signal-ticker">
              {TICKER.map((code) => {
                const t = ticker[code];
                return (
                  <span
                    key={code}
                    className="mono inline-flex items-baseline gap-[7px] text-[11px] text-mid"
                  >
                    <span className="font-semibold text-text">{code}</span>
                    {t ? fmtRate(t.rate) : "—"}
                    {t && <Chg value={t.change} size={10.5} />}
                  </span>
                );
              })}
            </div>

            <nav className="flex gap-2 py-[16px]">
              {TABS.map(({ key, label, path }) => (
                <button
                  key={key}
                  type="button"
                  className="signal-tab"
                  data-on={current === key ? 1 : 0}
                  onClick={() =>
                    navigate({ pathname: path, search: `${searchParams}` })
                  }
                >
                  {label}
                </button>
              ))}
            </nav>
          </header>

          <main key={current}>
            <Outlet />
          </main>
        </div>
      </div>
    </NextUIProvider>
  );
}

export default Root;
