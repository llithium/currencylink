import React from "react";
import ReactDOM from "react-dom/client";

import "./index.css";
import "/node_modules/flag-icons/css/flag-icons.min.css";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import ErrorPage from "./routes/ErrorPage";
import Root from "./routes/Root";
import NoMatch from "./routes/NoMatch";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    errorElement: <ErrorPage />,
    children: [
      { path: "*", element: <NoMatch /> },
      {
        errorElement: <ErrorPage />,
        children: [],
      },
    ],
  },
]);
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />,
  </React.StrictMode>,
);
