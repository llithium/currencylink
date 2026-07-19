import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import "./index.css";
import { ThemeProvider } from "./hooks/useTheme";
import ErrorPage from "./routes/ErrorPage";
import NoMatch from "./routes/NoMatch";
import Root, { rootLoader } from "./routes/Root";

function RouteFallback() {
  return (
    <div className="route-fallback" role="status" aria-label="Loading Currency Link">
      <span className="brand-mark" aria-hidden="true" />
    </div>
  );
}

const router = createBrowserRouter([
  {
    id: "root",
    path: "/",
    element: <Root />,
    loader: rootLoader,
    errorElement: <ErrorPage />,
    hydrateFallbackElement: <RouteFallback />,
    children: [
      {
        index: true,
        lazy: () =>
          import("./routes/ConversionPage").then((module) => ({
            Component: module.default,
          })),
      },
      {
        path: "rates",
        lazy: () =>
          import("./routes/RatesPage").then((module) => ({
            Component: module.default,
          })),
      },
      {
        path: "history",
        lazy: () =>
          import("./routes/HistoryPage").then((module) => ({
            Component: module.default,
          })),
      },
      { path: "*", element: <NoMatch /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  </React.StrictMode>,
);
