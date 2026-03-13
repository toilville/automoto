# Channel DevTools

A modern channel developer tool for testing, debugging, and inspecting all 14 agent channels — the replacement for the archived Bot Framework Emulator.

Inspired by **Flutter DevTools**: multi-channel chat + real-time event inspection + protocol transform viewer.

## Quick Start

```bash
npm run dev:devtools           # Live mode (Foundry agent, requires Azure auth)
npm run dev:devtools:mock      # Mock mode (instant responses, no auth needed)
```

Open http://localhost:5173

## Mock Mode

Returns canned SSE responses instantly without calling Azure AI Foundry. Great for UI development and CI.

**Mock commands:** Send these words to trigger special responses:

| Message | Behavior |
|---------|----------|
| `hello` | Quick greeting |
| `help` | Lists available mock commands |
| `error` | Simulates an error response |
| `slow` | Simulates slow streaming (200ms per word) |
| `cards` | Returns sample carousel cards |
| *(anything else)* | Default mock response |

## Live Mode

Requires `apps/devtools/.env`:

```env
FOUNDRY_ENDPOINT=https://your-ai-endpoint.services.ai.azure.com
FOUNDRY_AGENT_ID=asst_xxxxxxxxxxxxxxxxxxxxx
DATA_API_URL=http://localhost:7071
```

Authentication uses `DefaultAzureCredential` — run `az login` first.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  apps/devtools                                              │
│                                                             │
│  ┌──────────────┐  ┌──────────────────────────────────────┐ │
│  │ Channel      │  │ Chat Pane                            │ │
│  │ Selector     │  │ SSE streaming chat with event capture│ │
│  │              │  │                                      │ │
│  │ ○ web        │  │                                      │ │
│  │ ● teams      │  │                                      │ │
│  │ ○ copilot    │  │                                      │ │
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

- **React 19** + React Router 7 (SSR), **Fluent UI v9** (dark theme)
- **Custom lightweight store** — `useSyncExternalStore` + plain object (no zustand)
- **Direct file imports** (not barrel re-exports) to prevent Vite HMR cache issues
- Ring buffers: events capped at 5,000, console at 2,000

## Testing

### Unit Tests (56 tests)

```bash
cd apps/devtools
npm run test:unit
```

Coverage: store (25), chat hook (8), EventBadge (7), JsonView (16).

### Integration Tests (requires running server)

```bash
# Terminal 1
npm run dev:devtools:mock

# Terminal 2
cd apps/devtools && npm run test:integration
```

Tests all 14 channels in parallel batches of 4. Verifies SSE format, streaming responses, and conversation history.

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "FOUNDRY_ENDPOINT is required" | Use mock mode: `npm run dev:devtools:mock` |
| Vite HMR "export not found" | Clear cache: `rm -rf apps/devtools/node_modules/.vite` |
| Integration tests timeout | Use mock mode, or increase `BATCH_SIZE` in test file |
| Azure credential errors | Run `az login` and set correct subscription |
