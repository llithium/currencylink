import { useCallback, useEffect, useState } from "react";

export const PINNED_CURRENCIES_KEY = "currencylink-pinned-currencies";
export const DEFAULT_PINNED_CURRENCIES = ["USD", "EUR"];
const PINS_CHANGED_EVENT = "currencylink:pins-changed";

function normalizeCodes(value: unknown): string[] {
  if (!Array.isArray(value)) return DEFAULT_PINNED_CURRENCIES;
  return [...new Set(
    value.filter(
      (code): code is string => typeof code === "string" && /^[A-Z]{3}$/.test(code),
    ),
  )];
}

export function readPinnedCurrencies(): string[] {
  try {
    const stored = localStorage.getItem(PINNED_CURRENCIES_KEY);
    return stored === null
      ? DEFAULT_PINNED_CURRENCIES
      : normalizeCodes(JSON.parse(stored));
  } catch {
    return DEFAULT_PINNED_CURRENCIES;
  }
}

function savePinnedCurrencies(codes: string[]) {
  try {
    localStorage.setItem(PINNED_CURRENCIES_KEY, JSON.stringify(codes));
  } catch {
    // Keep the current page responsive if storage is unavailable.
  }
  window.dispatchEvent(new CustomEvent(PINS_CHANGED_EVENT, { detail: codes }));
}

export function usePinnedCurrencies() {
  const [pinnedCodes, setPinnedCodes] = useState(readPinnedCurrencies);

  useEffect(() => {
    const syncFromStorage = () => setPinnedCodes(readPinnedCurrencies());
    const syncFromPage = (event: Event) => {
      setPinnedCodes(normalizeCodes((event as CustomEvent<unknown>).detail));
    };
    window.addEventListener("storage", syncFromStorage);
    window.addEventListener(PINS_CHANGED_EVENT, syncFromPage);
    return () => {
      window.removeEventListener("storage", syncFromStorage);
      window.removeEventListener(PINS_CHANGED_EVENT, syncFromPage);
    };
  }, []);

  const togglePin = useCallback((code: string) => {
    const current = readPinnedCurrencies();
    const next = current.includes(code)
      ? current.filter((pinnedCode) => pinnedCode !== code)
      : [...current, code];
    setPinnedCodes(next);
    savePinnedCurrencies(next);
  }, []);

  return { pinnedCodes, togglePin };
}
