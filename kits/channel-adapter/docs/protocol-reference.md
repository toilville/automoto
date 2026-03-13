# MSR Agent Protocol Reference

> The canonical pub/sub/stream contract that all channel adapters implement.

## Core Interface

```typescript
interface ChannelAdapter<TInbound, TOutbound, TStreamChunk> {
  /** Channel type identifier (e.g., "web", "teams") */
  readonly type: ChannelType;

  /** Human-readable channel name */
  readonly name: string;

  /** Whether this channel supports real-time streaming */
  readonly supportsStreaming: boolean;

  /** Normalize inbound platform-native request → canonical AgentRequest */
  pub(raw: TInbound): AgentRequest;

  /** Format canonical AgentResponse → platform-native outbound */
  sub(response: AgentResponse): TOutbound;

  /** Format StreamEvent → platform-native streaming chunk (null to skip) */
  stream(event: StreamEvent): TStreamChunk | null;
}
```

## Message Patterns

### msr.pub — Inbound (Platform → Agent)

Your platform sends a message. The adapter normalizes it into a canonical `AgentRequest`.

```typescript
interface AgentRequest {
  type: "chat" | "search" | "tool_call" | "action";
  requestId: string;
  message: Message;
  context: AgentContext;
  stream: boolean;
  action?: { type: string; payload?: unknown };
}

interface Message {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

interface AgentContext {
  channel: { type: ChannelType; id: string };
  conversation?: { id: string; history: Message[] };
  scope?: { event?: string; topics?: string[]; filters?: Record<string, unknown> };
  user?: { id: string; name?: string; email?: string; roles?: string[] };
}
```

### msr.sub — Outbound (Agent → Platform)

The agent produces a complete response. The adapter formats it into your platform's native format.

```typescript
interface AgentResponse {
  requestId: string;
  message: Message;
  cards: Card[];
  references: Reference[];
  toolCalls: ToolResult[];
  usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
  suggestedActions?: Action[];
  finishReason: "stop" | "length" | "content_filter" | "tool_calls" | "error";
}

interface Card {
  id: string;
  kind: string;
  title: string;
  data: Record<string, unknown>;
  url?: string;
}

interface Reference {
  id: string;
  title: string;
  url: string;
  snippet?: string;
}
```

### msr.stream — Streaming (Agent → Platform, real-time)

For streaming channels, each chunk is a discriminated union event:

```typescript
type StreamEvent =
  | { type: "text_delta"; delta: string }
  | { type: "card"; card: Card }
  | { type: "reference"; reference: Reference }
  | { type: "tool_start"; toolCall: { id: string; name: string; arguments: string } }
  | { type: "tool_end"; toolResult: ToolResult }
  | { type: "usage"; usage: { promptTokens: number; completionTokens: number; totalTokens: number } }
  | { type: "suggested_actions"; actions: Action[] }
  | { type: "done"; usage?: { promptTokens: number; completionTokens: number; totalTokens: number } }
  | { type: "error"; error: { code: string; message: string } };
```

## Adapter Registration

New adapters must be registered in the factory:

```typescript
// packages/channel-adapter/src/factory.ts

import { MyChannelAdapter } from "./adapters/my-channel.js";

// Add to the registry:
registerAdapter("my-channel", new MyChannelAdapter());
```

And the channel type must be added to the union:

```typescript
// packages/channel-adapter/src/protocol.ts

export type ChannelType =
  | "web" | "home" | "teams" | "agents-sdk"
  | "m365-agents" | "copilot-search" | "copilot-knowledge" | "copilot-studio"
  | "power-platform" | "github-copilot" | "github-cli"
  | "message-extension" | "direct-line" | "mcp-server"
  | "my-channel";  // ← add yours here
```

## Examples

### Minimal Non-Streaming Adapter (CLIAdapter pattern)

```typescript
import { randomUUID } from "node:crypto";
import type { ChannelAdapter, ChannelType, AgentRequest, AgentResponse, StreamEvent } from "@automoto/channel-adapter";

interface CLIInbound { command: string; args: string[] }
interface CLIOutbound { text: string; exitCode: number }

export class CLIAdapter implements ChannelAdapter<CLIInbound, CLIOutbound, null> {
  readonly type: ChannelType = "github-cli";
  readonly name = "GitHub CLI";
  readonly supportsStreaming = false;

  pub(raw: CLIInbound): AgentRequest {
    return {
      type: "chat",
      requestId: randomUUID(),
      message: { id: randomUUID(), role: "user", content: [raw.command, ...raw.args].join(" "), timestamp: new Date().toISOString() },
      context: { channel: { type: this.type, id: "cli" }, conversation: { id: `cli-${Date.now()}`, history: [] } },
      stream: false,
    };
  }

  sub(response: AgentResponse): CLIOutbound {
    return { text: response.message.content, exitCode: response.finishReason === "error" ? 1 : 0 };
  }

  stream(): null { return null; }
}
```

### Streaming Adapter (WebAdapter pattern)

```typescript
// Key difference: supportsStreaming = true + SSE formatting in stream()
stream(event: StreamEvent): string | null {
  switch (event.type) {
    case "text_delta":
      return `event: text_delta\ndata: ${JSON.stringify({ delta: event.delta })}\n\n`;
    case "card":
      return `event: card\ndata: ${JSON.stringify(event.card)}\n\n`;
    case "done":
      return `event: done\ndata: ${JSON.stringify(event.usage ?? {})}\n\n`;
    default:
      return null;
  }
}
```
