import type { Currency } from "../api/frankfurter";

export const LEGACY_V1_CODES = [
  "AUD",
  "BGN",
  "BRL",
  "CAD",
  "CHF",
  "CNY",
  "CZK",
  "DKK",
  "EUR",
  "GBP",
  "HKD",
  "HUF",
  "IDR",
  "ILS",
  "INR",
  "ISK",
  "JPY",
  "KRW",
  "MXN",
  "MYR",
  "NOK",
  "NZD",
  "PHP",
  "PLN",
  "RON",
  "SEK",
  "SGD",
  "THB",
  "TRY",
  "USD",
  "ZAR",
] as const;

export interface NormalizedCurrencyParam {
  code: string;
  migrated: boolean;
}

export function normalizeCurrencyParam(
  value: string | null,
  currencies: Currency[],
  fallback: string,
): NormalizedCurrencyParam {
  const valid = new Set(currencies.map((currency) => currency.code));
  const normalized = value?.trim().toUpperCase() ?? "";

  if (valid.has(normalized)) return { code: normalized, migrated: false };

  if (/^\d+$/.test(normalized)) {
    const legacyCode = LEGACY_V1_CODES[Number(normalized)];
    if (legacyCode && valid.has(legacyCode)) {
      return { code: legacyCode, migrated: true };
    }
  }

  return { code: valid.has(fallback) ? fallback : currencies[0]?.code ?? fallback, migrated: false };
}

export function validStoredCurrency(
  value: string | null,
  currencies: Currency[],
): string | undefined {
  const normalized = value?.toUpperCase();
  return currencies.some((currency) => currency.code === normalized)
    ? normalized
    : undefined;
}
