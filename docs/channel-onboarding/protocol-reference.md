# Protocol Reference

> Canonical source: [`kits/msr-channel/docs/protocol-reference.md`](../../kits/msr-channel/docs/protocol-reference.md)

This page documents the full pub/sub/stream protocol that all channel adapters implement. For the most up-to-date type definitions, see the source file above.

---

## Core Interface

```typescript
interface ChannelAdapter<TInbound, TOutbound, TStreamChunk> {
  readonly type: ChannelType;
  readonly name: string;
  readonly supportsStreaming: boolean;

  pub(raw: TInbound): AgentRequest;
  sub(response: AgentResponse): TOutbound;
  stream(event: StreamEvent): TStreamChunk | null;
}
```

## Canonical Types

### AgentRequest (inbound)

```typescript
interface AgentRequest {
  type: "chat" | "search" | "tool_call" | "action";
  requestId: string;
  message: Message;
  context: AgentContext;
  stream: boolean;
  action?: { type: string; payload?: unknown };
}
```

### AgentResponse (outbound)

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
```

### StreamEvent (streaming)

```typescript
type StreamEvent =
  | { type: "text_delta"; delta: string }
  | { type: "card"; card: Card }
  | { type: "reference"; reference: Reference }
  | { type: "tool_start"; toolCall: { id: string; name: string; arguments: string } }
  | { type: "tool_end"; toolResult: ToolResult }
  | { type: "usage"; usage: { promptTokens: number; completionTokens: number; totalTokens: number } }
  | { type: "suggested_actions"; actions: Action[] }
  | { type: "done"; usage?: { ... } }
  | { type: "error"; error: { code: string; message: string } };
```

## Adapter Registration

See the full [Protocol Reference](../../kits/msr-channel/docs/protocol-reference.md) for registration instructions, complete type definitions, and example adapters.
