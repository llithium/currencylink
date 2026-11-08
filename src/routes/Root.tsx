import { useEffect, useMemo, useState } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useRouteLoaderData,
} from "react-router-dom";
import {
  getCurrencies,
  getHistory,
  percentageChange,
  type Currency,
} from "../api/frankfurter";
import { Chg } from "../components/Signal";
import ThemeToggle from "../components/ThemeToggle";
import { usePinnedCurrencies } from "../hooks/usePinnedCurrencies";
import { currencyFlag } from "../utils/currencyFlag";
import { fmtRate } from "../utils/format";
import { isoDate } from "../utils/historyRange";

export interface RootLoaderData {
  currencies: Currency[];
}

export async function rootLoader({
  request,
}: {
  request: Request;
}): Promise<RootLoaderData> {
  return { currencies: await getCurrencies(request.signal) };
}

export function useCurrencies(): Currency[] {
  const data = useRouteLoaderData("root") as RootLoaderData | undefined;
  if (!data) throw new Error("Currency metadata is unavailable");
  return data.currencies;
}

const NAV_ITEMS = [
  { path: "/", label: "Convert" },
  { path: "/rates", label: "Rates" },
  { path: "/history", label: "History" },
];
interface TickerEntry {
  rate: number;
  change: number;
}

function Root() {
  const location = useLocation();
  const currencies = useCurrencies();
  const { pinnedCodes } = usePinnedCurrencies();
  const [ticker, setTicker] = useState<Record<string, TickerEntry>>({});
  const [effectiveDate, setEffectiveDate] = useState("");

  const availableTickerCodes = useMemo(
    () =>
      pinnedCodes.filter((code) =>
        currencies.some((currency) => currency.code === code),
      ),
    [currencies, pinnedCodes],
  );
  const fallbackQuote = useMemo(
    () =>
      currencies.find((currency) => currency.code === "EUR")?.code ??
      currencies.find((currency) => currency.code !== "USD")?.code,
    [currencies],
  );

  useEffect(() => {
    if (availableTickerCodes.length === 0) {
      setTicker({});
      setEffectiveDate("");
      return;
    }

    const controller = new AbortController();
    const from = new Date();
    from.setUTCDate(from.getUTCDate() - 10);
    const quoteCodes = availableTickerCodes.filter((code) => code !== "USD");
    const requestedCodes =
      quoteCodes.length > 0 ? quoteCodes : fallbackQuote ? [fallbackQuote] : [];

    if (requestedCodes.length === 0) {
      setTicker({ USD: { rate: 1, change: 0 } });
      return;
    }

    getHistory(
      { base: "USD", quotes: requestedCodes, from: isoDate(from) },
      controller.signal,
    )
      .then((points) => {
        const next: Record<string, TickerEntry> = {};
        let latestDate = "";
        for (const code of quoteCodes) {
          const series = points.filter((point) => point.quote === code);
          const latest = series[series.length - 1];
          const previous = series[series.length - 2] ?? latest;
          if (latest) {
            next[code] = {
              rate: latest.rate,
              change: percentageChange(latest.rate, previous.rate),
            };
            if (latest.date > latestDate) latestDate = latest.date;
          }
        }
        if (availableTickerCodes.includes("USD")) {
          next.USD = { rate: 1, change: 0 };
        }
        setTicker(next);
        setEffectiveDate(latestDate);
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setTicker({});
        }
      });

    return () => controller.abort();
  }, [availableTickerCodes, fallbackQuote]);

  return (
    <div className="app-shell">
      <div className="app-wrap">
        <header className="site-header">
          <div className="brand-row">
            <NavLink to="/" className="brand" aria-label="Currency Link home">
              <span className="brand-mark" aria-hidden="true" />
              <span>Currency Link</span>
            </NavLink>
          </div>

          <nav className="primary-nav" aria-label="Primary navigation">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.path}
                to={{ pathname: item.path, search: location.search }}
                end={item.path === "/"}
                className="nav-link"
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <ThemeToggle />
        </header>

        <main className="main-content">
          <Outlet />
        </main>

        <aside className="watchlist" aria-label="Pinned rates">
          <div className="watchlist-heading">
            <div>
              <h2>Pinned rates</h2>
              <p className="watchlist-basis">
                Per 1 USD
                {effectiveDate && (
                  <>
                    {" "}
                    <span aria-hidden="true">·</span>{" "}
                    <time dateTime={effectiveDate}>{effectiveDate}</time>
                  </>
                )}
              </p>
            </div>
            <Link to="/rates?base=USD">Manage currencies</Link>
          </div>
          <div className="ticker" aria-label="Pinned USD-based reference rates">
            {availableTickerCodes.length === 0 && (
              <Link className="ticker-empty" to="/rates?base=USD">
                Choose currencies to pin
              </Link>
            )}
            {availableTickerCodes.map((code) => {
              const item = ticker[code];
              return (
                <span className="ticker-item" key={code}>
                  <span className="ticker-currency">
                    <span className="ticker-flag" aria-hidden="true">
                      {currencyFlag(code)}
                    </span>
                    <strong>{code}</strong>
                  </span>
                  <span className="ticker-values">
                    <span>{item ? fmtRate(item.rate) : "—"}</span>
                    {item && code !== "USD" && (
                      <Chg value={item.change} size={11} />
                    )}
                  </span>
                </span>
              );
            })}
          </div>
        </aside>

        <footer className="site-footer">
          <span>Daily blended reference rates</span>
          <span>
            Data by <a href="https://frankfurter.dev/">Frankfurter</a>
          </span>
        </footer>
      </div>
    </div>
  );
}

export default Root;
