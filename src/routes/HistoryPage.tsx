import { LoaderData, apiURL } from "./ConversionPage";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useEffect, useState } from "react";
import axios, { AxiosResponse } from "axios";
import { useLoaderData, useSearchParams } from "react-router-dom";
import CurrencyPicker from "../components/CurrencyPicker";
import { Chg, Rule } from "../components/Broadsheet";
import { fmtRate } from "../utils/format";

interface HistoryResponse {
  amount: number;
  base: string;
  start_date: Date;
  end_date: Date;
  rates: { [key: string]: Rate };
}

interface Rate {
  [key: string]: number;
}

interface DataObject {
  Date: string;
  Rate: number;
}

const RANGES = ["1W", "1M", "1Y", "5Y", "10Y", "All"];
const RANGE_WORD: { [key: string]: string } = {
  "1W": "week",
  "1M": "month",
  "1Y": "year",
  "5Y": "five years",
  "10Y": "decade",
  All: "record",
};

function setDateForRange(
  range: string,
  dates: ReturnType<typeof getEarlierDates>,
): string {
  switch (range) {
    case "1W":
      return dates.oneWeek;
    case "1M":
      return dates.oneMonth;
    case "1Y":
      return dates.oneYear;
    case "5Y":
      return dates.fiveYears;
    case "10Y":
      return dates.tenYears;
    case "All":
      return "1999-01-04";
    default:
      return dates.oneMonth;
  }
}

