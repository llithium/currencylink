import { useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import type { Currency } from "../api/frankfurter";
import {
  normalizeCurrencyParam,
  validStoredCurrency,
} from "../utils/currencyParams";

const FROM_KEY = "currencylink-from";
const TO_KEY = "currencylink-to";

export function useCurrencyPair(
  currencies: Currency[],
  defaults: { from: string; to: string } = { from: "EUR", to: "USD" },
) {
  const [searchParams, setSearchParams] = useSearchParams();

  const storedFrom = validStoredCurrency(localStorage.getItem(FROM_KEY), currencies);
  const storedTo = validStoredCurrency(localStorage.getItem(TO_KEY), currencies);
  const fromParam = normalizeCurrencyParam(
    searchParams.get("from"),
    currencies,
    storedFrom ?? defaults.from,
  );
  const toParam = normalizeCurrencyParam(
    searchParams.get("to"),
    currencies,
    storedTo ?? defaults.to,
  );

  const pair = useMemo(() => {
    const from = fromParam.code;
    let to = toParam.code;
    if (from === to) {
      to = currencies.find((currency) => currency.code !== from)?.code ?? to;
    }
    return { from, to };
  }, [currencies, fromParam.code, toParam.code]);

  useEffect(() => {
    if (!fromParam.migrated && !toParam.migrated) return;
    setSearchParams(
      (current) => {
        current.set("from", pair.from);
        current.set("to", pair.to);
        return current;
      },
      { replace: true },
    );
  }, [fromParam.migrated, pair.from, pair.to, setSearchParams, toParam.migrated]);

  function setPair(from: string, to: string) {
    localStorage.setItem(FROM_KEY, from);
    localStorage.setItem(TO_KEY, to);
    setSearchParams((current) => {
      current.set("from", from);
      current.set("to", to);
      return current;
    });
  }

  function setFrom(from: string) {
    if (from === pair.to) setPair(pair.to, pair.from);
    else setPair(from, pair.to);
  }

  function setTo(to: string) {
    if (to === pair.from) setPair(pair.to, pair.from);
    else setPair(pair.from, to);
  }

  return {
    ...pair,
    setFrom,
    setTo,
    swap: () => setPair(pair.to, pair.from),
  };
}
