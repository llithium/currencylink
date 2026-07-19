import type { Currency } from "../api/frankfurter";
import { currencyFlag } from "../utils/currencyFlag";

export default function CurrencyBadge({
  currency,
  compact = false,
}: {
  currency: Currency;
  compact?: boolean;
}) {
  return (
    <span
      className={`currency-badge${compact ? " currency-badge-compact" : ""}`}
      aria-hidden="true"
      title={currency.name}
    >
      <span className="currency-flag">{currencyFlag(currency.code)}</span>
    </span>
  );
}
