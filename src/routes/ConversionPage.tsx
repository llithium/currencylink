import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getRate, type RatePoint } from "../api/frankfurter";
import CurrencyPicker from "../components/CurrencyPicker";
import { InlineError } from "../components/Signal";
import { useCurrencyPair } from "../hooks/useCurrencyPair";
import { fmtCurrency, fmtRate } from "../utils/format";
import { useCurrencies } from "./Root";

const AMOUNT_KEY = "currencylink-amount";
const QUICK_AMOUNTS = [100, 500, 1000, 5000, 10000];

export function normalizeAmountInput(value: string): string {
  const cleaned = value.replace(/[^\d.]/g, "");
  const [whole = "", ...decimals] = cleaned.split(".");
  return decimals.length ? `${whole}.${decimals.join("")}` : whole;
}

export function parseAmount(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export default function ConversionPage() {
  const currencies = useCurrencies();
  const pair = useCurrencyPair(currencies);
  const [searchParams, setSearchParams] = useSearchParams();
  const [amount, setAmount] = useState(() => {
    const initial = searchParams.get("amount") ?? localStorage.getItem(AMOUNT_KEY) ?? "1";
    return normalizeAmountInput(initial) || "1";
  });
  const [rate, setRate] = useState<RatePoint | null>(null);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setRate(null);
    getRate(pair.from, pair.to, controller.signal)
      .then(setRate)
      .catch((requestError: unknown) => {
        if (!(requestError instanceof DOMException && requestError.name === "AbortError")) {
          setError(requestError instanceof Error ? requestError.message : "Please try again.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [pair.from, pair.to, retryKey]);

  function updateAmount(nextValue: string) {
    const next = normalizeAmountInput(nextValue);
    setAmount(next);
    localStorage.setItem(AMOUNT_KEY, next);
    setSearchParams((current) => {
      current.set("from", pair.from);
      current.set("to", pair.to);
      current.set("amount", next || "0");
      return current;
    });
  }

  const amountValue = parseAmount(amount);
  const result = amountValue * (rate?.rate ?? 0);
  const inverse = rate?.rate ? 1 / rate.rate : 0;

  return (
    <section className="page page-convert" aria-labelledby="convert-title">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Currency converter</p>
          <h1 id="convert-title">Convert with reference rates</h1>
        </div>
        <p>Clear, daily midpoint estimates for 200+ world currencies.</p>
      </div>

      <div className="converter-grid">
        <article className="panel converter-panel">
          <div className="panel-topline">
            <span className="eyebrow">You send</span>
            <CurrencyPicker
              currencies={currencies}
              value={pair.from}
              excludeCode={pair.to}
              onChange={pair.setFrom}
              aria-label="Convert from currency"
            />
          </div>
          <label className="sr-only" htmlFor="convert-amount">Amount</label>
          <input
            id="convert-amount"
            className="amount-input"
            inputMode="decimal"
            value={amount}
            placeholder="0"
            onChange={(event) => updateAmount(event.target.value)}
          />
          <span className="currency-name">
            {currencies.find((currency) => currency.code === pair.from)?.name}
          </span>
        </article>

        <button type="button" className="swap-button" onClick={pair.swap} aria-label="Swap currencies">
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path d="M5.5 2v11m0 0L2.5 10m3 3 3-3M12.5 16V5m0 0-3 3m3-3 3 3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <article className="panel converter-panel result-panel" aria-live="polite">
          <div className="panel-topline">
            <span className="eyebrow">You receive</span>
            <CurrencyPicker
              currencies={currencies}
              value={pair.to}
              excludeCode={pair.from}
              onChange={pair.setTo}
              aria-label="Convert to currency"
            />
          </div>
          {loading ? (
            <div className="result-skeleton" aria-label="Loading conversion" role="status" />
          ) : (
            <div className="result-value">{rate ? fmtCurrency(result, pair.to) : "—"}</div>
          )}
          <span className="currency-name">
            {currencies.find((currency) => currency.code === pair.to)?.name}
          </span>
        </article>
      </div>

      {error && <InlineError message={error} retry={() => setRetryKey((key) => key + 1)} />}

      <div className="quick-amounts" aria-label="Quick amounts">
        {QUICK_AMOUNTS.map((quickAmount) => (
          <button key={quickAmount} type="button" onClick={() => updateAmount(String(quickAmount))}>
            {quickAmount >= 1000 ? `${quickAmount / 1000}K` : quickAmount}
          </button>
        ))}
      </div>

      <div className="rate-details panel">
        <div>
          <span className="eyebrow">Reference rate</span>
          <strong>
            1 {pair.from} = {rate ? fmtRate(rate.rate) : "—"} {pair.to}
          </strong>
        </div>
        <div>
          <span className="eyebrow">Inverse</span>
          <strong>
            1 {pair.to} = {rate ? fmtRate(inverse) : "—"} {pair.from}
          </strong>
        </div>
        <div>
          <span className="eyebrow">Effective date</span>
          <strong>{rate?.date ?? "—"}</strong>
        </div>
        <Link className="primary-button" to={`/history?from=${pair.from}&to=${pair.to}&range=1M`}>
          View history
        </Link>
      </div>

      <p className="rate-disclaimer">
        Reference estimate only. Banks and payment providers may add fees or a different exchange spread.
      </p>
    </section>
  );
}
