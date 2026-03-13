/**
 * DevTools index route — initializes the adapter list and renders the main layout.
 */
import { useEffect, useState } from "react";
import { DevToolsLayout } from "~/components/DevToolsLayout.js";
import { getDevToolsState } from "~/store/devtools-store.js";
import type { AdapterInfo } from "~/store/devtools-store.js";

/** All known channel adapters — loaded client-side from the canonical registry. */
const DEFAULT_ADAPTERS: AdapterInfo[] = [
  { type: "web", name: "Web Chat", supportsStreaming: true },
  { type: "home", name: "Homepage", supportsStreaming: true },
  { type: "teams", name: "Teams", supportsStreaming: true },
  { type: "agents-sdk", name: "Agents SDK", supportsStreaming: true },
  { type: "m365-agents", name: "M365 Agents", supportsStreaming: true },
  { type: "message-extension", name: "Message Extension", supportsStreaming: true },
  { type: "copilot-studio", name: "Copilot Studio", supportsStreaming: true },
  { type: "github-copilot", name: "GitHub Copilot", supportsStreaming: true },
  { type: "mcp-server", name: "MCP Server", supportsStreaming: true },
  { type: "power-platform", name: "Power Platform", supportsStreaming: false },
  { type: "copilot-knowledge", name: "Copilot Knowledge", supportsStreaming: false },
  { type: "copilot-search", name: "Copilot Search", supportsStreaming: false },
  { type: "direct-line", name: "Direct Line", supportsStreaming: true },
  { type: "github-cli", name: "GitHub CLI", supportsStreaming: false },
];

export default function Index() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const store = getDevToolsState();

    // Initialize adapters from the canonical list
    store.setAdapters(DEFAULT_ADAPTERS);

    // Optionally fetch live adapter list from gateway
    const gatewayUrl = store.settings.gatewayUrl;
    fetch(`${gatewayUrl}/api/v1/adapters`)
      .then((r) => r.json())
      .then((data: AdapterInfo[]) => {
        if (Array.isArray(data) && data.length > 0) {
          store.setAdapters(data);
          store.addConsoleEntry({
            id: `init-${Date.now()}`,
            timestamp: Date.now(),
            level: "info",
            source: "init",
            message: `✓ Connected to gateway — ${data.length} adapters loaded`,
          });
        }
      })
      .catch(() => {
        store.addConsoleEntry({
          id: `init-${Date.now()}`,
          timestamp: Date.now(),
          level: "warn",
          source: "init",
          message: `⚠ Gateway not reachable at ${gatewayUrl} — using defaults`,
        });
      });

    store.addConsoleEntry({
      id: `boot-${Date.now()}`,
      timestamp: Date.now(),
      level: "info",
      source: "init",
      message: "Channel DevTools initialized",
    });

    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          color: "#888",
        }}
      >
        Loading DevTools...
      </div>
    );
  }

  return <DevToolsLayout />;
}
