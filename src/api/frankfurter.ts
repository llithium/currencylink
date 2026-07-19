export const FRANKFURTER_API = "https://api.frankfurter.dev/v2";

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  startDate: string;
}

export interface RatePoint {
  date: string;
  base: string;
  quote: string;
  rate: number;
}

interface CurrencyResponse {
  iso_code: string;
  name: string;
  symbol: string;
  start_date: string;
}

interface RateResponse {
  date: string;
  base: string;
  quote: string;
  rate: number;
}

interface ApiErrorBody {
  message?: string;
}

export class FrankfurterError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "FrankfurterError";
    this.status = status;
  }
}

async function fetchJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${FRANKFURTER_API}${path}`, {
    signal,
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    let body: ApiErrorBody = {};
    try {
      body = (await response.json()) as ApiErrorBody;
    } catch {
      // The status text is the best available fallback for a non-JSON error.
    }
    throw new FrankfurterError(
      body.message || response.statusText || "Exchange-rate request failed",
      response.status,
    );
  }

  return (await response.json()) as T;
}

function normalizeRate(row: RateResponse): RatePoint {
  return {
    date: row.date,
    base: row.base,
    quote: row.quote,
    rate: row.rate,
  };
}

let currencyCache: Currency[] | undefined;
let currencyRequest: Promise<Currency[]> | undefined;

export async function getCurrencies(signal?: AbortSignal): Promise<Currency[]> {
  if (currencyCache) return currencyCache;

  // A router navigation signal should cancel only that navigation, not a shared
  // request that other mounted views may still need.
  if (signal) {
    const rows = await fetchJson<CurrencyResponse[]>("/currencies", signal);
    currencyCache = rows
      .map((row) => ({
        code: row.iso_code,
        name: row.name,
        symbol: row.symbol,
        startDate: row.start_date,
      }))
      .sort((a, b) => a.code.localeCompare(b.code));
    return currencyCache;
  }

  if (!currencyRequest) {
    currencyRequest = fetchJson<CurrencyResponse[]>("/currencies")
      .then((rows) =>
        rows
          .map((row) => ({
            code: row.iso_code,
            name: row.name,
            symbol: row.symbol,
            startDate: row.start_date,
          }))
          .sort((a, b) => a.code.localeCompare(b.code)),
      )
      .then((currencies) => {
        currencyCache = currencies;
        return currencies;
      })
      .catch((error: unknown) => {
        currencyRequest = undefined;
        throw error;
      });
  }

  return currencyRequest;
}

export async function getRate(
  base: string,
  quote: string,
  signal?: AbortSignal,
): Promise<RatePoint> {
  const row = await fetchJson<RateResponse>(
    `/rate/${encodeURIComponent(base)}/${encodeURIComponent(quote)}`,
    signal,
  );
  return normalizeRate(row);
}

export async function getLatestRates(
  base: string,
  quotes?: string[],
  signal?: AbortSignal,
): Promise<RatePoint[]> {
  const params = new URLSearchParams({ base });
  if (quotes?.length) params.set("quotes", quotes.join(","));
  const rows = await fetchJson<RateResponse[]>(`/rates?${params}`, signal);
  return rows.map(normalizeRate);
}

export type HistoryGrouping = "week" | "month";

export async function getHistory(
  options: {
    base: string;
    quote?: string;
    quotes?: string[];
    from: string;
    to?: string;
    group?: HistoryGrouping;
  },
  signal?: AbortSignal,
): Promise<RatePoint[]> {
  const params = new URLSearchParams({
    base: options.base,
    from: options.from,
  });
  const quotes = options.quotes ?? (options.quote ? [options.quote] : []);
  if (quotes.length) params.set("quotes", quotes.join(","));
  if (options.to) params.set("to", options.to);
  if (options.group) params.set("group", options.group);

  const rows = await fetchJson<RateResponse[]>(`/rates?${params}`, signal);
  return rows.map(normalizeRate).sort((a, b) => a.date.localeCompare(b.date));
}

export function percentageChange(current: number, previous: number): number {
  return previous ? ((current - previous) / previous) * 100 : 0;
}

export function clearCurrencyCacheForTests(): void {
  currencyCache = undefined;
  currencyRequest = undefined;
}
