# Channel Onboarding

> **Powered by [vibe-kit](https://github.com/microsoft/vibe-kit)**

Connect your platform to the MSR Agent — as a **producer** (new channel) or **consumer** (embed existing channel).

## Prerequisites

- Node.js 20+, npm 10+
- Access to an MSR Agent backend or gateway instance

## Two Paths

### 🔧 Path A: Producer — Build a New Channel

You run a platform (Slack, WhatsApp, internal portal) and want to connect it to the MSR Agent.

**Choose a template:**

| Template | Best for | Streaming |
|----------|----------|-----------|
| `express-channel` | Custom HTTP platforms, REST APIs | ✅ Optional |
| `bot-framework-channel` | Teams, M365 Agents, Copilot Studio | ❌ |
| `webhook-channel` | Simple webhooks (Slack, GitHub, callbacks) | ❌ |

**Quick start:**

```bash
# Via vibekit CLI
pip install vibekit
vibekit install msr-channel

# Or copy a template directly
cp -r kits/msr-channel/templates/producer/express-channel apps/my-channel
cd apps/my-channel && npm install && npm run dev
```

**The 3-method contract:** Every adapter implements `pub()`, `sub()`, and `stream()`. See [Protocol Reference](protocol-reference.md) for full type definitions.

**After scaffolding:**
1. Replace `__CHANNEL_NAME__` placeholders
2. Define your native types (`MyInbound`, `MyOutbound`)
3. Implement `pub()` — map your platform's request to `MSRAgentRequest`
4. Implement `sub()` — map `MSRAgentResponse` to your platform's response
5. If streaming: implement `stream()` and set `supportsStreaming = true`
6. Register in `packages/channel-adapter/src/protocol.ts` and `factory.ts`

### 📱 Path B: Consumer — Embed an Existing Channel

You want to add MSR Agent capabilities to your app/site.

| Template | Best for | Framework |
|----------|----------|-----------|
| `react-embed` | React apps, SPAs | React 19 + Fluent UI |
| `api-client` | Server-side, non-React | Any (REST) |
| `direct-line-embed` | Drop-in widget | Vanilla JS |

```bash
cp -r kits/msr-channel/templates/consumer/react-embed my-app/packages/msr-chat
```

## Templates

All templates live in `kits/msr-channel/templates/`:

```
kits/msr-channel/
├── MANIFEST.yml              # vibe-kit manifest
├── SKILL.md                  # Copilot skill for guided authoring
├── templates/
│   ├── producer/
│   │   ├── express-channel/  # Custom HTTP platform
│   │   ├── bot-framework-channel/  # Teams/M365/Copilot Studio
│   │   └── webhook-channel/  # Simple webhooks
│   └── consumer/
│       ├── react-embed/      # React chat embed
│       ├── api-client/       # REST API client
│       └── direct-line-embed/# Drop-in widget
└── docs/
    ├── partner-onboarding.md # (this content, detailed version)
    └── protocol-reference.md # Full type definitions
```

## Subpages

- [Protocol Reference](protocol-reference.md) — Full canonical type definitions (`MSRAgentRequest`, `MSRAgentResponse`, `MSRStreamEvent`, `MSRCard`, etc.)
