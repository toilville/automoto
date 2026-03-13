# Architecture

System architecture overview for the Automoto monorepo.

## Monorepo Structure

```
automoto/
├── packages/           # 4 shared libraries
│   ├── analytics/      # @automoto/analytics — telemetry abstraction
│   ├── channel-adapter/# @automoto/channel-adapter — pub/sub/stream protocol
│   ├── chat-ui/        # @automoto/chat-ui — React chat components
│   └── data-client/    # @automoto/data-client — API client
├── apps/               # 17 applications
│   ├── chat/           # Main chat app (default dev server)
│   ├── home/           # Home app
│   ├── teams/          # Teams integration
│   ├── devtools/       # Channel DevTools (debugger & inspector)
│   └── ...             # See docs/apps/ for full list
├── kits/               # Innovation kits (powered by vibe-kit)
│   └── msr-channel/    # Partner channel onboarding
├── infra/              # Infrastructure (nginx)
└── docs/               # This wiki
```

Workspaces are managed via npm (`"workspaces": ["packages/*", "apps/*"]`).

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| UI Framework | React 19 | React Router 7 (file-based routing, SSR) |
| Component Library | Fluent UI v9 | `@fluentui/react-components` + `@fluentui/react-icons` |
| CSS-in-JS | Griffel | Via `@griffel/vite-plugin` |
| Build Tool | Vite 7.2 | Dev server and production builds |
| Language | TypeScript 5.5 | Strict mode |
| Testing | Vitest | Unit and integration tests |
| Linting | ESLint + stylelint | TypeScript/TSX + CSS |
| Runtime (SSR) | React Router Serve | Production SSR |
| Runtime (API) | Express | Bot Framework, gateway, connectors |
| Infrastructure | nginx + Docker Compose | Production reverse-proxy |

## Channel Adapter Protocol

The core abstraction is `@automoto/channel-adapter`. Every channel app implements three methods:

```
Partner Platform ──pub()──→ AgentRequest ──→ Agent Backend
                                                      │
Partner Platform ←─sub()──── AgentResponse ←───────┘
                 ←─stream()─ StreamEvent   ←───────┘
```

- **`pub(native)`** → Normalize platform request to canonical `AgentRequest`
- **`sub(response)`** → Format canonical `AgentResponse` to platform-native
- **`stream(event)`** → Format `StreamEvent` to platform-native streaming chunk

See [Channel Onboarding → Protocol Reference](../channel-onboarding/protocol-reference.md) for the full type definitions.

## Data Flow

```
┌──────────────────────────────────────────────────────────┐
│                   Client Applications                     │
│  (chat, home, teams, agents-sdk, ...)                    │
│                                                           │
│  Import from:                                             │
│    @automoto/chat-ui        — UI components              │
│    @automoto/data-client    — API client + search        │
│    @automoto/analytics      — Telemetry                  │
│    @automoto/channel-adapter — Channel utilities          │
└──────────────────┬───────────────────────────────────────┘
                   │ HTTP requests via @automoto/data-client
                   ▼
┌──────────────────────────────────────────────────────────┐
│                 automoto-api                              │
│  (Azure Functions — Cosmos DB, AI Search)                │
│  /v1/events, /v1/publications, /v2/search, ...           │
└──────────────────────────────────────────────────────────┘
```

## Package Consumption Model

Shared packages are **vendored** into downstream repos rather than published to a registry:

```
this-repo/packages/chat-ui/        ← source of truth
    ↓ copy src/ + dist/ + package.json
consumer-repo/packages/chat-ui/    ← vendored copy (e.g., TNREvents)
```

Within the monorepo, apps consume packages via npm workspace resolution.

See [Getting Started](../getting-started/) for the vendoring workflow.

## Production Architecture

See [Infrastructure](../infrastructure/) for the full nginx routing table, deployment modes, and Docker Compose setup.

## Deployment Environments

The Automoto platform spans three environments across the API and client repos:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Platform Environments                           │
│                                                                        │
│   Dev                     UAT (staging)            Prod                │
│   ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐ │
│   │ API: automoto-   │    │ API: automoto-   │    │ API: automoto-   │ │
│   │ api-dev          │    │ api-staging      │    │ api              │ │
│   │                  │    │ staging          │    │                  │ │
│   │ Client: local    │    │ Client: local    │    │ Client:          │ │
│   │ dev servers      │    │ dev servers      │    │ msr-agents.      │ │
│   │ (Vite HMR)       │    │ (Vite HMR)       │    │ microsoft.com    │ │
│   │                  │    │                  │    │ (nginx + Docker) │ │
│   │ Relaxed auth     │    │ Prod-like auth   │    │ Full lockdown    │ │
│   └──────────────────┘    └──────────────────┘    └──────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

### Client Deployment

| Environment | How client apps run | API Endpoint |
|-------------|-------------------|--------------|
| **Dev** (local) | `npm run dev` — Vite dev server on `localhost:5173` | `https://automoto-api-dev.example.com` |
| **UAT** (staging) | `npm run dev` — Vite dev server with staging API | `https://automoto-api-staging.example.com` |
| **Prod** | nginx reverse proxy on `automoto.example.com` | `https://automoto-api.example.com` |

> The client repo does not use Azure App Service slots. Production uses **nginx + Docker Compose** for multi-app routing (see [Infrastructure](../infrastructure/)). Development uses Vite dev servers locally.

### API Service Chart (cross-repo)

Each API slot has its own independent resource stack:

| Service | Dev | UAT | Prod | Shared? |
|---------|-----|-----|------|---------|
| Function App | `automoto-api-dev` | `automoto-api-staging` | `automoto-api` | Per-slot |
| Cosmos DB | `automoto-cosmos-dev` | `automoto-cosmos-staging` | `automoto-cosmos-prod` | Per-slot |
| Azure OpenAI | `automoto-ai-dev` | `automoto-ai-staging` | `automoto-ai-prod` | Per-slot |
| Storage | `automotostoragedev` | `automotostoragestaging` | `automotostorageprod` | Per-slot |
| AI Foundry | `automoto-foundry-dev` | `automoto-foundry-staging` | `automoto-foundry-prod` | Per-slot |
| AI Search | `automoto-search` | `automoto-search` | `automoto-search` | **Shared** |
| App Insights | `automoto-api` | `automoto-api` | `automoto-api` | **Shared** |

See the API repo's `docs/architecture/` for the full service matrix, security posture, and deploy commands.
