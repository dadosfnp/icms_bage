import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import BageIcmsPresentation from "./BageIcmsPresentation";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Elemento #root não encontrado.");
}

createRoot(root).render(
  <StrictMode>
    <BageIcmsPresentation />
  </StrictMode>,
);
