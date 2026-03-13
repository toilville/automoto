# Partner Channel Onboarding Guide

> **Powered by [vibe-kit](https://github.com/microsoft/vibe-kit)**

This guide walks you through connecting your platform to the MSR Agent — either as a **producer** (new channel) or a **consumer** (embed existing channel).

## Prerequisites

- Node.js 20+
- npm 10+
- Access to an MSR Agent backend or gateway instance

## Two Paths

### 🔧 Path A: Producer — Build a New Channel

You run a platform (Slack, WhatsApp, internal portal, custom app) and want to connect it to the MSR Agent so users can chat with the agent natively from your platform.

**What you'll build:**
- A `ChannelAdapter` that normalizes your platform's payloads ↔ the canonical MSR protocol
- A server endpoint that receives messages from your platform and forwards them to the agent

**Choose your template:**

| Template | Best for | Streaming |
|----------|----------|-----------|
| `express-channel` | Custom HTTP platforms, REST APIs | ✅ Optional |
| `bot-framework-channel` | Teams, M365 Agents, Copilot Studio | ❌ |
| `webhook-channel` | Simple webhooks (Slack, GitHub, callbacks) | ❌ |

**Quick start:**

```bash
# Option 1: Via vibekit CLI
pip install vibekit
vibekit install msr-channel
# Follow the interactive questionnaire

# Option 2: Manual copy
cp -r kits/msr-channel/templates/producer/express-channel apps/my-channel
cd apps/my-channel
npm install
npm run dev
```

**The 3-method contract:**

Every adapter implements three methods:

```typescript
class MyAdapter implements ChannelAdapter<MyInbound, MyOutbound, MyStreamChunk> {
  // 1. Normalize inbound: your platform → canonical
  pub(raw: MyInbound): AgentRequest { ... }

  // 2. Format outbound: canonical → your platform
  sub(response: AgentResponse): MyOutbound { ... }

  // 3. Format streaming: canonical event → your platform's chunk
  stream(event: StreamEvent): MyStreamChunk | null { ... }
}
```

**After scaffolding, you need to:**

1. Replace `__CHANNEL_NAME__` placeholders with your channel's name
2. Define your native types (`MyInbound`, `MyOutbound`)
3. Implement `pub()` — map your platform's request to `AgentRequest`
4. Implement `sub()` — map `AgentResponse` to your platform's response
5. If streaming: implement `stream()` and set `supportsStreaming = true`
6. Register your channel in `packages/channel-adapter/src/protocol.ts` and `factory.ts`

### 📱 Path B: Consumer — Embed an Existing Channel

You want to add MSR Agent capabilities to your app/site using an existing channel.

**Choose your template:**

| Template | Best for | Framework |
|----------|----------|-----------|
| `react-embed` | React apps, SPAs | React 19 + Fluent UI |
| `api-client` | Any language, backend services | None (REST API) |
| `direct-line-embed` | Non-React sites, server-rendered pages | None (script tag) |

**Quick start (React embed):**

```bash
cp -r kits/msr-channel/templates/consumer/react-embed my-app
cd my-app
npm install
# Set VITE_MSR_ENDPOINT in .env
npm run dev
```

**Quick start (API client):**

```bash
# TypeScript
npx tsx kits/msr-channel/templates/consumer/api-client/examples/client.ts

# Python
python kits/msr-channel/templates/consumer/api-client/examples/client.py

# curl
bash kits/msr-channel/templates/consumer/api-client/examples/curl-examples.sh
```

## Architecture Overview

```
┌─────────────────────┐     ┌──────────────────────────────────────────┐
│  Partner Platform    │     │  msr-event-agent-client                  │
│                      │     │                                          │
│  ┌────────────────┐  │     │  ┌──────────────────┐                    │
│  │ Your App/Site  │──┼─────┼─▶│  Channel App     │                    │
│  └────────────────┘  │     │  │  (apps/<channel>) │                    │
│                      │     │  └────────┬─────────┘                    │
└─────────────────────┘     │           │                               │
                            │  ┌────────▼─────────┐                    │
                            │  │ ChannelAdapter    │  pub() / sub()     │
                            │  │ (your adapter)    │  / stream()        │
                            │  └────────┬─────────┘                    │
                            │           │ canonical AgentRequest      │
                            │  ┌────────▼─────────┐                    │
                            │  │ Gateway / Agent   │                    │
                            │  │ Backend           │                    │
                            │  └──────────────────┘                    │
                            └──────────────────────────────────────────┘
```

## Using with vibe-kit

This kit is compatible with the [vibe-kit](https://github.com/microsoft/vibe-kit) innovation kit system.

```bash
# Install vibekit CLI
pip install vibekit

# Point at this repo (local or remote)
export VIBEKIT_BASE_PATH="D:\code\msr-event-agent-client\kits"
# OR for remote:
# export VIBEKIT_BASE_PATH="https://github.com/your-org/msr-event-agent-client"

# Install the channel kit
vibekit install msr-channel

# Run the onboarding questionnaire
python .vibe-kit/innovation-kits/msr-channel/initialization/questionnaire.py
```

## Registered Channel Types

| Channel Type | App | Adapter | Streaming |
|-------------|-----|---------|-----------|
| `web` | `apps/chat` | WebAdapter | ✅ SSE |
| `home` | `apps/msr-home` | WebAdapter | ✅ SSE |
| `teams` | `apps/teams` | WebAdapter | ✅ SSE |
| `agents-sdk` | `apps/agents-sdk` | WebAdapter | ✅ SSE |
| `m365-agents` | `apps/m365-agents` | BotFrameworkAdapter | ❌ |
| `message-extension` | `apps/message-extension` | BotFrameworkAdapter | ❌ |
| `copilot-studio` | `apps/copilot-studio` | BotFrameworkAdapter | ❌ |
| `github-copilot` | `apps/github-copilot-ext` | GitHubCopilotAdapter | ✅ SSE |
| `github-cli` | `apps/github-cli-ext` | CLIAdapter | ❌ |
| `mcp-server` | `apps/mcp-server` | MCPAdapter | ❌ |
| `power-platform` | `apps/power-platform` | PowerPlatformAdapter | ❌ |
| `copilot-knowledge` | `apps/copilot-knowledge-connector` | PowerPlatformAdapter | ❌ |
| `copilot-search` | `apps/copilot-search-connector` | PowerPlatformAdapter | ❌ |
| `direct-line` | `apps/direct-line` | DirectLineAdapter | ❌ |

## Need Help?

- 📖 See `SKILL.md` in this kit for Copilot-assisted authoring context
- 📖 See `docs/protocol-reference.md` for the full pub/sub/stream contract
- 📖 See any existing adapter in `packages/channel-adapter/src/adapters/` for reference
