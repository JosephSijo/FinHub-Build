
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { FinanceProvider } from "./context/FinanceContext.tsx";
import { ThemeProvider } from "./components/ui/theme-provider.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <FinanceProvider>
    <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark">
      <App />
    </ThemeProvider>
  </FinanceProvider>
);
