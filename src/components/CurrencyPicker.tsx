import { Autocomplete, AutocompleteItem } from "@nextui-org/react";
import { useEffect, useMemo, useState } from "react";
import { currencyFlags } from "../utils/currencyFlags";

interface Item {
  key: string;
  code: string;
  name: string;
}

interface CurrencyPickerProps {
  currencyOptions: string[];
  currencyNames: string[];
  /** currency code currently in use — the source of truth for display */
  value: string;
  /** receives the index string of the newly selected currency */
  onSelectionChange: (key: string) => void;
  /** currency code to disable in the list (the opposite side of a pair) */
  excludeCode?: string;
  /** "hero" shows flag + code chip + full serif name; "code" shows flag + serif code */
  variant?: "hero" | "code";
  className?: string;
  "aria-label": string;
}

const flag = (code: string) =>
  `fi ${currencyFlags[code] ?? ""} rounded-[1px]`;

export default function CurrencyPicker({
  currencyOptions,
  currencyNames,
  value,
  onSelectionChange,
  excludeCode,
  variant = "hero",
  className,
  "aria-label": ariaLabel,
}: CurrencyPickerProps) {
  const allItems = useMemo<Item[]>(
    () =>
      currencyOptions.map((code, i) => ({
        key: String(i),
        code,
        name: currencyNames[i],
      })),
    [currencyOptions, currencyNames],
  );

  // The selected key is derived from the live code so display can never drift
  // out of sync with the currency actually in use.
  const selectedKey = String(currencyOptions.indexOf(value));
  const selected = allItems.find((it) => it.code === value);
  const display = selected
    ? variant === "hero"
      ? selected.name
      : selected.code
    : "";

  const [inputValue, setInputValue] = useState(display);
  const [items, setItems] = useState<Item[]>(allItems);

  // Keep the trigger text in sync when the selection changes externally
  // (e.g. the swap button) or when the option list first loads.
  useEffect(() => {
    setInputValue(display);
  }, [display]);

  const disabledKeys = useMemo(() => {
    if (!excludeCode) return [];
    const idx = currencyOptions.indexOf(excludeCode);
    return idx >= 0 ? [String(idx)] : [];
  }, [excludeCode, currencyOptions]);

  function filter(value: string) {
    const q = value.trim().toLowerCase();
    setItems(
      q === ""
        ? allItems
        : allItems.filter((it) =>
            `${it.code} ${it.name}`.toLowerCase().includes(q),
          ),
    );
  }

  const flagStyle = { width: "1.45em", height: "1.05em" } as const;

  return (
    <Autocomplete
      aria-label={ariaLabel}
      className={className}
      variant="underlined"
      isClearable={false}
      allowsCustomValue={false}
      menuTrigger="focus"
      selectedKey={selectedKey}
      inputValue={inputValue}
      items={items}
      disabledKeys={disabledKeys}
      onInputChange={(value) => {
        setInputValue(value);
        filter(value);
      }}
      onOpenChange={(open) => {
        if (open) {
          setItems(allItems);
        } else {
          setInputValue(display);
          setItems(allItems);
        }
      }}
      onSelectionChange={(key) => {
        if (key == null) return;
        onSelectionChange(String(key));
        setItems(allItems);
        const next = allItems.find((it) => it.key === String(key));
        if (next) setInputValue(variant === "hero" ? next.name : next.code);
      }}
      startContent={
        selected && (
          <span className="flex flex-none items-center gap-[9px]">
            <span
              className={`${flag(selected.code)} shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)]`}
              style={flagStyle}
            />
            {variant === "hero" && (
              <span className="font-sans text-[10px] font-bold uppercase tracking-[1.2px] text-faint">
                {selected.code}
              </span>
            )}
          </span>
        )
      }
      classNames={{
        base: "text-foreground",
        clearButton: "hidden",
        selectorButton: "text-ink",
        popoverContent:
          "!bg-paper rounded-none border border-ink p-[5px] shadow-[5px_7px_0_var(--shadow)]",
        listbox: "p-0",
      }}
      inputProps={{
        classNames: {
          inputWrapper:
            "!bg-transparent h-auto min-h-0 border-b-[1.5px] border-ink px-0 pb-[7px] pt-[5px] shadow-none after:bg-accent data-[hover=true]:border-ink",
          input:
            variant === "hero"
              ? "font-serif !text-ink !bg-transparent min-w-0 text-[24px] leading-none placeholder:!text-faint"
              : "font-serif !text-ink !bg-transparent min-w-0 text-[23px] leading-none tracking-[0.3px] placeholder:!text-faint",
          innerWrapper: "!flex min-w-0 flex-nowrap items-center gap-[9px]",
        },
      }}
    >
      {(item) => (
        <AutocompleteItem
          key={item.key}
          textValue={`${item.code} ${item.name}`}
          startContent={
            <span
              className={`${flag(item.code)} flex-none shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)]`}
              style={{ width: "1.5em", height: "1.08em" }}
            />
          }
          classNames={{
            base: "rounded-none px-[9px] py-[8px] data-[hover=true]:bg-accent-soft data-[selectable=true]:focus:bg-accent-soft data-[selected=true]:bg-accent-soft",
          }}
        >
          <span className="flex items-center gap-[11px]">
            <span className="w-10 flex-none font-sans text-[11px] font-bold tracking-[0.6px] text-accent">
              {item.code}
            </span>
            <span className="overflow-hidden text-ellipsis whitespace-nowrap font-serif text-[18px] text-ink">
              {item.name}
            </span>
          </span>
        </AutocompleteItem>
      )}
    </Autocomplete>
  );
}
