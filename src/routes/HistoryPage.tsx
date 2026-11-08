import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  getHistory,
  percentageChange,
  type RatePoint,
} from "../api/frankfurter";
import CurrencyPicker from "../components/CurrencyPicker";
import RateChart from "../components/RateChart";
import { Chg, InlineError } from "../components/Signal";
import { useCurrencyPair } from "../hooks/useCurrencyPair";
import { fmtRate } from "../utils/format";
import {
  HISTORY_RANGES,
  getHistoryRequestRange,
  isHistoryRange,
  type HistoryRange,
} from "../utils/historyRange";
import { useCurrencies } from "./Root";

export default function HistoryPage() {
  const currencies = useCurrencies();
  const pair = useCurrencyPair(currencies);
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedRange = searchParams.get("range");
  const range: HistoryRange = isHistoryRange(requestedRange)
    ? requestedRange
    : "1M";
  const [data, setData] = useState<RatePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  const fromCurrency = currencies.find(
    (currency) => currency.code === pair.from,
  )!;
  const toCurrency = currencies.find((currency) => currency.code === pair.to)!;
  const requestRange = useMemo(
    () => getHistoryRequestRange(range, fromCurrency, toCurrency),
    [fromCurrency, range, toCurrency],
  );

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    getHistory(
      {
        base: pair.from,
        quote: pair.to,
        from: requestRange.from,
        to: requestRange.to,
        group: requestRange.group,
      },
      controller.signal,
    )
      .then(setData)
      .catch((requestError: unknown) => {
        if (!(
          requestError instanceof DOMException &&
          requestError.name === "AbortError"
        )) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Please try again.",
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [pair.from, pair.to, requestRange, retryKey]);

  function setRange(next: HistoryRange) {
    setSearchParams((current) => {
      current.set("from", pair.from);
      current.set("to", pair.to);
      current.set("range", next);
      return current;
    });
  }

  const values = data.map((point) => point.rate);
  const open = values[0] ?? 0;
  const current = values[values.length - 1] ?? 0;
  const change = percentageChange(current, open);
  const high = values.length ? Math.max(...values) : 0;
  const low = values.length ? Math.min(...values) : 0;
  const hasHistory = !loading && !error && data.length > 0;

  return (
    <section className="page page-history" aria-labelledby="history-title">
      <div className="page-heading">
        <h1 id="history-title">Exchange-rate history</h1>
      </div>

      <div className="history-toolbar">
        <CurrencyPicker
          currencies={currencies}
          value={pair.from}
          excludeCode={pair.to}
          onChange={pair.setFrom}
          aria-label="History from currency"
        />
        <button
          type="button"
          className="inline-swap"
          onClick={pair.swap}
          aria-label="Swap history currencies"
        >
          ⇄
        </button>
        <CurrencyPicker
          currencies={currencies}
          value={pair.to}
          excludeCode={pair.from}
          onChange={pair.setTo}
          aria-label="History to currency"
        />
      </div>

      <div className="history-summary" aria-live="polite">
        <div>
          <span className="eyebrow">Latest reference rate</span>
          <strong>
            {hasHistory ? fmtRate(current) : "—"} <small>{pair.to}</small>
          </strong>
        </div>
        {hasHistory && (
          <>
            <span className="history-change">
              <Chg value={change} size={14} />
              <span>{range === "MAX" ? "All-time" : range} change</span>
            </span>
            <span className="history-dates">
              <time dateTime={data[0].date}>{data[0].date}</time>
              {" – "}
              <time dateTime={data[data.length - 1].date}>
                {data[data.length - 1].date}
              </time>
            </span>
          </>
        )}
      </div>

      <div className="panel history-chart-panel">
        {loading && (
          <div
            className="chart-skeleton"
            aria-label="Loading history chart"
            role="status"
          />
        )}
        {error && (
          <InlineError
            message={error}
            retry={() => setRetryKey((key) => key + 1)}
          />
        )}
        {hasHistory && <RateChart data={data} quote={pair.to} />}
        {!loading && !error && data.length === 0 && (
          <div className="empty-state">
            No history is available for this pair and range.
          </div>
        )}

        <div className="range-controls" aria-label="History range">
          {HISTORY_RANGES.map((item) => (
            <button
              key={item}
              type="button"
              className={item === range ? "range-active" : ""}
              aria-pressed={item === range}
              onClick={() => setRange(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="history-stats">
          {[
            { label: "Open", value: open },
            { label: "High", value: high },
            { label: "Low", value: low },
          ].map(({ label, value }) => (
            <div className="stat-card" key={label}>
              <span className="eyebrow">{label}</span>
              <strong>{hasHistory ? fmtRate(value) : "—"}</strong>
            </div>
          ))}
        </div>
      </div>

      <p className="chart-attribution">
        Interactive charts by{" "}
        <a href="https://www.tradingview.com/">TradingView</a> · Lightweight
        Charts™
      </p>
    </section>
  );
}
