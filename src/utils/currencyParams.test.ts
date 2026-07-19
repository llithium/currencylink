import { describe, expect, it } from "vitest";
import type { Currency } from "../api/frankfurter";
import { normalizeCurrencyParam, validStoredCurrency } from "./currencyParams";

const currencies: Currency[] = [
  { code: "EUR", name: "Euro", symbol: "€", startDate: "1999-01-04" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥", startDate: "1948-01-01" },
  { code: "USD", name: "US Dollar", symbol: "$", startDate: "1948-01-01" },
];

describe("currency URL parameters", () => {
  it("accepts case-insensitive currency codes", () => {
    expect(normalizeCurrencyParam("usd", currencies, "EUR")).toEqual({ code: "USD", migrated: false });
  });

  it("migrates the legacy v1 numeric indexes", () => {
    expect(normalizeCurrencyParam("8", currencies, "USD")).toEqual({ code: "EUR", migrated: true });
    expect(normalizeCurrencyParam("29", currencies, "EUR")).toEqual({ code: "USD", migrated: true });
  });

  it("falls back safely and validates stored values", () => {
    expect(normalizeCurrencyParam("XXX", currencies, "EUR").code).toBe("EUR");
    expect(validStoredCurrency("jpy", currencies)).toBe("JPY");
    expect(validStoredCurrency("xxx", currencies)).toBeUndefined();
  });
});
