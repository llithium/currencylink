import getSymbolFromCurrency from "currency-symbol-map";
import axios from "axios";
import { useLoaderData, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import pluralizeCurrencyName from "../utils/pluralizeCurrencyName";
import CurrencyPicker from "../components/CurrencyPicker";
import { Chg, Rule } from "../components/Broadsheet";
import { fmtMoney, fmtRate, numberToWords } from "../utils/format";

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
  const [change, setChange] = useState(0);

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

          // Derive the 24h change from the two most recent business days.
          const history = await axios.get(
            apiURL +
              `/${isoDaysAgo(7)}..?from=${fromCurrency}&to=${toCurrency}`,
          );
          const series = Object.entries(
            history.data.rates as { [date: string]: { [code: string]: number } },
          )
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([, r]) => r[toCurrency]);
          if (series.length >= 2) {
            const prev = series[series.length - 2];
            const last = series[series.length - 1];
            setChange(((last - prev) / prev) * 100);
          } else {
            setChange(0);
          }
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
  const totalCents = Math.round(result * 100);
  const intPart = Math.floor(totalCents / 100);
  const cents = totalCents % 100;
  const inv = exchangeRate ? 1 / exchangeRate : 0;
  const toName = currencyNames[currencyOptions.indexOf(toCurrency)] ?? toCurrency;

  return (
    <div className="bs-view pt-[26px]">
      <div className="smallcap mb-[10px]">You convert</div>
      <div className="flex items-baseline gap-[10px]">
        <span
          className="serif leading-none text-muted [font-size:clamp(34px,10vw,46px)]"
        >
          {getSymbolFromCurrency(fromCurrency)}
        </span>
        <input
          className="bs-amount-input min-w-0 flex-1 [font-size:clamp(40px,13vw,58px)]"
          inputMode="decimal"
          placeholder="0"
          aria-label="Amount to convert"
          value={
            amount
              ? amount.toLocaleString("fullwide", { useGrouping: false })
              : ""
          }
          onChange={(e) => {
            const value = e.target.value.replace(/[^\d.]/g, "");
            const parsed = parseFloat(value);
            setAmount(isNaN(parsed) ? 0 : parsed);
            setSearchParams((searchParams) => {
              searchParams.set("amount", value);
              return searchParams;
            });
            localStorage.setItem("amount", value);
          }}
        />
      </div>

      <div className="mt-[10px] max-w-[360px]">
        <CurrencyPicker
          aria-label="Convert from currency"
          variant="hero"
          currencyOptions={currencyOptions}
          currencyNames={currencyNames}
          value={fromCurrency}
          excludeCode={toCurrency}
          onSelectionChange={handleChangeFromCurrency}
        />
      </div>

      <div className="my-[26px] flex items-center gap-4">
        <div className="h-px flex-1 bg-hair" />
        <button
          type="button"
          className="bs-iconbtn h-10 w-10"
          title="Swap currencies"
          aria-label="Swap currencies"
          onClick={swapCurrencies}
        >
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M7 4v16M7 20l-3-3M7 4l3 3M17 20V4M17 4l3 3M17 4l-3 3" />
          </svg>
        </button>
        <div className="h-px flex-1 bg-hair" />
      </div>

      <div className="smallcap mb-[10px]">You receive</div>
      <div className="flex items-baseline gap-2">
        <span className="serif leading-none text-accent [font-size:clamp(38px,11vw,52px)]">
          {getSymbolFromCurrency(toCurrency)}
        </span>
        <span className="serif text-ink [font-size:clamp(50px,17vw,76px)] [letter-spacing:-0.5px] [line-height:0.92]">
          {fmtMoney(result)}
        </span>
      </div>

      <div className="mt-[10px] max-w-[360px]">
        <CurrencyPicker
          aria-label="Convert to currency"
          variant="hero"
          currencyOptions={currencyOptions}
          currencyNames={currencyNames}
          value={toCurrency}
          excludeCode={fromCurrency}
          onSelectionChange={handleChangeToCurrency}
        />
      </div>

      <div className="serif mt-[18px] italic leading-[1.3] text-muted [font-size:clamp(16px,4.5vw,19px)]">
        {numberToWords(intPart)}{" "}
        {pluralizeCurrencyName(toName, intPart).toLowerCase()} and{" "}
        {cents.toString().padStart(2, "0")}/100.
      </div>

      <div className="mt-[28px]">
        <Rule variant="hair" />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-[10px] pt-[14px]">
        <span className="serif text-ink [font-size:clamp(18px,5vw,22px)]">
          1 {fromCurrency} = {fmtRate(exchangeRate)} {toCurrency}
        </span>
        <div className="flex items-center gap-4">
          <span className="smallcap font-semibold text-faint">
            1 {toCurrency} = {fmtRate(inv)} {fromCurrency}
          </span>
          <Chg value={change} size={13} />
        </div>
      </div>
    </div>
  );
}
