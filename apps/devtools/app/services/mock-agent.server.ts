/**
 * Mock Agent — Returns canned SSE responses without hitting Foundry.
 *
 * Enabled by setting MOCK_MODE=true in .env or environment.
 * Useful for fast iteration, CI, and offline development.
 */
import type { ChatRequest, StreamEvent } from "~/models/types";

const MOCK_RESPONSES: Record<string, string> = {
  default:
    "This is a mock response from the DevTools mock agent. The real Foundry agent is not connected. Set `MOCK_MODE=false` in your `.env` file to use the live agent.",
  hello: "Hello! I'm the mock agent. I respond instantly without needing Azure credentials.",
  help: "Available mock commands: hello, help, error, slow, cards. Any other message gets a default response.",
  error: "__ERROR__",
  slow: "__SLOW__",
  cards: "__CARDS__",
};

function pickResponse(message: string): string {
  const lower = message.toLowerCase().trim();
  for (const [key, value] of Object.entries(MOCK_RESPONSES)) {
    if (lower.includes(key) && key !== "default") return value;
  }
  return MOCK_RESPONSES.default;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Stream a mock agent response as SSE — same format as the real Foundry agent.
 */
export async function streamMockResponse(
  request: ChatRequest,
): Promise<ReadableStream<Uint8Array>> {
  const encoder = new TextEncoder();
  const response = pickResponse(request.message);

  return new ReadableStream({
    async start(controller) {
      function send(event: StreamEvent) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      }

      try {
        if (response === "__ERROR__") {
          send({ type: "error", message: "Mock error: simulated failure", code: "MOCK_ERROR" });
          controller.close();
          return;
        }

        const isSlowMode = response === "__SLOW__";
        const text = isSlowMode
          ? "This is a slow mock response that simulates realistic streaming latency..."
          : response === "__CARDS__"
            ? "Here are some sample cards from the mock agent."
            : response;

        // Stream text in chunks (simulates real streaming)
        const words = text.split(" ");
        for (let i = 0; i < words.length; i++) {
          const chunk = (i === 0 ? "" : " ") + words[i];
          send({ type: "chunk", chunk, id: `chunk-${i}`, index: i });
          if (isSlowMode) await delay(200);
          else await delay(20);
        }

        // Send cards if requested
        if (response === "__CARDS__") {
          send({
            type: "cards",
            cards: [
              { id: "card-1", cardKind: "event", title: "Mock Event: AI Research Summit 2025" },
              { id: "card-2", cardKind: "publication", title: "Mock Publication: Advances in LLM Reasoning" },
            ],
          });
        }

        // Usage event
        send({
          type: "usage",
          usage: {
            promptTokens: 42,
            completionTokens: words.length,
            totalTokens: 42 + words.length,
          },
        });

        // Done event
        send({
          type: "done",
          finishReason: "stop",
          fullResponse: text,
        });
      } catch (err) {
        send({
          type: "error",
          message: err instanceof Error ? err.message : "Mock stream error",
        });
      } finally {
        controller.close();
      }
    },
  });
}

/** Check if mock mode is enabled */
export function isMockMode(): boolean {
  return process.env.MOCK_MODE === "true";
}
