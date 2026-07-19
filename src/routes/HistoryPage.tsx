import { LoaderData, apiURL } from "./ConversionPage";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useEffect, useState } from "react";
import axios, { AxiosResponse } from "axios";
import { useLoaderData, useSearchParams } from "react-router-dom";
import CurrencyPicker from "../components/CurrencyPicker";
import { Chg } from "../components/Signal";
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
  const startDate = hasData ? historyData[0].Date : "";
  const endDate = hasData ? historyData[historyData.length - 1].Date : "";

  return (
    <div className="signal-view">
      {/* Pair pickers */}
      <div className="flex items-center gap-[10px]">
        <div className="min-w-0 flex-1 lg:max-w-[220px]">
          <CurrencyPicker
            aria-label="History from currency"
            currencyOptions={currencyOptions}
            currencyNames={currencyNames}
            value={fromCurrency}
            excludeCode={toCurrency}
            onSelectionChange={handleChangeFromCurrency}
          />
        </div>
        <span className="mono flex-none text-accent">⇄</span>
        <div className="min-w-0 flex-1 lg:max-w-[220px]">
          <CurrencyPicker
            aria-label="History to currency"
            currencyOptions={currencyOptions}
            currencyNames={currencyNames}
            value={toCurrency}
            excludeCode={fromCurrency}
            onSelectionChange={handleChangeToCurrency}
          />
        </div>
        <span className="micro ml-auto flex-none whitespace-nowrap">
          past {selectedRange}
        </span>
      </div>

      {/* Big rate + change */}
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="tnum text-[42px] font-bold leading-none tracking-[-1.4px] text-text">
          {fmtRate(cur)}{" "}
          <span className="text-[16px] font-semibold text-mid">
            {toCurrency}
          </span>
        </span>
        <Chg value={pct} size={14} />
      </div>

      {/* Chart card */}
      <div className="signal-card px-[16px] pb-[12px] pt-[16px]">
        <div className="h-[190px] w-full lg:h-[300px]">
          {!isLoading && hasData && (
            <ResponsiveContainer>
              <AreaChart
                data={historyData}
                margin={{ left: 2, right: 2, top: 12, bottom: 4 }}
              >
                <defs>
                  <linearGradient id="signalFill" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor="var(--accent)"
                      stopOpacity={0.26}
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--accent)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <XAxis dataKey="Date" hide />
                <YAxis type="number" domain={["auto", "auto"]} hide />
                <Tooltip
                  cursor={false}
                  contentStyle={{
                    backgroundColor: "var(--card-hi)",
                    border: "1px solid var(--border-hi)",
                    borderRadius: 10,
                    boxShadow: "0 12px 28px rgba(0,0,0,0.6)",
                  }}
                  labelStyle={{ color: "var(--dim)" }}
                  itemStyle={{ color: "var(--text)" }}
                  formatter={(value: number) => [fmtRate(value), toCurrency]}
                />
                <Area
                  type="linear"
                  dataKey="Rate"
                  stroke="var(--accent)"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="url(#signalFill)"
                  fillOpacity={1}
                  isAnimationActive={false}
                  style={{ filter: "drop-shadow(0 0 6px rgba(244,178,62,0.5))" }}
                  dot={(props: { cx?: number; cy?: number; index?: number }) => {
                    const isLast = props.index === historyData.length - 1;
                    return (
                      <circle
                        key={props.index}
                        cx={props.cx}
                        cy={props.cy}
                        r={isLast ? 3.4 : 0}
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

        {/* Range buttons */}
        <div className="mt-3 flex gap-[7px]">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              className="signal-range"
              data-on={r === selectedRange ? 1 : 0}
              onClick={() => selectRange(r)}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="flex gap-3">
        {(
          [
            ["Range high", hi],
            ["Range low", lo],
            ["Open", first],
          ] as [string, number][]
        ).map(([label, value]) => (
          <div key={label} className="signal-card flex-1 px-[14px] py-[12px]">
            <div className="micro">{label}</div>
            <div className="mono mt-[5px] text-[15px] text-text">
              {fmtRate(value)}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mono text-center text-[11.5px] text-dim">
        {startDate} → {endDate} · mid-market
      </div>
    </div>
  );
}
