import {
  Autocomplete,
  AutocompleteItem,
  Button,
  Input,
} from "@nextui-org/react";
import getSymbolFromCurrency from "currency-symbol-map";
import axios from "axios";
import { useLoaderData, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import pluralizeCurrencyName from "../utils/pluralizeCurrencyName";
import { currencyFlags } from "../utils/currencyFlags";

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
  const [selectedFrom, setSelectedFrom] = useState("8");
  const [selectedTo, setSelectedTo] = useState("29");
  const [searchParams, setSearchParams] = useSearchParams();
  const [amount, setAmount] = useState(1);
  const [exchangeRate, setExchangeRate] = useState(
    Object.values(data.rates)[28],
  );
  const [toAmount, setToAmount] = useState<number>(0);

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

  useEffect(() => {
    if (amount > 0) {
      setToAmount(parseFloat((amount * exchangeRate).toFixed(2)));
    } else {
      setToAmount(0);
    }
  }, [amount, exchangeRate]);

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

  return (
    <div
      id="currencyRowContainer"
      className="mx-auto w-fit xl:flex xl:flex-row"
    >
      <div className="optionContainer xl:mr-3">
        <div>
          <Autocomplete
            label="From"
            name="from"
            className="max-w-xs text-lg text-foreground"
            classNames={{
              popoverContent: "bg-zinc-900",
            }}
            startContent={
              <span
                className={`exchangeRate fi ${currencyFlags[fromCurrency]} relative rounded-sm`}
              ></span>
            }
            selectedKey={selectedFrom}
            onSelectionChange={handleChangeFromCurrency}
          >
            {currencyOptions.map((option, index) => {
              return (
                <AutocompleteItem
                  className="text-white"
                  key={index}
                  value={option + " - " + currencyNames[index]}
                  startContent={
                    <span
                      className={`fi ${currencyFlags[option]} rounded-sm`}
                    ></span>
                  }
                >
                  {option + " - " + currencyNames[index]}
                </AutocompleteItem>
              );
            })}
          </Autocomplete>
        </div>
        <Input
          className="mt-2"
          classNames={{
            inputWrapper:
              "dark:hover:bg-zinc-800/60 dark:bg-stone-950 h-14 w-80 rounded-xl dark:focus-within:bg-stone-950/60",
          }}
          startContent={<div>{getSymbolFromCurrency(fromCurrency)}</div>}
          value={
            amount
              ? amount.toLocaleString("fullwide", { useGrouping: false })
              : "0"
          }
          onValueChange={(value) => {
            setAmount(parseFloat(parseFloat(value).toFixed(2)));
            setSearchParams((searchParams) => {
              searchParams.set("amount", value);
              return searchParams;
            });
            localStorage.setItem("amount", value);
          }}
          type="number"
          min={0}
          max={999999999999999}
          placeholder="0.00"
          step={0.01}
          labelPlacement="outside"
        />
        <div className="flex w-80 justify-center">
          <p className="w-fit py-2">
            {getSymbolFromCurrency(fromCurrency)}1.00 {fromCurrency}
            {" = "}
            {getSymbolFromCurrency(toCurrency)}
            {exchangeRate} {toCurrency}
          </p>
        </div>
      </div>
      <div className="optionContainer xl:ml-3">
        <div>
          <Autocomplete
            label="To"
            name="to"
            className="max-w-xs text-lg text-foreground"
            classNames={{
              popoverContent: "bg-zinc-900",
            }}
            startContent={
              <span
                className={`exchangeRate fi ${currencyFlags[toCurrency]} relative rounded-sm`}
              ></span>
            }
            value={toCurrency}
            selectedKey={selectedTo}
            onSelectionChange={handleChangeToCurrency}
          >
            {currencyOptions.map((option, index) => {
              return (
                <AutocompleteItem
                  className="text-white"
                  key={index}
                  value={option + currencyNames[index]}
                  startContent={
                    <span
                      className={`fi ${currencyFlags[option]} rounded-sm`}
                    ></span>
                  }
                >
                  {option + " - " + currencyNames[index]}
                </AutocompleteItem>
              );
            })}
          </Autocomplete>
        </div>
        <Button
          className="mt-2 h-14 w-80 bg-pink-950"
          // color="secondary"
          variant="solid"
          onClick={() => {
            swapCurrencies();
          }}
          startContent={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
            >
              <path
                fill="currentColor"
                d="M3.586 16.5L8.5 11.586L9.914 13l-2.5 2.5H19.5v2H7.414l2.5 2.5L8.5 21.414zm.914-10h12.086l-2.5-2.5L15.5 2.586L20.414 7.5L15.5 12.414L14.086 11l2.5-2.5H4.5z"
              />
            </svg>
          }
        >
          Swap
        </Button>
        <div className="flex w-80 flex-wrap justify-center pt-2">
          <p className="w-full pb-1 opacity-70">
            {getSymbolFromCurrency(fromCurrency)}{" "}
            {amount
              ? new Intl.NumberFormat(navigator.language, {
                  currency: toCurrency,
                }).format(parseFloat(amount.toFixed(2)))
              : 0}{" "}
            {fromCurrency} =
          </p>
          <p className="text-xl font-extrabold">
            {getSymbolFromCurrency(toCurrency)}{" "}
            {new Intl.NumberFormat(navigator.language, {
              currency: toCurrency,
            }).format(parseFloat(toAmount.toFixed(2)))}{" "}
            {pluralizeCurrencyName(
              currencyNames[parseInt(selectedTo)],
              toAmount,
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
