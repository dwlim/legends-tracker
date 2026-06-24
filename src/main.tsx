import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import LegendsSummary from "./LegendsSummary";

const path = window.location.pathname;

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    {path.includes("legends-summary") ? <LegendsSummary /> : <App />}
  </React.StrictMode>,
);
