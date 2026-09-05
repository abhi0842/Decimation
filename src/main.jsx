import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { DecimationProvider } from "./context/DecimationContext.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <DecimationProvider>
      <App />
    </DecimationProvider>
  </StrictMode>
);
