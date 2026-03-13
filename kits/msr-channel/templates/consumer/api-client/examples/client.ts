/**
 * MSR Agent API Client — TypeScript Example
 *
 * Demonstrates calling the MSR Agent backend directly via REST API.
 * No UI framework needed — works in Node.js, Deno, Bun, or browser.
 */

const GATEWAY_URL =
  process.env.MSR_GATEWAY_URL ?? "http://localhost:4000";
const CHANNEL = "web";

interface MSRAgentRequest {
  type: "chat" | "search" | "tool_call" | "action";
  requestId: string;
  message: { id: string; role: string; content: string; timestamp: string };
  context: {
    channel: { type: string; id: string };
    conversation: { id: string; history: unknown[] };
    scope?: { event?: string };
  };
  stream: boolean;
}

interface MSRAgentResponse {
  requestId: string;
  message: { id: string; role: string; content: string; timestamp: string };
  cards: Array<{
    id: string;
    kind: string;
    title: string;
    data: Record<string, unknown>;
    url?: string;
  }>;
  references: unknown[];
  finishReason: string;
}

/* ── Non-streaming request ────────────────────────────────── */

async function chat(userMessage: string): Promise<MSRAgentResponse> {
  const request: MSRAgentRequest = {
    type: "chat",
    requestId: crypto.randomUUID(),
    message: {
      id: crypto.randomUUID(),
      role: "user",
      content: userMessage,
      timestamp: new Date().toISOString(),
    },
    context: {
      channel: { type: CHANNEL, id: "api-client-example" },
      conversation: { id: `conv-${Date.now()}`, history: [] },
    },
    stream: false,
  };

  const response = await fetch(`${GATEWAY_URL}/api/v1/${CHANNEL}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }

  return response.json();
}

/* ── Streaming request ────────────────────────────────────── */

async function chatStream(userMessage: string): Promise<void> {
  const request: MSRAgentRequest = {
    type: "chat",
    requestId: crypto.randomUUID(),
    message: {
      id: crypto.randomUUID(),
      role: "user",
      content: userMessage,
      timestamp: new Date().toISOString(),
    },
    context: {
      channel: { type: CHANNEL, id: "api-client-example" },
      conversation: { id: `conv-${Date.now()}`, history: [] },
    },
    stream: true,
  };

  const response = await fetch(`${GATEWAY_URL}/api/v1/${CHANNEL}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!response.ok || !response.body) {
    throw new Error(`HTTP ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    // Parse SSE events
    for (const line of chunk.split("\n")) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6);
        if (data === "[DONE]") {
          console.log("\n--- Stream complete ---");
          return;
        }
        try {
          const event = JSON.parse(data);
          if (event.delta) process.stdout.write(event.delta);
        } catch {
          // Non-JSON data line
        }
      }
    }
  }
}

/* ── Main ─────────────────────────────────────────────────── */

async function main() {
  console.log("=== Non-streaming ===");
  const result = await chat("What events are happening this month?");
  console.log("Response:", result.message.content);
  console.log("Cards:", result.cards.length);

  console.log("\n=== Streaming ===");
  await chatStream("Tell me about AI research at MSR");
}

main().catch(console.error);
