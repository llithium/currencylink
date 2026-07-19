import type { Currency, HistoryGrouping } from "../api/frankfurter";

export type HistoryRange = "1W" | "1M" | "3M" | "1Y" | "5Y" | "MAX";

export const HISTORY_RANGES: HistoryRange[] = [
  "1W",
  "1M",
  "3M",
  "1Y",
  "5Y",
  "MAX",
];

export interface HistoryRequestRange {
  from: string;
  to: string;
  group?: HistoryGrouping;
}

export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function shiftedDate(
  now: Date,
  change: (date: Date) => void,
): string {
  const next = new Date(now);
  change(next);
  return isoDate(next);
}

export function getHistoryRequestRange(
  range: HistoryRange,
  fromCurrency: Currency,
  toCurrency: Currency,
  now = new Date(),
): HistoryRequestRange {
  const to = isoDate(now);

  switch (range) {
    case "1W":
      return {
        from: shiftedDate(now, (date) => date.setUTCDate(date.getUTCDate() - 7)),
        to,
      };
    case "1M":
      return {
        from: shiftedDate(now, (date) =>
          date.setUTCMonth(date.getUTCMonth() - 1),
        ),
        to,
      };
    case "3M":
      return {
        from: shiftedDate(now, (date) =>
          date.setUTCMonth(date.getUTCMonth() - 3),
        ),
        to,
      };
    case "1Y":
      return {
        from: shiftedDate(now, (date) =>
          date.setUTCFullYear(date.getUTCFullYear() - 1),
        ),
        to,
        group: "week",
      };
    case "5Y":
      return {
        from: shiftedDate(now, (date) =>
          date.setUTCFullYear(date.getUTCFullYear() - 5),
        ),
        to,
        group: "month",
      };
    case "MAX":
      return {
        from:
          fromCurrency.startDate > toCurrency.startDate
            ? fromCurrency.startDate
            : toCurrency.startDate,
        to,
        group: "month",
      };
  }
}

export function isHistoryRange(value: string | null): value is HistoryRange {
  return HISTORY_RANGES.includes(value as HistoryRange);
}
