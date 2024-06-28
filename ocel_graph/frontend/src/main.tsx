import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { API_WEB_SERVER_BACKEND_PROVIDER, BackendProviderContext } from "./backend-context.ts";
import { Toaster } from "react-hot-toast";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BackendProviderContext.Provider value={API_WEB_SERVER_BACKEND_PROVIDER}>
      <Toaster/>
      <App />
    </BackendProviderContext.Provider>
  </React.StrictMode>
);
