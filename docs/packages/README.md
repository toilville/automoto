# Packages

4 shared packages consumed by apps and downstream repos.

## Overview

| Package | Path | Description |
|---------|------|-------------|
| `@msr/chat-ui` | `packages/chat-ui` | Reusable chat UI components (React 19 + Fluent UI v9) |
| `@msr/data-client` | `packages/data-client` | API client for the MSR data service |
| `@msr/analytics` | `packages/analytics` | Analytics abstraction with pluggable providers |
| `@msr/channel-adapter` | `packages/channel-adapter` | Channel adapter protocol — pub/sub/stream |

All packages export from `src/index.ts` and compile to `dist/` via TypeScript.

---

## @msr/chat-ui

Reusable React chat components built on Fluent UI v9.

**Key exports:**
- `ChatContainer` — main chat interface component
- `ChatAdapterProvider` — context provider for chat adapters
- Message rendering components, typing indicator, auto-scroll

```tsx
import { ChatContainer, ChatAdapterProvider } from "@msr/chat-ui";
```

---

## @msr/data-client

Shared API client for the MSR data service (`msr-event-agent-api`).

**Key exports:**
- API client for event data, search, and tool definitions
- TypeScript types for API responses
- Search utilities

```tsx
import { ... } from "@msr/data-client";
```

---

## @msr/analytics

Generic analytics abstraction with pluggable providers for telemetry.

| Provider | SDK | Environment |
|----------|-----|-------------|
| `OneDSProvider` | oneDS `ms.analytics-web-3` | Browser |
| `AppInsightsProvider` | `@microsoft/applicationinsights-web` | Browser & Node |
| `ConsoleProvider` | None | Any (dev/debug) |
| `NoopProvider` | None | Any (testing/SSR) |

**Key exports:**
- `AnalyticsManager` — core manager (config, sampling, sanitization, fan-out)
- `OneDSProvider`, `AppInsightsProvider`, `ConsoleProvider`, `NoopProvider`
- `AnalyticsProvider` (React context), `useAnalytics` (React hook)

📖 **Full docs:** [packages/analytics/README.md](../../packages/analytics/README.md)

---

## @msr/channel-adapter

Channel adapter protocol for multi-channel communication.

**Key exports:**
- `ChannelAdapter<TInbound, TOutbound, TStreamChunk>` — interface all adapters implement
- `ChannelType` — union of 14 channel identifiers
- `MSRAgentRequest`, `MSRAgentResponse`, `MSRStreamEvent` — canonical types
- 7 concrete adapters: Web, BotFramework, GitHubCopilot, MCP, PowerPlatform, DirectLine, CLI

See [Channel Onboarding → Protocol Reference](../channel-onboarding/protocol-reference.md) for the full type definitions.

---

## Consuming Packages

### Within the monorepo

Apps consume packages via npm workspace resolution (`"@msr/chat-ui": "*"` in root `devDependencies`).

### In downstream repos (vendoring)

Packages are **vendored** — copied directly into consumer repos (e.g., TNREvents):

```
this-repo/packages/chat-ui/        → consumer-repo/packages/chat-ui/
this-repo/packages/data-client/    → consumer-repo/packages/data-client/
this-repo/packages/analytics/      → consumer-repo/packages/analytics/
```

See [Getting Started](../getting-started/) for the vendoring workflow.
