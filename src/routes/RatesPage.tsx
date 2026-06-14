import { useEffect, useState } from "react";
import { LoaderData, apiURL, isoDaysAgo } from "./ConversionPage";
import axios from "axios";
import { useLoaderData, useSearchParams } from "react-router-dom";
import { currencyFlags } from "../utils/currencyFlags";
import CurrencyPicker from "../components/CurrencyPicker";
import { Chg, Rule, Sparkline } from "../components/Broadsheet";
import { fmtRate } from "../utils/format";

interface RateRow {
  code: string;
  name: string;
  rate: number;
  change: number;
  series: number[];
}

const GRID = "grid grid-cols-[1fr_64px_auto_70px] items-center gap-x-4";

export default function RatesPage() {
  const { currencyOptions, currencyNames } = useLoaderData() as LoaderData;
  const [base, setBase] = useState("USD");
  const [rows, setRows] = useState<RateRow[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const localFromCurrency = localStorage.getItem("fromCurrency");
    localFromCurrency && setBase(localFromCurrency);
    if (searchParams.has("from")) {
      const from = parseInt(searchParams.get("from") as string);
      if (currencyOptions[from]) setBase(currencyOptions[from]);
    }
  }, []);

  useEffect(() => {
    async function setRates() {
      try {
        const response = await axios.get(
          apiURL + `/${isoDaysAgo(30)}..?from=${base}`,
        );
        const byDate = response.data.rates as {
          [date: string]: { [code: string]: number };
        };
        const dates = Object.keys(byDate).sort((a, b) => a.localeCompare(b));
        if (dates.length === 0) {
          setRows([]);
          return;
        }
        const latest = byDate[dates[dates.length - 1]];
        const nextRows: RateRow[] = Object.keys(latest)
          .sort((a, b) => a.localeCompare(b))
          .map((code) => {
            const series = dates
              .map((d) => byDate[d][code])
              .filter((v): v is number => typeof v === "number");
            const last = series[series.length - 1];
            const prev = series.length >= 2 ? series[series.length - 2] : last;
            const idx = currencyOptions.indexOf(code);
            return {
              code,
              name: idx >= 0 ? currencyNames[idx] : code,
              rate: latest[code],
              change: prev ? ((last - prev) / prev) * 100 : 0,
              series,
            };
          });
        setRows(nextRows);
      } catch (error) {
        console.log(error);
      }
    }
    setRates();
  }, [base]);

  function handleChangeBase(key: string) {
    const value = currencyOptions[parseInt(key)];
    if (!value) return;
    setBase(value);
    localStorage.setItem("fromCurrency", value);
    localStorage.setItem("selectedFromCurrency", key);
    setSearchParams((searchParams) => {
      searchParams.set("from", key);
      return searchParams;
    });
  }

  return (
    <div className="bs-view pt-[24px]">
      <div className="mb-[14px] flex items-end justify-between gap-[14px]">
        <h2 className="serif m-0 whitespace-nowrap font-normal leading-none [font-size:clamp(28px,7vw,38px)]">
          Exchange Table
        </h2>
        <div className="w-[130px] flex-none">
          <CurrencyPicker
            aria-label="Base currency"
            variant="code"
            currencyOptions={currencyOptions}
            currencyNames={currencyNames}
            value={base}
            onSelectionChange={handleChangeBase}
          />
        </div>
      </div>

      <div className={`${GRID} pb-[7px]`}>
        <span className="smallcap">Currency · per 1 {base}</span>
        <span className="smallcap text-right">30d</span>
        <span className="smallcap text-right">Rate</span>
        <span className="smallcap text-right">24h</span>
      </div>
      <Rule />

      {rows.map((row) => (
        <div key={row.code}>
          <div className={`${GRID} py-[11px]`}>
            <span className="flex min-w-0 items-center gap-3">
              <span
                className={`fi ${currencyFlags[row.code] ?? ""} flex-none shadow-[inset_0_0_0_1px_rgba(0,0,0,0.14)]`}
                style={{ width: 23, height: 17 }}
              />
              <span className="serif overflow-hidden text-ellipsis whitespace-nowrap [font-size:clamp(17px,5vw,21px)]">
                {row.name}
              </span>
            </span>
            <span className="flex justify-end">
              <Sparkline data={row.series} />
            </span>
            <span className="serif whitespace-nowrap text-right [font-size:clamp(19px,5.5vw,23px)]">
              {fmtRate(row.rate)}
            </span>
            <span className="text-right">
              <Chg value={row.change} size={11.5} />
            </span>
          </div>
          <Rule variant="hair" />
        </div>
      ))}

      <div className="smallcap mt-4 text-center font-semibold !tracking-[1px] text-faint">
        Rates supplied by the European Central Bank
      </div>
    </div>
  );
}
