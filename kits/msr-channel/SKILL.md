# MSR Channel Adapter — Copilot Skill

You are helping a developer build or integrate with MSR Agent channels. This skill gives you deep context on the channel adapter protocol.

## Core Concept: pub / sub / stream

Every channel in the MSR platform implements the `ChannelAdapter` interface from `@automoto/channel-adapter`. It normalizes platform-native formats to/from a canonical protocol:

```
Partner Platform ──pub()──→ MSRAgentRequest ──→ Agent Backend
                                                      │
Partner Platform ←─sub()──── MSRAgentResponse ←───────┘
                 ←─stream()─ MSRStreamEvent   ←───────┘
```

### The Interface

```typescript
interface ChannelAdapter<TInbound, TOutbound, TStreamChunk> {
  readonly type: ChannelType;
  readonly name: string;
  readonly supportsStreaming: boolean;

  /** Normalize inbound platform-native request → canonical */
  pub(raw: TInbound): MSRAgentRequest;

  /** Format canonical response → platform-native outbound */
  sub(response: MSRAgentResponse): TOutbound;

  /** Format streaming event → platform-native chunk (null to skip) */
  stream(event: MSRStreamEvent): TStreamChunk | null;
}
```

### Canonical Types

**MSRAgentRequest** (inbound):
- `type`: `"chat" | "search" | "tool_call" | "action"`
- `requestId`: unique ID
- `message`: `{ id, role, content, timestamp }`
- `context`: `{ channel: { type, id }, conversation?, scope?, user? }`
- `stream`: boolean
- `action?`: `{ type, payload? }`

**MSRAgentResponse** (outbound):
- `requestId`, `message`, `cards: MSRCard[]`, `references: MSRReference[]`
- `toolCalls: MSRToolResult[]`, `usage?`, `suggestedActions?`
- `finishReason`: `"stop" | "length" | "content_filter" | "tool_calls" | "error"`

**MSRStreamEvent** (streaming): discriminated union on `type`:
- `text_delta`, `card`, `reference`, `tool_start`, `tool_end`
- `usage`, `suggested_actions`, `done`, `error`

### Registered Channel Types

```typescript
type ChannelType =
  | "web" | "msr-home" | "teams" | "agents-sdk"
  | "m365-agents" | "copilot-search" | "copilot-knowledge" | "copilot-studio"
  | "power-platform" | "github-copilot" | "github-cli"
  | "message-extension" | "direct-line" | "mcp-server";
```

### Existing Adapter Patterns

| Adapter | Channels | Streaming | Key Pattern |
|---------|----------|-----------|-------------|
| `WebAdapter` | web, msr-home, agents-sdk, teams | ✅ SSE | Conversation history, page scope, SSE chunks |
| `BotFrameworkAdapter` | m365-agents, message-extension, copilot-studio | ❌ | Activity types → request types, Adaptive Cards |
| `GitHubCopilotAdapter` | github-copilot | ✅ SSE | Stream-only (sub throws), copilot_message events |
| `MCPAdapter` | mcp-server | ❌ | Tool invocations, content blocks |
| `PowerPlatformAdapter` | power-platform, copilot-knowledge, copilot-search | ❌ | REST-style, endpoint-based type inference |
| `DirectLineAdapter` | direct-line | ❌ | Bot Framework Activities, channelData |
| `CLIAdapter` | github-cli | ❌ | Command/args → natural language, exit codes |

## When Helping a Partner

### Building a NEW channel (producer):
1. Define native inbound/outbound types for their platform
2. Implement `ChannelAdapter` with `pub()`, `sub()`, `stream()`
3. Add channel name to `ChannelType` union in `protocol.ts`
4. Register adapter in `factory.ts`
5. Create app in `apps/<channel>/` with platform endpoints
6. Optionally add gateway service entry

### Embedding an EXISTING channel (consumer):
1. For UI: vendor `@automoto/chat-ui` + `@automoto/data-client`, wrap in `ChatAdapterProvider` + `ChannelProvider`
2. For API: call gateway `POST /api/v1/:channel` with channel-native payload
3. For Direct Line: embed widget via `<script src="/.../embed.js">`

## Files That Matter

- `packages/channel-adapter/src/protocol.ts` — All canonical types
- `packages/channel-adapter/src/adapter.ts` — ChannelAdapter interface
- `packages/channel-adapter/src/factory.ts` — Adapter registry
- `packages/channel-adapter/src/adapters/*.ts` — Concrete implementations
- `apps/gateway/src/normalized.ts` — Gateway normalized endpoint
- `packages/chat-ui/src/index.ts` — Chat UI exports for consumers
- `packages/data-client/src/index.ts` — Data client exports
