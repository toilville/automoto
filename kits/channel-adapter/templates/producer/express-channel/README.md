# __CHANNEL_DISPLAY_NAME__ Channel

A new MSR Agent channel powered by the `@automoto/channel-adapter` pub/sub/stream protocol.

## Quick Start

```bash
npm install
npm run dev
```

Test the health endpoint:

```bash
curl http://localhost:3100/health
```

Send a test message:

```bash
curl -X POST http://localhost:3100/api/messages \
  -H "Content-Type: application/json" \
  -d '{"text": "What research is happening in AI?", "conversationId": "test-123"}'
```

## How It Works

This channel implements the `ChannelAdapter` interface:

| Method | Purpose |
|--------|---------|
| `pub(native)` | Normalize your platform's inbound request → canonical `AgentRequest` |
| `sub(response)` | Format canonical `AgentResponse` → your platform's native response |
| `stream(event)` | Format `StreamEvent` → your platform's streaming chunk |

## Setup Checklist

- [ ] Replace placeholder native types in `src/adapter.ts` with your platform's actual types
- [ ] Add your channel type to `ChannelType` in `packages/channel-adapter/src/protocol.ts`
- [ ] Register your adapter in `packages/channel-adapter/src/factory.ts`
- [ ] Update `pub()` to normalize your platform's request format
- [ ] Update `sub()` to format responses for your platform (cards, references, suggested actions)
- [ ] If streaming: set `supportsStreaming = true` and implement `stream()`
- [ ] Update the server endpoint (`/api/messages`) to match your platform's webhook pattern
- [ ] Set `AGENT_BACKEND_URL` to point at your MSR Agent backend or gateway
- [ ] Add authentication/verification for your platform's webhooks

## Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `PORT` | `3100` | Server port |
| `AGENT_BACKEND_URL` | `http://localhost:4000/api/v1/__CHANNEL_ID__` | MSR Agent backend URL |

## Architecture

```
Your Platform ──webhook──→ /api/messages ──pub()──→ AgentRequest
                                                        │
                                                   Agent Backend
                                                        │
Your Platform ←─response── /api/messages ←─sub()──── AgentResponse
```
