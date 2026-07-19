import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import {
  DEFAULT_PINNED_CURRENCIES,
  PINNED_CURRENCIES_KEY,
  usePinnedCurrencies,
} from "./usePinnedCurrencies";

describe("usePinnedCurrencies", () => {
  beforeEach(() => localStorage.clear());

  it("starts with USD and EUR and persists changes across listeners", () => {
    const first = renderHook(() => usePinnedCurrencies());
    const second = renderHook(() => usePinnedCurrencies());

    expect(first.result.current.pinnedCodes).toEqual(DEFAULT_PINNED_CURRENCIES);
    act(() => first.result.current.togglePin("JPY"));

    expect(second.result.current.pinnedCodes).toEqual(["USD", "EUR", "JPY"]);
    expect(JSON.parse(localStorage.getItem(PINNED_CURRENCIES_KEY) ?? "[]"))
      .toEqual(["USD", "EUR", "JPY"]);
  });
});
