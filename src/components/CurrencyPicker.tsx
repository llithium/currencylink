import { useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  ComboBox,
  Input,
  ListBox,
  ListBoxItem,
  Popover,
  type Key,
} from "react-aria-components";
import type { Currency } from "../api/frankfurter";
import CurrencyBadge from "./CurrencyBadge";

interface CurrencyPickerProps {
  currencies: Currency[];
  value: string;
  onChange: (code: string) => void;
  excludeCode?: string;
  className?: string;
  "aria-label": string;
}

export default function CurrencyPicker({
  currencies,
  value,
  onChange,
  excludeCode,
  className = "",
  "aria-label": ariaLabel,
}: CurrencyPickerProps) {
  const fieldRef = useRef<HTMLDivElement>(null);
  const selected = currencies.find((currency) => currency.code === value);
  const options = useMemo(
    () =>
      selected
        ? [selected, ...currencies.filter((currency) => currency !== selected)]
        : currencies,
    [currencies, selected],
  );
  const [inputValue, setInputValue] = useState(value);

  useEffect(() => setInputValue(value), [value]);

  function selectCurrency(key: Key | null) {
    if (key == null) return;
    const code = String(key);
    onChange(code);
    setInputValue(code);
  }

  return (
    <ComboBox
      aria-label={ariaLabel}
      className={`currency-picker ${className}`}
      value={value}
      onChange={selectCurrency}
      inputValue={inputValue}
      onInputChange={setInputValue}
      menuTrigger="focus"
      defaultFilter={(textValue, query) =>
        textValue.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())
      }
    >
      <div className="currency-picker-field" ref={fieldRef}>
        {selected && <CurrencyBadge currency={selected} compact />}
        <Input
          className="currency-picker-input"
          onFocus={(event) => event.currentTarget.select()}
          onBlur={() => setInputValue(value)}
        />
        <Button className="currency-picker-button" aria-label="Show currencies">
          <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
            <path
              d="m4 6 4 4 4-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
        </Button>
      </div>
      <Popover
        className="currency-popover"
        placement="bottom end"
        triggerRef={fieldRef}
        offset={6}
        containerPadding={8}
        maxHeight={362}
      >
        <ListBox items={options} className="currency-listbox">
          {(currency) => (
            <ListBoxItem
              id={currency.code}
              textValue={`${currency.code} ${currency.name}`}
              aria-label={`${currency.code} ${currency.name}`}
              isDisabled={currency.code === excludeCode}
              className="currency-option"
            >
              <CurrencyBadge currency={currency} />
              <span className="currency-option-copy">
                <strong>{currency.code}</strong>
                <span>{currency.name}</span>
              </span>
              {currency === selected ? (
                <svg
                  className="currency-option-check"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  aria-hidden="true"
                >
                  <path
                    d="m3.5 8 3 3 6-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <span className="currency-option-symbol" aria-hidden="true">
                  {currency.symbol}
                </span>
              )}
            </ListBoxItem>
          )}
        </ListBox>
      </Popover>
    </ComboBox>
  );
}
