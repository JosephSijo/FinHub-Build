
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { FinanceProvider } from "./context/FinanceContext.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <FinanceProvider>
    <App />
  </FinanceProvider>
);
