import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  getHistory,
  getLatestRates,
  percentageChange,
  type RatePoint,
} from "../api/frankfurter";
import CurrencyBadge from "../components/CurrencyBadge";
import CurrencyPicker from "../components/CurrencyPicker";
import { Chg, InlineError, LoadingRows, Sparkline } from "../components/Signal";
import { usePinnedCurrencies } from "../hooks/usePinnedCurrencies";
import { normalizeCurrencyParam } from "../utils/currencyParams";
import { fmtRate } from "../utils/format";
import { isoDate } from "../utils/historyRange";
import { useCurrencies } from "./Root";

type SortKey = "code" | "rate" | "change";

interface RateRow {
  code: string;
  rate: number;
  change: number;
  series: number[];
}

const PAGE_SIZE = 50;

export default function RatesPage() {
  const currencies = useCurrencies();
  const { pinnedCodes, togglePin } = usePinnedCurrencies();
  const [searchParams, setSearchParams] = useSearchParams();
  const baseParam = normalizeCurrencyParam(
    searchParams.get("base"),
    currencies,
    localStorage.getItem("currencylink-from") ?? "USD",
  );
  const base = baseParam.code;
  const [rows, setRows] = useState<RateRow[]>([]);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("code");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [effectiveDate, setEffectiveDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!baseParam.migrated) return;
    setSearchParams(
      (current) => {
        current.set("base", base);
        return current;
      },
      { replace: true },
    );
  }, [base, baseParam.migrated, setSearchParams]);

  useEffect(() => {
    const controller = new AbortController();
    const start = new Date();
    start.setUTCDate(start.getUTCDate() - 30);
    const recentStart = new Date();
    recentStart.setUTCDate(recentStart.getUTCDate() - 10);
    setLoading(true);
    setError("");

    Promise.all([
      getLatestRates(base, undefined, controller.signal),
      getHistory({ base, from: isoDate(start), group: "week" }, controller.signal),
      getHistory({ base, from: isoDate(recentStart) }, controller.signal),
    ])
      .then(([latest, history, recentHistory]) => {
        const historyByCode = new Map<string, RatePoint[]>();
        for (const point of history) {
          const series = historyByCode.get(point.quote) ?? [];
          series.push(point);
          historyByCode.set(point.quote, series);
        }
        const recentByCode = new Map<string, RatePoint[]>();
        for (const point of recentHistory) {
          const series = recentByCode.get(point.quote) ?? [];
          series.push(point);
          recentByCode.set(point.quote, series);
        }
        setRows(
          latest.filter((point) => point.quote !== base).map((point) => {
            const series = historyByCode.get(point.quote) ?? [point];
            const recentSeries = recentByCode.get(point.quote) ?? [point];
            const previous = recentSeries[recentSeries.length - 2] ?? point;
            return {
              code: point.quote,
              rate: point.rate,
              change: percentageChange(point.rate, previous.rate),
              series: series.map((item) => item.rate),
            };
          }),
        );
        setEffectiveDate(latest[0]?.date ?? "");
      })
      .catch((requestError: unknown) => {
        if (!(requestError instanceof DOMException && requestError.name === "AbortError")) {
          setError(requestError instanceof Error ? requestError.message : "Please try again.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [base, retryKey]);

  const currencyByCode = useMemo(
    () => new Map(currencies.map((currency) => [currency.code, currency])),
    [currencies],
  );

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    const filtered = normalizedQuery
      ? rows.filter((row) => {
          const currency = currencyByCode.get(row.code);
          return `${row.code} ${currency?.name ?? ""}`.toLocaleLowerCase().includes(normalizedQuery);
        })
      : rows;
    return [...filtered].sort((a, b) => {
      const pinnedOrder = Number(pinnedCodes.includes(b.code)) - Number(pinnedCodes.includes(a.code));
      if (pinnedOrder !== 0) return pinnedOrder;
      if (sort === "rate") return b.rate - a.rate;
      if (sort === "change") return b.change - a.change;
      return a.code.localeCompare(b.code);
    });
  }, [currencyByCode, pinnedCodes, query, rows, sort]);

  const visibleRows = filteredRows.slice(0, visibleCount);

  function setBase(code: string) {
    localStorage.setItem("currencylink-from", code);
    setVisibleCount(PAGE_SIZE);
    setSearchParams((current) => {
      current.set("base", code);
      return current;
    });
  }

  function prepareHistory(code: string) {
    localStorage.setItem("currencylink-from", base);
    localStorage.setItem("currencylink-to", code);
  }

  return (
    <section className="page page-rates" aria-labelledby="rates-title">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Market overview</p>
          <h1 id="rates-title">Reference rates</h1>
        </div>
        <p>Search every active currency and compare the latest available daily movement.</p>
      </div>

      <div className="rates-toolbar">
        <label className="search-field">
          <span className="sr-only">Search currencies</span>
          <svg width="17" height="17" viewBox="0 0 18 18" aria-hidden="true">
            <circle cx="8" cy="8" r="5" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="m12 12 3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setVisibleCount(PAGE_SIZE);
            }}
            placeholder="Search code or currency name"
          />
        </label>
        <label className="sort-field">
          <span>Sort</span>
          <select value={sort} onChange={(event) => setSort(event.target.value as SortKey)}>
            <option value="code">Currency</option>
            <option value="rate">Highest rate</option>
            <option value="change">Largest gain</option>
          </select>
        </label>
        <div className="base-picker-group">
          <CurrencyPicker currencies={currencies} value={base} onChange={setBase} aria-label="Base currency" />
          <button
            className={`pin-button pin-base${pinnedCodes.includes(base) ? " pin-button-active" : ""}`}
            type="button"
            aria-label={`${pinnedCodes.includes(base) ? "Unpin" : "Pin"} ${base} reference rate`}
            aria-pressed={pinnedCodes.includes(base)}
            onClick={() => togglePin(base)}
            title={`${pinnedCodes.includes(base) ? "Unpin" : "Pin"} ${base}`}
          >
            <svg width="15" height="15" viewBox="0 0 20 20" aria-hidden="true">
              <path d="M7 3h6l-.8 4 2.8 2.8v1.2H5V9.8L7.8 7 7 3Zm3 8v6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      <div className="panel rates-panel">
        <div className="rates-header">
          <span>1 {base} buys</span>
          <span>{effectiveDate ? `Effective ${effectiveDate}` : "Daily reference rates"}</span>
          <span>30-day trend · previous reference change</span>
        </div>

        {loading && <LoadingRows count={7} />}
        {error && <InlineError message={error} retry={() => setRetryKey((key) => key + 1)} />}
        {!loading && !error && visibleRows.length === 0 && (
          <div className="empty-state">No currency matches “{query}”.</div>
        )}
        {!loading && !error && visibleRows.map((row) => {
          const currency = currencyByCode.get(row.code);
          if (!currency) return null;
          const isPinned = pinnedCodes.includes(row.code);
          return (
            <div className={`rate-row${isPinned ? " rate-row-pinned" : ""}`} key={row.code}>
              <button
                className={`pin-button${isPinned ? " pin-button-active" : ""}`}
                type="button"
                aria-label={`${isPinned ? "Unpin" : "Pin"} ${row.code} reference rate`}
                aria-pressed={isPinned}
                onClick={() => togglePin(row.code)}
                title={`${isPinned ? "Unpin" : "Pin"} ${row.code}`}
              >
                <svg width="15" height="15" viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M7 3h6l-.8 4 2.8 2.8v1.2H5V9.8L7.8 7 7 3Zm3 8v6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <Link
                className="rate-row-link"
                to={`/history?from=${base}&to=${row.code}&range=1M`}
                onClick={() => prepareHistory(row.code)}
                aria-label={`${row.code} ${currency.name}: ${fmtRate(row.rate)}. View history`}
              >
                <CurrencyBadge currency={currency} />
                <span className="rate-identity">
                  <strong>{row.code}</strong>
                  <span>{currency.name}</span>
                </span>
                <Sparkline data={row.series} />
                <span className="rate-values">
                  <strong>{fmtRate(row.rate)}</strong>
                  <Chg value={row.change} size={11} label="Previous reference change" />
                </span>
              </Link>
            </div>
          );
        })}

        {!loading && !error && visibleCount < filteredRows.length && (
          <button className="show-more" type="button" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}>
            Show {Math.min(PAGE_SIZE, filteredRows.length - visibleCount)} more
          </button>
        )}
      </div>
    </section>
  );
}
