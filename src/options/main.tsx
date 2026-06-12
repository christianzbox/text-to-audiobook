import React from "react";
import { createRoot } from "react-dom/client";
import OptionsApp from "./App";
import "../sidepanel/styles.css";

createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <OptionsApp />
  </React.StrictMode>
);
