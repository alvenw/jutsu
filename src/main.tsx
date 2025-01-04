import React from "react"
import ReactDOM from "react-dom/client"
import JutsuDashboard from "./components/jutsu-dashboard"
import { ThemeProvider } from "./components/theme-provider"
import "./index.css"

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="system" storageKey="jutsu-theme">
      <JutsuDashboard />
    </ThemeProvider>
  </React.StrictMode>,
)