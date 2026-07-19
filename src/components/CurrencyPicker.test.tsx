import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Currency } from "../api/frankfurter";
import CurrencyPicker from "./CurrencyPicker";

const currencies: Currency[] = [
  { code: "EUR", name: "Euro", symbol: "€", startDate: "1999-01-04" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥", startDate: "1948-01-01" },
  { code: "USD", name: "US Dollar", symbol: "$", startDate: "1948-01-01" },
];

describe("CurrencyPicker", () => {
  it("filters by currency name and returns a stable code", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <CurrencyPicker currencies={currencies} value="EUR" onChange={onChange} aria-label="Test currency" />,
    );

    const input = screen.getByRole("combobox", { name: "Test currency" });
    await user.click(input);
    await user.clear(input);
    await user.type(input, "Japanese");
    await user.click(await screen.findByRole("option", { name: /JPY Japanese Yen/ }));
    expect(onChange).toHaveBeenCalledWith("JPY");
  });
});
