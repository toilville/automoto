# Apps

All 17 applications in the monorepo.

## Overview

| App | Path | Category | Port | Dev Command |
|-----|------|----------|------|-------------|
| chat | `apps/chat` | SSR | 5173 | `npm run dev` |
| home | `apps/home` | SSR | 5174 | `npm run dev:home` |
| teams | `apps/teams` | SSR | 5175 | `npm run dev:teams` |
| agents-sdk | `apps/agents-sdk` | SSR | 5176 | `npm run dev:agents` |
| devtools | `apps/devtools` | DevTools | 5173 | `npm run dev:devtools` |
| mcp-server | `apps/mcp-server` | API | 3100 | `npm run dev:mcp` |
| gateway | `apps/gateway` | API | 8080 | `npm run dev:gateway` |
| m365-agents | `apps/m365-agents` | Bot | 3978 | `npm run dev:m365` |
| message-extension | `apps/message-extension` | Bot | 7074 | `npm run dev:message-ext` |
| direct-line | `apps/direct-line` | API | 7075 | `npm run dev:direct-line` |
| copilot-search-connector | `apps/copilot-search-connector` | Connector | — | `npm run dev:search-connector` |
| copilot-knowledge-connector | `apps/copilot-knowledge-connector` | Connector | 8081 | `npm run dev:knowledge-connector` |
| copilot-studio | `apps/copilot-studio` | Bot | — | `npm run dev:copilot-studio` |
| github-copilot-ext | `apps/github-copilot-ext` | API | 7073 | `npm run dev:github-copilot` |
| github-cli-ext | `apps/github-cli-ext` | CLI | — | `npm run dev:github-cli` |
| power-platform | `apps/power-platform` | Connector | 7072 | `npm run dev:power-platform` |
| sharepoint | `apps/sharepoint` | SPFx | — | — |

---

## SSR Apps

React Router 7 applications with server-side rendering, file-based routing, and Fluent UI v9 components.

| App | Description |
|-----|-------------|
| **chat** | The primary chat interface. Default dev server for the monorepo. |
| **home** | Home and discovery experience. |
| **teams** | Teams-specific integration of the chat experience. |
| **agents-sdk** | Agents SDK application. |

Build toolchain: `react-router build` → `react-router-serve` → Vitest → ESLint + stylelint.

---

## Developer Tools

| App | Description |
|-----|-------------|
| **devtools** | Channel DevTools — modern replacement for Bot Framework Emulator. Test all 14 channels with real-time event inspection, protocol viewer, network log, and console. Supports mock mode for fast iteration without Azure credentials. |

```bash
npm run dev:devtools        # Live mode (Foundry agent)
npm run dev:devtools:mock   # Mock mode (instant, no auth)
```

📖 **Full docs:** [DevTools](../devtools/)

---

## API Servers

Express-based services for bot messaging, agent communication, and platform routing.

| App | Description |
|-----|-------------|
| **m365-agents** | Microsoft 365 agents using Bot Framework. Handles `/m365/api/messages`. |
| **message-extension** | Teams message extension. Handles `/message-ext/api/messages`. |
| **gateway** | API gateway and service registry. `/health` and `/api/services`. |
| **direct-line** | Direct Line channel for web chat widget embedding. |
| **mcp-server** | Model Context Protocol server. Exposes Automoto tools to AI clients via stdio/SSE. [README →](../../apps/mcp-server/README.md) |

---

## Connectors & Extensions

Integrations with external platforms.

| App | Description |
|-----|-------------|
| **copilot-search-connector** | Microsoft 365 Copilot search connector. |
| **copilot-knowledge-connector** | Microsoft 365 Copilot knowledge connector. |
| **copilot-studio** | Copilot Studio integration. |
| **github-copilot-ext** | GitHub Copilot extension. Handles `/github-copilot/agent`. |
| **github-cli-ext** | GitHub CLI extension (`gh automoto`). [README →](../../apps/github-cli-ext/README.md) |
| **power-platform** | Power Platform integration. |

---

## Standalone

| App | Description |
|-----|-------------|
| **sharepoint** | SPFx web part scaffold. Embeds Automoto chat into SharePoint pages. [README →](../../apps/sharepoint/README.md) |

---

## Production Routing

See [Infrastructure](../infrastructure/) for the full nginx routing table.
