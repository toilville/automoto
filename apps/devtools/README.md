# MSR Channel DevTools

A modern channel developer tool for testing, debugging, and inspecting all 14 MSR agent channels — the replacement for the archived Bot Framework Emulator.

**Inspired by Flutter DevTools:** multi-channel chat + real-time event inspection + protocol transform viewer.

---

## Quick Start

```bash
# Live mode (requires Azure credentials + Foundry endpoint)
npm run dev:devtools

# Mock mode (instant responses, no auth needed — great for UI development)
npm run dev:devtools:mock
```

Open http://localhost:5173

### Mock Mode

Mock mode returns canned SSE responses instantly without calling Azure AI Foundry. Enable it with:

```bash
# From repo root
npm run dev:devtools:mock

# Or from apps/devtools
MOCK_MODE=true npm run dev
```

**Mock commands:** Send these words to trigger special responses:
| Message | Behavior |
|---------|----------|
| `hello` | Quick greeting |
| `help` | Lists mock commands |
| `error` | Simulates an error response |
| `slow` | Simulates slow streaming (200ms per word) |
| `cards` | Returns sample carousel cards |
| *(anything else)* | Default mock response |

### Live Mode (Foundry Agent)

Requires a `.env` file in `apps/devtools/`:

```env
FOUNDRY_ENDPOINT=https://your-ai-endpoint.services.ai.azure.com
FOUNDRY_AGENT_ID=asst_xxxxxxxxxxxxxxxxxxxxx
DATA_API_URL=http://localhost:7071
```

Authentication uses `DefaultAzureCredential` — ensure you're logged in via `az login`.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  apps/devtools                                              │
│                                                             │
│  ┌──────────────┐  ┌──────────────────────────────────────┐ │
│  │ Channel      │  │ Chat Pane                            │ │
│  │ Selector     │  │ SSE streaming chat with selected     │ │
│  │              │  │ channel + real-time event capture     │ │
│  │ ○ web        │  │                                      │ │
│  │ ● teams      │  │                                      │ │
│  │ ○ copilot    │  │                                      │ │
│  │ ○ mcp        │  │                                      │ │
│  │ ○ cli        │  │                                      │ │
│  │ ...14 total  │  │                                      │ │
│  └──────────────┘  └──────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ DevTools Panel (tabbed)                                 │ │
│  │ [Events] [Protocol] [Network] [Console] [Adapters]      │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Panels

| Panel | Purpose |
|-------|---------|
| **Events** | Real-time timeline of all SSE events (chunks, cards, tool calls, usage, done) |
| **Protocol** | Side-by-side view of native ↔ canonical protocol transforms |
| **Network** | Request/response log with timing, headers, status badges |
| **Console** | Internal devtools log — channel switches, errors, initialization |
| **Adapters** | All 14 channel adapters with streaming capability badges |

### Tech Stack

- **React 19** + React Router 7 (SSR)
- **Fluent UI v9** — dark theme by default
- **Vite 7.2** build tool
- **Custom lightweight store** — `useSyncExternalStore` + plain object (no zustand)
- **Azure AI Foundry** backend (or mock mode)

---

## Project Structure

```
apps/devtools/
├── app/
│   ├── components/        # UI components
│   │   ├── ChatPane.tsx           # Chat interface
│   │   ├── ChannelSelector.tsx    # 14-channel sidebar
│   │   ├── DevToolsLayout.tsx     # Main grid layout
│   │   ├── EventsPanel.tsx        # SSE event timeline
│   │   ├── ProtocolPanel.tsx      # Protocol transform viewer
│   │   ├── NetworkPanel.tsx       # Request/response log
│   │   ├── ConsolePanel.tsx       # Internal log viewer
│   │   ├── AdaptersPanel.tsx      # Adapter registry view
│   │   ├── EventBadge.tsx         # Color-coded event type badge
│   │   └── JsonView.tsx           # Recursive collapsible JSON tree
│   ├── hooks/
│   │   └── useDevToolsChat.ts     # Chat hook — SSE streaming + event capture
│   ├── store/
│   │   ├── devtools-store.ts      # Central state (events, requests, console, filters)
│   │   └── useDevToolsStore.ts    # React hook (useSyncExternalStore)
│   ├── services/
│   │   ├── foundry-agent.server.ts # Azure AI Foundry client (live mode)
│   │   └── mock-agent.server.ts    # Mock SSE responses (mock mode)
│   ├── models/
│   │   └── types.ts               # ChatRequest, StreamEvent, TokenUsage
│   ├── routes/
│   │   ├── _index.tsx             # Main route — initializes adapters, renders layout
│   │   └── api.chat.tsx           # POST /api/chat — SSE streaming endpoint
│   ├── tests/
│   │   └── channels.integration.test.ts  # 14-channel integration tests
│   ├── root.tsx                   # App shell (FluentProvider, dark theme)
│   └── routes.ts                  # Route configuration
├── .env                           # Foundry credentials (not committed)
├── package.json
├── vite.config.ts
└── vitest.config.ts
```

---

## Testing

### Unit Tests (56 tests)

```bash
cd apps/devtools
npm run test:unit          # Run unit tests only (excludes integration)
npm run test:watch         # Watch mode
```

Test coverage:
- **devtools-store** — 25 tests (state management, ring buffers, filters)
- **useDevToolsChat** — 8 tests (SSE parsing, error handling, abort)
- **EventBadge** — 7 tests (color coding, event type rendering)
- **JsonView** — 16 tests (collapsible tree, primitive types, nested objects)

### Integration Tests (requires running server)

```bash
# Terminal 1: Start the dev server
npm run dev:devtools          # Live mode
# OR
npm run dev:devtools:mock     # Mock mode (faster, no auth)

# Terminal 2: Run integration tests
cd apps/devtools
npm run test:integration
```

Integration tests verify:
- API endpoint validation (SSE format, error handling)
- All 14 channels respond with valid streaming SSE
- Conversation history maintains context across turns
- Channels run in parallel batches of 4 for speed

---

## State Management

The devtools use a custom lightweight store instead of zustand:

```ts
import { useDevToolsStore } from "~/store/useDevToolsStore.js";
import { getDevToolsState } from "~/store/devtools-store.js";

// In React components (reactive)
const { selectedChannel, events, requests } = useDevToolsStore();

// Outside React (imperative)
const state = getDevToolsState();
state.addEvent(event);
state.setSelectedChannel("teams");
```

**Key design decisions:**
- Store uses `useSyncExternalStore` for tear-free reads
- Ring buffers: events capped at 5000, console at 2000
- Direct imports (not barrel re-exports) to prevent Vite HMR cache issues

---

## Troubleshooting

### "FOUNDRY_ENDPOINT is required"
You're running in live mode without a `.env` file. Either:
- Create `apps/devtools/.env` with your Foundry credentials
- Use mock mode: `npm run dev:devtools:mock`

### Vite HMR "export not found" errors
Clear the Vite cache and restart:
```bash
rm -rf apps/devtools/node_modules/.vite
npm run dev:devtools
```

### Integration tests timeout
- Live Foundry calls take 7-15s per channel. With batching, total is ~40s.
- If rate-limited, increase `BATCH_SIZE` in the test or use mock mode.
- Set `DEVTOOLS_URL` env var if the server is on a different port.

### Azure credential errors
Ensure you're authenticated:
```bash
az login
az account set --subscription <your-subscription>
```