function getEarlierDates() {
  const now: Date = new Date();

  // 1 week earlier
  const oneWeekEarlier: Date = new Date(now);
  oneWeekEarlier.setDate(oneWeekEarlier.getDate() - 7);

  // 1 month earlier
  const oneMonthEarlier: Date = new Date(now);
  oneMonthEarlier.setMonth(oneMonthEarlier.getMonth() - 1);

  // 1 year earlier
  const oneYearEarlier: Date = new Date(now);
  oneYearEarlier.setFullYear(oneYearEarlier.getFullYear() - 1);

  // 5 years earlier
  const fiveYearsEarlier: Date = new Date(now);
  fiveYearsEarlier.setFullYear(fiveYearsEarlier.getFullYear() - 5);

  // 10 years earlier
  const tenYearsEarlier: Date = new Date(now);
  tenYearsEarlier.setFullYear(tenYearsEarlier.getFullYear() - 10);

  const oneWeek = oneWeekEarlier
    .toLocaleString("lt", {
      dateStyle: "short",
    })
    .replace(/\//g, "-");
  const oneMonth = oneMonthEarlier
    .toLocaleString("lt", {
      dateStyle: "short",
    })
    .replace(/\//g, "-");
  const oneYear = oneYearEarlier
    .toLocaleString("lt", {
      dateStyle: "short",
    })
    .replace(/\//g, "-");
  const fiveYears = fiveYearsEarlier
    .toLocaleString("lt", {
      dateStyle: "short",
    })
    .replace(/\//g, "-");
  const tenYears = tenYearsEarlier
    .toLocaleString("lt", {
      dateStyle: "short",
    })
    .replace(/\//g, "-");
  return { oneWeek, oneMonth, oneYear, fiveYears, tenYears };
}

export default function HistoryPage() {
  const { currencyOptions, currencyNames } = useLoaderData() as LoaderData;
  const [fromCurrency, setFromCurrency] = useState("EUR");
  const [toCurrency, setToCurrency] = useState("USD");
  const [historyData, setHistoryData] = useState<DataObject[]>([]);
  const [date, setDate] = useState("");
  const [selectedRange, setSelectedRange] = useState("");
  const [, setSelectedFrom] = useState("8");
  const [, setSelectedTo] = useState("29");
  const [searchParams, setSearchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isLoading) {
      let { oneMonth } = getEarlierDates();
      setDate(oneMonth);

      const localSelectedFromCurrency = localStorage.getItem(
        "selectedFromCurrency",
      );
      const localSelectedToCurrency =
        localStorage.getItem("selectedToCurrency");
      const localFromCurrency = localStorage.getItem("fromCurrency");
      const localToCurrency = localStorage.getItem("toCurrency");

      localSelectedFromCurrency && setSelectedFrom(localSelectedFromCurrency);
      localSelectedToCurrency && setSelectedTo(localSelectedToCurrency);
      localFromCurrency && setFromCurrency(localFromCurrency);
      localToCurrency && setToCurrency(localToCurrency);

      if (searchParams.has("from")) {
        setSelectedFrom(searchParams.get("from") as string);
        const from = parseInt(searchParams.get("from") as string);
        setFromCurrency(currencyOptions[from]);
      }
      if (searchParams.has("to")) {
        setSelectedTo(searchParams.get("to") as string);
        const to = parseInt(searchParams.get("to") as string);
        setToCurrency(currencyOptions[to]);
      }
      if (searchParams.has("range")) {
        setSelectedRange(searchParams.get("range") as string);
        const { oneWeek, oneMonth, oneYear, fiveYears, tenYears } =
          getEarlierDates();
        switch (searchParams.get("range") as string) {
          case "1W":
            setDate(oneWeek);
            break;
          case "1M":
            setDate(oneMonth);
            break;
          case "1Y":
            setDate(oneYear);
            break;
          case "5Y":
            setDate(fiveYears);
            break;
          case "10Y":
            setDate(tenYears);
            break;
          case "All":
            setDate("1999-01-04");
            break;
          default:
            break;
        }
      }
    }

    async function getHistory() {
      try {
        const response = await axios.get(
          apiURL + `/${date}..?from=${fromCurrency}&to=${toCurrency}`,
        );
        const newData: DataObject[] = convertData(response);
        setHistoryData(newData);
        setIsLoading(false);
        selectedRange === "" && setSelectedRange("1M");
      } catch (error) {}
    }
    getHistory();
  }, [fromCurrency, toCurrency, date]);

  function convertData(response: AxiosResponse): DataObject[] {
    const newData: DataObject[] = [];
    const responseData: HistoryResponse = response.data;
    const rates = responseData.rates;

    for (const [key] of Object.entries(rates)) {
      const dataPoint = [];
      const datePair = [];
      const ratePair = [];
      datePair.push("Date");
      datePair.push(key);
      ratePair.push("Rate");
      ratePair.push(rates[key][toCurrency]);
      dataPoint.push(datePair, ratePair);
      const dataObject: DataObject = Object.fromEntries(dataPoint);
      newData.push(dataObject);
    }
    return newData;
  }

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

  function selectRange(r: string) {
    setDate(setDateForRange(r, getEarlierDates()));
    setSelectedRange(r);
    setSearchParams((searchParams) => {
      searchParams.set("range", r);
      return searchParams;
    });
  }

  const rates = historyData.map((d) => d.Rate);
  const hasData = rates.length > 0;
  const cur = hasData ? rates[rates.length - 1] : 0;
  const first = hasData ? rates[0] : 0;
  const pct = first ? ((cur - first) / first) * 100 : 0;
  const hi = hasData ? Math.max(...rates) : 0;
  const lo = hasData ? Math.min(...rates) : 0;
  const avg = hasData ? rates.reduce((a, b) => a + b, 0) / rates.length : 0;
  const ticks = hasData
    ? [
        historyData[0],
        historyData[Math.floor(historyData.length / 2)],
        historyData[historyData.length - 1],
      ]
    : [];
  const rangeWord = RANGE_WORD[selectedRange] ?? "month";
  const verb = pct >= 0 ? "strengthened" : "softened";
  const fromName = (
    currencyNames[currencyOptions.indexOf(fromCurrency)] ?? fromCurrency
  ).toLowerCase();
  const toName = (
    currencyNames[currencyOptions.indexOf(toCurrency)] ?? toCurrency
  ).toLowerCase();

  return (
    <div className="bs-view pt-[24px]">
      <div className="mb-[18px] flex [gap:clamp(14px,5vw,30px)]">
        <div className="min-w-0 flex-1">
          <CurrencyPicker
            aria-label="History from currency"
            variant="code"
            currencyOptions={currencyOptions}
            currencyNames={currencyNames}
            value={fromCurrency}
            excludeCode={toCurrency}
            onSelectionChange={handleChangeFromCurrency}
          />
        </div>
        <div className="flex flex-none items-center text-faint">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          >
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <CurrencyPicker
            aria-label="History to currency"
            variant="code"
            currencyOptions={currencyOptions}
            currencyNames={currencyNames}
            value={toCurrency}
            excludeCode={fromCurrency}
            onSelectionChange={handleChangeToCurrency}
          />
        </div>
      </div>

      <div className="mb-[12px] flex items-end justify-between gap-[14px]">
        <div>
          <div className="smallcap mb-[3px]">
            {toCurrency} per 1 {fromCurrency}
          </div>
          <div className="serif [font-size:clamp(40px,12vw,56px)] [line-height:0.9]">
            {fmtRate(cur)}
          </div>
        </div>
        <div className="text-right">
          <Chg value={pct} size={16} />
          <div className="smallcap mt-1 font-semibold text-muted">
            past {selectedRange}
          </div>
        </div>
      </div>

      <div className="serif mb-[14px] italic leading-[1.3] text-muted [font-size:clamp(15px,4.3vw,18px)]">
        The {fromName} has {verb} {Math.abs(pct).toFixed(2)}% against the{" "}
        {toName} over the past {rangeWord}.
      </div>

      <Rule variant="hair" />

      <div
        className="my-2 [height:clamp(180px,42vw,248px)]"
        style={{ width: "100%" }}
      >
        {!isLoading && hasData && (
          <ResponsiveContainer>
            <AreaChart data={historyData} margin={{ left: 6, right: 6, top: 8 }}>
              <CartesianGrid
                stroke="var(--hair)"
                vertical={false}
                strokeWidth={1}
              />
              <XAxis dataKey="Date" hide />
              <YAxis type="number" domain={["auto", "auto"]} hide />
              <Tooltip
                cursor={false}
                contentStyle={{
                  backgroundColor: "var(--paper)",
                  border: "1px solid var(--ink)",
                  borderRadius: 0,
                  boxShadow: "5px 7px 0 var(--shadow)",
                }}
                labelStyle={{ color: "var(--muted)" }}
                itemStyle={{ color: "var(--ink)" }}
                formatter={(value: number) => [fmtRate(value), toCurrency]}
              />
              <Area
                type="linear"
                dataKey="Rate"
                stroke="var(--accent)"
                strokeWidth={2.2}
                strokeLinejoin="round"
                fill="var(--accent-soft)"
                fillOpacity={1}
                isAnimationActive={false}
                dot={(props: { cx?: number; cy?: number; index?: number }) => {
                  const isLast = props.index === historyData.length - 1;
                  return (
                    <circle
                      key={props.index}
                      cx={props.cx}
                      cy={props.cy}
                      r={isLast ? 4 : 0}
                      fill="var(--accent)"
                      stroke="none"
                    />
                  );
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="flex justify-between">
        {ticks.map((t, i) => (
          <span
            key={i}
            className="smallcap whitespace-nowrap font-semibold !text-[10px] text-faint"
          >
            {t.Date}
          </span>
        ))}
      </div>

      <Rule variant="hair" className="mt-2" />

      <div className="my-4 flex flex-wrap justify-center gap-x-1 gap-y-[6px]">
        {RANGES.map((r, i) => (
          <span key={r} className="flex items-center">
            <button
              type="button"
              className="bs-range"
              data-on={r === selectedRange ? 1 : 0}
              onClick={() => selectRange(r)}
            >
              {r}
            </button>
            {i < RANGES.length - 1 && (
              <span className="self-center text-hair">·</span>
            )}
          </span>
        ))}
      </div>

      <Rule variant="hair" className="mb-[14px]" />

      <div className="flex justify-between gap-3">
        {([
          ["High", hi],
          ["Low", lo],
          ["Average", avg],
        ] as [string, number][]).map(([label, value]) => (
          <div key={label} className="flex-1 text-center">
            <div className="smallcap mb-[5px]">{label}</div>
            <div className="serif [font-size:clamp(20px,6vw,26px)]">
              {fmtRate(value)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
