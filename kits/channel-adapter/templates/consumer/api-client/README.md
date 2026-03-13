# Agent API Client Examples

Call the Agent directly via REST API — no UI, no SDK. Use these examples to integrate from any language or platform.

## Endpoint

```
POST {GATEWAY_URL}/api/v1/{channel}
Content-Type: application/json
```

Where `{channel}` is one of the registered channel types (e.g., `web`, `teams`, `agents-sdk`).

## Canonical Request Shape (AgentRequest)

```json
{
  "type": "chat",
  "requestId": "unique-uuid",
  "message": {
    "id": "msg-uuid",
    "role": "user",
    "content": "What research is happening in quantum computing?",
    "timestamp": "2026-01-15T10:30:00Z"
  },
  "context": {
    "channel": { "type": "web", "id": "my-app" },
    "conversation": {
      "id": "conv-123",
      "history": []
    },
    "scope": {
      "event": "Research Summit 2026"
    }
  },
  "stream": false
}
```

## Canonical Response Shape (AgentResponse)

```json
{
  "requestId": "unique-uuid",
  "message": {
    "id": "resp-uuid",
    "role": "assistant",
    "content": "Here are the latest quantum computing research highlights...",
    "timestamp": "2026-01-15T10:30:01Z"
  },
  "cards": [
    {
      "id": "card-1",
      "kind": "research-paper",
      "title": "Quantum Error Correction Advances",
      "data": { "description": "...", "authors": ["..."] },
      "url": "https://..."
    }
  ],
  "references": [],
  "toolCalls": [],
  "finishReason": "stop"
}
```

## Streaming (SSE)

Set `"stream": true` in the request. The response is a Server-Sent Events stream:

```
event: text_delta
data: {"delta":"Here are"}

event: text_delta
data: {"delta":" the latest"}

event: card
data: {"id":"card-1","kind":"research-paper","title":"..."}

event: done
data: {"usage":{"promptTokens":150,"completionTokens":200}}
```
