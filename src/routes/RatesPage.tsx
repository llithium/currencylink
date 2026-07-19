import { useEffect, useState } from "react";
import { LoaderData, apiURL, isoDaysAgo } from "./ConversionPage";
import axios from "axios";
import { useLoaderData, useNavigate, useSearchParams } from "react-router-dom";
import { currencyFlags } from "../utils/currencyFlags";
import CurrencyPicker from "../components/CurrencyPicker";
import { Chg, Sparkline } from "../components/Signal";
import { fmtRate } from "../utils/format";

interface RateRow {
  code: string;
  name: string;
  rate: number;
  change: number;
  series: number[];
}

export default function RatesPage() {
  const { currencyOptions, currencyNames } = useLoaderData() as LoaderData;
  const navigate = useNavigate();
  const [base, setBase] = useState("USD");
  const [rows, setRows] = useState<RateRow[]>([]);
  const [query, setQuery] = useState("");
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

  // Open History pre-set to base → clicked currency.
  function openPair(code: string) {
    const from = currencyOptions.indexOf(base);
    const to = currencyOptions.indexOf(code);
    if (from < 0 || to < 0) return;
    localStorage.setItem("fromCurrency", base);
    localStorage.setItem("toCurrency", code);
    localStorage.setItem("selectedFromCurrency", String(from));
    localStorage.setItem("selectedToCurrency", String(to));
    navigate(`/history?from=${from}&to=${to}`);
  }

  const q = query.trim().toLowerCase();
  const visible = q
    ? rows.filter((r) => `${r.code} ${r.name}`.toLowerCase().includes(q))
    : rows;

  return (
    <div className="signal-view">
      <div className="flex items-center gap-[10px]">
        <input
          className="signal-search flex-1"
          placeholder="Search currency…"
          aria-label="Search currency"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="w-[132px] flex-none">
          <CurrencyPicker
            aria-label="Base currency"
            currencyOptions={currencyOptions}
            currencyNames={currencyNames}
            value={base}
            onSelectionChange={handleChangeBase}
          />
        </div>
      </div>

      <div className="signal-card overflow-hidden">
        <div className="flex items-center border-b border-border px-[18px] py-[10px]">
          <span className="micro">1 {base} buys</span>
          <span className="micro ml-auto">30 days · 24h</span>
        </div>

        {visible.map((row) => (
          <button
            key={row.code}
            type="button"
            className="signal-row"
            onClick={() => openPair(row.code)}
          >
            <span
              className={`fi ${currencyFlags[row.code] ?? ""} flex-none shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]`}
              style={{ width: 28, height: 20, borderRadius: 4 }}
            />
            <div className="min-w-0">
              <div className="text-[14px] font-bold text-text">{row.code}</div>
              <div className="max-w-[170px] overflow-hidden text-ellipsis whitespace-nowrap text-[12px] text-dim lg:max-w-none">
                {row.name}
              </div>
            </div>
            <span className="ml-auto">
              <Sparkline data={row.series} width={60} height={22} />
            </span>
            <div className="w-[96px] text-right">
              <div className="mono text-[13px] text-text">
                {fmtRate(row.rate)}
              </div>
              <Chg value={row.change} size={11} />
            </div>
          </button>
        ))}

        {!visible.length && (
          <div className="px-[18px] py-[22px] text-[13.5px] text-dim">
            {q ? `No currency matches “${query}”.` : "Loading rates…"}
          </div>
        )}
      </div>
    </div>
  );
}
