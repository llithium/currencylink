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
  /** kept for call-site compatibility; both render the compact code pill */
  variant?: "hero" | "code";
  className?: string;
  "aria-label": string;
}

const flag = (code: string) =>
  `fi ${currencyFlags[code] ?? ""} rounded-[3px]`;

export default function CurrencyPicker({
  currencyOptions,
  currencyNames,
  value,
  onSelectionChange,
  excludeCode,
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
  const display = selected ? selected.code : "";

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
          // Clear the trigger text so typing searches fresh instead of
          // appending to the current code (e.g. "BRLusd" → no matches).
          setInputValue("");
          setItems(allItems);
        } else {
          setInputValue(display);
          setItems(allItems);
        }
      }}
      placeholder="Search…"
      onSelectionChange={(key) => {
        if (key == null) return;
        onSelectionChange(String(key));
        setItems(allItems);
        const next = allItems.find((it) => it.key === String(key));
        if (next) setInputValue(next.code);
        // menuTrigger="focus" reopens the panel when NextUI restores focus
        // to the input after picking — drop focus once that restore has
        // happened so the panel actually closes.
        setTimeout(
          () => (document.activeElement as HTMLElement | null)?.blur?.(),
          80,
        );
      }}
      startContent={
        selected && (
          <span
            className={`${flag(selected.code)} flex-none shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]`}
            style={flagStyle}
          />
        )
      }
      popoverProps={{
        // Fixed panel width so item names aren't clipped by a narrow trigger.
        className: "w-[280px] min-w-[280px]",
      }}
      listboxProps={{
        className: "p-0",
      }}
      scrollShadowProps={{
        className: "max-h-[248px]",
      }}
      classNames={{
        base: "text-text",
        clearButton: "hidden",
        selectorButton: "text-dim",
        popoverContent:
          "!bg-card rounded-[12px] border border-border-hi p-[5px] shadow-[0_18px_44px_rgba(0,0,0,0.7)]",
        listboxWrapper: "max-h-[248px] overflow-y-auto",
        listbox: "p-0",
      }}
      inputProps={{
        classNames: {
          inputWrapper:
            "!bg-card-hi h-auto min-h-0 rounded-[10px] border border-border px-[13px] py-[9px] shadow-none data-[hover=true]:!bg-card-hi data-[focus=true]:border-border-hi group-data-[focus=true]:border-border-hi",
          input:
            "font-sans !text-text !bg-transparent min-w-0 text-[14px] font-bold leading-none tracking-[0.3px] placeholder:!text-dim",
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
              className={`${flag(item.code)} flex-none shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]`}
              style={{ width: "1.5em", height: "1.08em" }}
            />
          }
          classNames={{
            base: "rounded-[8px] px-[9px] py-[8px] text-text data-[hover=true]:bg-card-hi data-[selectable=true]:focus:bg-card-hi data-[selected=true]:bg-card-hi data-[selected=true]:shadow-[inset_2px_0_0_var(--accent)]",
          }}
        >
          <span className="flex items-center gap-[11px]">
            <span className="w-10 flex-none font-sans text-[13.5px] font-bold text-text">
              {item.code}
            </span>
            <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[12.5px] text-mid">
              {item.name}
            </span>
          </span>
        </AutocompleteItem>
      )}
    </Autocomplete>
  );
}
