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

  pub(raw: TInbound): MSRAgentRequest;
  sub(response: MSRAgentResponse): TOutbound;
  stream(event: MSRStreamEvent): TStreamChunk | null;
}
```

## Canonical Types

### MSRAgentRequest (inbound)

```typescript
interface MSRAgentRequest {
  type: "chat" | "search" | "tool_call" | "action";
  requestId: string;
  message: MSRMessage;
  context: MSRContext;
  stream: boolean;
  action?: { type: string; payload?: unknown };
}
```

### MSRAgentResponse (outbound)

```typescript
interface MSRAgentResponse {
  requestId: string;
  message: MSRMessage;
  cards: MSRCard[];
  references: MSRReference[];
  toolCalls: MSRToolResult[];
  usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
  suggestedActions?: MSRAction[];
  finishReason: "stop" | "length" | "content_filter" | "tool_calls" | "error";
}
```

### MSRStreamEvent (streaming)

```typescript
type MSRStreamEvent =
  | { type: "text_delta"; delta: string }
  | { type: "card"; card: MSRCard }
  | { type: "reference"; reference: MSRReference }
  | { type: "tool_start"; toolCall: { id: string; name: string; arguments: string } }
  | { type: "tool_end"; toolResult: MSRToolResult }
  | { type: "usage"; usage: { promptTokens: number; completionTokens: number; totalTokens: number } }
  | { type: "suggested_actions"; actions: MSRAction[] }
  | { type: "done"; usage?: { ... } }
  | { type: "error"; error: { code: string; message: string } };
```

## Adapter Registration

See the full [Protocol Reference](../../kits/msr-channel/docs/protocol-reference.md) for registration instructions, complete type definitions, and example adapters.
