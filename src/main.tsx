import React from "react";
import ReactDOM from "react-dom/client";

import "./index.css";
import "/node_modules/flag-icons/css/flag-icons.min.css";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import ErrorPage from "./routes/ErrorPage";
import Root from "./routes/Root";
import NoMatch from "./routes/NoMatch";
import ConversionPage, { ConversionPageLoader } from "./routes/ConversionPage";
import HistoryPage from "./routes/HistoryPage";
import RatesPage from "./routes/RatesPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    loader: ConversionPageLoader,
    errorElement: <ErrorPage />,

    children: [
      {
        index: true,
        element: <ConversionPage />,
        loader: ConversionPageLoader,
      },

      {
        errorElement: <ErrorPage />,
        children: [
          {
            path: "/rates",
            element: <RatesPage />,
            loader: ConversionPageLoader,
          },
          {
            path: "/history",
            element: <HistoryPage />,
            loader: ConversionPageLoader,
          },
          { path: "*", element: <NoMatch /> },
        ],
      },
    ],
  },
]);
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
