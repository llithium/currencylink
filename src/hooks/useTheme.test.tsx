import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import ThemeToggle from "../components/ThemeToggle";
import { ThemeProvider } from "./useTheme";

describe("theme preference", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.dataset.theme = "light";
  });

  it("toggles and persists the chosen theme", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Use dark theme" }));
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(localStorage.getItem("currencylink-theme")).toBe("dark");
  });
});
