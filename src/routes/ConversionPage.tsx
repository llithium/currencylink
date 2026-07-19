import axios from "axios";
import { useLoaderData, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import CurrencyPicker from "../components/CurrencyPicker";
import { fmtCurrency, fmtRate } from "../utils/format";

/** ISO date (YYYY-MM-DD) for `days` days ago — used for short history fetches. */
export function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export const apiURL = "https://api.frankfurter.dev/v1";

export async function ConversionPageLoader() {
  try {
    const response = await axios.get(apiURL + "/latest");
    const currencyOptionsResponse = await axios.get(apiURL + "/currencies");
    const currencyOptions = Object.keys(currencyOptionsResponse.data);
    const currencyNames: string[] = Object.values(currencyOptionsResponse.data);
    const data = response.data;

    return {
      data,
      currencyOptions,
      currencyNames,
    };
  } catch (error) {
    console.log(error);
  }
}

export interface ResponseData {
  amount: number;
  base: string;
  date: Date;
  rates: { [key: string]: number };
}

export interface LoaderData {
  data: ResponseData;
  currencyOptions: string[];
  currencyNames: string[];
}

export default function ConversionPage() {
  const { data, currencyOptions, currencyNames } =
    useLoaderData() as LoaderData;
  const [fromCurrency, setFromCurrency] = useState("EUR");
  const [toCurrency, setToCurrency] = useState("USD");
  const [, setSelectedFrom] = useState("8");
  const [, setSelectedTo] = useState("29");
  const [searchParams, setSearchParams] = useSearchParams();
  const [amount, setAmount] = useState(1);
  const [exchangeRate, setExchangeRate] = useState(
    Object.values(data.rates)[28],
  );

  useEffect(() => {
    const localSelectedFromCurrency = localStorage.getItem(
      "selectedFromCurrency",
    );
    const localSelectedToCurrency = localStorage.getItem("selectedToCurrency");
    const localFromCurrency = localStorage.getItem("fromCurrency");
    const localToCurrency = localStorage.getItem("toCurrency");
    const localAmount = localStorage.getItem("amount");

    if (searchParams.has("from")) {
      setSelectedFrom(searchParams.get("from") as string);
      const from = parseInt(searchParams.get("from") as string);
      setFromCurrency(currencyOptions[from]);
    } else {
      localSelectedFromCurrency && setSelectedFrom(localSelectedFromCurrency);
      localFromCurrency && setFromCurrency(localFromCurrency);
    }
    if (searchParams.has("to")) {
      setSelectedTo(searchParams.get("to") as string);
      const to = parseInt(searchParams.get("to") as string);
      setToCurrency(currencyOptions[to]);
    } else {
      localSelectedToCurrency && setSelectedTo(localSelectedToCurrency);
      localToCurrency && setToCurrency(localToCurrency);
    }
    if (searchParams.has("amount")) {
      setAmount(parseFloat(searchParams.get("amount") as string));
    } else {
      localAmount && setAmount(parseFloat(localAmount));
    }
  }, []);

  useEffect(() => {
    if (fromCurrency != null && toCurrency != null) {
      async function setExchange() {
        try {
          const response = await axios.get(
            apiURL + `/latest?from=${fromCurrency}&to=${toCurrency}`,
          );
          const data: ResponseData = response.data;

          setExchangeRate(Object.values(data.rates)[0]);
        } catch (error) {
          console.log(error);
        }
      }
      setExchange();
    }
  }, [fromCurrency, toCurrency]);

  function handleChangeFromCurrency<Selection>(key: Selection): any {
    const newKey = key as string;
    const value = currencyOptions[parseFloat(newKey)];

    if (value) {
      if (value !== toCurrency) {
        setFromCurrency(value);
        localStorage.setItem("fromCurrency", value);
        setSearchParams((searchParams) => {
          searchParams.set("from", newKey);
          return searchParams;
        });
        setSelectedFrom(newKey);
        localStorage.setItem("selectedFromCurrency", newKey);
      } else {
        setToCurrency(fromCurrency);
        setSearchParams((searchParams) => {
          searchParams.set(
            "to",
            currencyOptions.indexOf(fromCurrency).toString(),
          );
          return searchParams;
        });
        localStorage.setItem("toCurrency", fromCurrency);
        setSelectedTo(currencyOptions.indexOf(fromCurrency).toString());
        localStorage.setItem(
          "selectedToCurrency",
          currencyOptions.indexOf(fromCurrency).toString(),
        );

        setFromCurrency(toCurrency);
        setSearchParams((searchParams) => {
          searchParams.set(
            "from",
            currencyOptions.indexOf(toCurrency).toString(),
          );
          return searchParams;
        });
        localStorage.setItem("fromCurrency", toCurrency);
        setSelectedFrom(currencyOptions.indexOf(toCurrency).toString());
        localStorage.setItem(
          "selectedFromCurrency",
          currencyOptions.indexOf(toCurrency).toString(),
        );
      }
    } else {
    }
  }

  function handleChangeToCurrency<Selection>(key: Selection): any {
    const newKey = key as string;
    const value = currencyOptions[parseInt(newKey)];
    console.log();

    if (value) {
      if (value !== fromCurrency) {
        setToCurrency(value);
        setSearchParams((searchParams) => {
          searchParams.set("to", newKey);
          return searchParams;
        });
        localStorage.setItem("toCurrency", value);
        setSelectedTo(newKey);
        localStorage.setItem("selectedToCurrency", newKey);
      } else {
        setToCurrency(fromCurrency);

        setSelectedTo(currencyOptions.indexOf(fromCurrency).toString());
        setSearchParams((searchParams) => {
          searchParams.set(
            "to",
            currencyOptions.indexOf(fromCurrency).toString(),
          );
          return searchParams;
        });
        localStorage.setItem(
          "selectedToCurrency",
          currencyOptions.indexOf(fromCurrency).toString(),
        );
        setFromCurrency(toCurrency);
        setSearchParams((searchParams) => {
          searchParams.set(
            "from",
            currencyOptions.indexOf(toCurrency).toString(),
          );
          return searchParams;
        });
        localStorage.setItem("fromCurrency", toCurrency);
        setSelectedFrom(currencyOptions.indexOf(toCurrency).toString());
        localStorage.setItem(
          "selectedFromCurrency",
          currencyOptions.indexOf(toCurrency).toString(),
        );
      }
    } else {
    }
  }

  function swapCurrencies() {
    setToCurrency(fromCurrency);
    setSearchParams((searchParams) => {
      searchParams.set("to", currencyOptions.indexOf(fromCurrency).toString());
      return searchParams;
    });
    localStorage.setItem("toCurrency", fromCurrency);
    setSelectedTo(currencyOptions.indexOf(fromCurrency).toString());
    localStorage.setItem(
      "selectedToCurrency",
      currencyOptions.indexOf(fromCurrency).toString(),
    );

    setFromCurrency(toCurrency);
    setSearchParams((searchParams) => {
      searchParams.set("from", currencyOptions.indexOf(toCurrency).toString());
      return searchParams;
    });
    localStorage.setItem("fromCurrency", toCurrency);
    setSelectedFrom(currencyOptions.indexOf(toCurrency).toString());
    localStorage.setItem(
      "selectedFromCurrency",
      currencyOptions.indexOf(toCurrency).toString(),
    );
  }

  const result = (amount || 0) * exchangeRate;
  const inv = exchangeRate ? 1 / exchangeRate : 0;

  function setAmountValue(value: string) {
    const parsed = parseFloat(value);
    setAmount(isNaN(parsed) ? 0 : parsed);
    setSearchParams((searchParams) => {
      searchParams.set("amount", value);
      return searchParams;
    });
    localStorage.setItem("amount", value);
  }

  const QUICK = [100, 500, 1000, 5000, 10000];

  return (
    <div className="signal-view">
      <div className="relative flex flex-col gap-3 lg:grid lg:grid-cols-2 lg:gap-[72px]">
        {/* Amount card */}
        <div className="signal-card px-[19px] py-[17px]">
          <div className="mb-[9px] flex items-center justify-between gap-3">
            <span className="micro">Amount</span>
            <CurrencyPicker
              aria-label="Convert from currency"
              currencyOptions={currencyOptions}
              currencyNames={currencyNames}
              value={fromCurrency}
              excludeCode={toCurrency}
              onSelectionChange={handleChangeFromCurrency}
            />
          </div>
          <input
            className="signal-input tnum w-full text-[44px] font-bold leading-none tracking-[-1.2px]"
            inputMode="decimal"
            placeholder="0"
            aria-label="Amount to convert"
            value={
              amount
                ? amount.toLocaleString("fullwide", { useGrouping: false })
                : ""
            }
            onChange={(e) =>
              setAmountValue(e.target.value.replace(/[^\d.]/g, ""))
            }
          />
        </div>

        {/* Swap — floats between the cards: below/above on mobile, left/right on desktop */}
        <div className="-my-[21px] flex justify-center lg:absolute lg:left-1/2 lg:top-1/2 lg:my-0 lg:-translate-x-1/2 lg:-translate-y-1/2">
          <button
            type="button"
            className="signal-swap"
            title="Swap currencies"
            aria-label="Swap currencies"
            onClick={swapCurrencies}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 14 14"
              fill="none"
              className="lg:rotate-90"
            >
              <path
                d="M4.5 1v9M4.5 10L2 7.5M4.5 10L7 7.5M9.5 13V4M9.5 4L7 6.5M9.5 4L12 6.5"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Converted card */}
        <div
          className="signal-card px-[19px] py-[17px]"
          style={{
            borderColor: "var(--border-hi)",
            background:
              "linear-gradient(180deg, rgba(244,178,62,0.06), rgba(244,178,62,0) 60%), var(--card)",
          }}
        >
          <div className="mb-[9px] flex items-center justify-between gap-3">
            <span className="micro">Converted</span>
            <CurrencyPicker
              aria-label="Convert to currency"
              currencyOptions={currencyOptions}
              currencyNames={currencyNames}
              value={toCurrency}
              excludeCode={fromCurrency}
              onSelectionChange={handleChangeToCurrency}
            />
          </div>
          <div
            className="tnum text-[48px] font-bold leading-[1.05] text-accent [overflow-wrap:anywhere]"
            style={{
              letterSpacing: "-1.6px",
              textShadow: "0 0 26px rgba(244,178,62,0.35)",
            }}
          >
            {fmtCurrency(result, toCurrency)}
          </div>
          <div className="mono mt-[10px] text-[12px] text-mid">
            1 {fromCurrency} = {fmtRate(exchangeRate)} {toCurrency} · 1{" "}
            {toCurrency} = {fmtRate(inv)} {fromCurrency}
          </div>
        </div>
      </div>

      {/* Quick amounts */}
      <div className="flex gap-2">
        {QUICK.map((a) => (
          <button
            key={a}
            type="button"
            className="signal-chip"
            onClick={() => setAmountValue(String(a))}
          >
            {a >= 1000 ? `${a / 1000}K` : a}
          </button>
        ))}
      </div>
    </div>
  );
}
