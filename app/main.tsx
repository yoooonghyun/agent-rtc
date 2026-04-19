import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Dashboard } from "./components/dashboard";
import "./globals.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <div className="mx-auto max-w-4xl px-6 py-10">
      <header className="mb-10">
        <h1 className="font-serif text-4xl font-medium leading-tight text-near-black">
          Agent RTC
        </h1>
        <p className="mt-2 text-olive-gray">
          Real-time communication broker for inter-agent messaging
        </p>
      </header>

      <Dashboard />

      <footer className="border-t border-border-cream pt-6 text-center text-xs text-stone-gray">
        MCP endpoint: <code className="font-mono text-olive-gray">/mcp</code> with header <code className="font-mono text-olive-gray">X-Agent-Name</code>
      </footer>
    </div>
  </StrictMode>
);
