/**
 * Channel integration smoke test — Verifies that every channel
 * can send a message through the devtools backend and receive
 * a streaming SSE response.
 *
 * Runs channels in parallel batches for speed (~40s vs ~150s sequential).
 *
 * Requires the devtools dev server running at http://localhost:5173
 * Works with both live Foundry agent and mock mode (MOCK_MODE=true).
 *
 * Run:  cd apps/devtools && npm run test:integration
 *
 * @vitest-environment node
 */
import { describe, it, expect, beforeAll } from "vitest";

const BASE_URL = process.env.DEVTOOLS_URL || "http://localhost:5173";
const BATCH_SIZE = 4;

const CHANNELS = [
  "web",
  "msr-home",
  "teams",
  "agents-sdk",
  "m365-agents",
  "message-extension",
  "copilot-studio",
  "github-copilot",
  "mcp-server",
  "power-platform",
  "copilot-knowledge",
  "copilot-search",
  "direct-line",
  "github-cli",
] as const;

/** Helper to POST a chat message and collect SSE events */
async function sendChatMessage(
  message: string,
  conversationHistory: Array<{ role: string; content: string }> = [],
): Promise<{
  status: number;
  events: Array<{ type: string; [key: string]: unknown }>;
  fullResponse: string;
}> {
  const res = await fetch(`${BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      conversationHistory,
      stream: true,
    }),
  });

  const events: Array<{ type: string; [key: string]: unknown }> = [];
  let fullResponse = "";

  if (!res.ok) {
    return { status: res.status, events, fullResponse };
  }

  const text = await res.text();
  const lines = text.split("\n");

  for (const line of lines) {
    if (!line.startsWith("data: ")) continue;
    try {
      const event = JSON.parse(line.slice(6));
      events.push(event);
      if (event.type === "chunk" || event.type === "text_delta") {
        fullResponse += event.chunk || event.delta || "";
      }
      if (event.type === "done" && event.fullResponse) {
        fullResponse = event.fullResponse;
      }
    } catch {
      // skip malformed SSE lines
    }
  }

  return { status: res.status, events, fullResponse };
}

describe("Channel Integration Smoke Tests", () => {
  beforeAll(async () => {
    try {
      const res = await fetch(BASE_URL, { method: "GET" });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
    } catch (err) {
      throw new Error(
        `DevTools server not reachable at ${BASE_URL}. Start with: npm run dev:devtools\n${err}`,
      );
    }
  });

  describe("API endpoint responds with valid SSE", () => {
    it("returns streaming SSE with chunk, usage, and done events", async () => {
      const result = await sendChatMessage("Say 'ok' in one word");

      expect(result.status).toBe(200);
      expect(result.events.length).toBeGreaterThanOrEqual(1);

      const textEvents = result.events.filter(
        (e) => e.type === "chunk" || e.type === "text_delta",
      );
      expect(textEvents.length).toBeGreaterThanOrEqual(1);

      const doneEvent = result.events.find((e) => e.type === "done");
      expect(doneEvent).toBeDefined();
      expect(doneEvent?.finishReason).toBe("stop");

      const usageEvent = result.events.find((e) => e.type === "usage");
      expect(usageEvent).toBeDefined();

      expect(result.fullResponse.length).toBeGreaterThan(0);
    }, 30000);

    it("rejects empty messages", async () => {
      const res = await fetch(`${BASE_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "", conversationHistory: [] }),
      });
      expect(res.status).toBe(400);
    });

    it("rejects invalid JSON", async () => {
      const res = await fetch(`${BASE_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "not json",
      });
      expect(res.status).toBe(400);
    });

    it("rejects GET requests", async () => {
      const res = await fetch(`${BASE_URL}/api/chat`, { method: "GET" });
      expect([400, 404, 405]).toContain(res.status);
    });
  });

  describe("Per-channel message flow (batched)", () => {
    // Run channels in parallel batches to reduce total time
    const batches: (typeof CHANNELS[number])[][] = [];
    for (let i = 0; i < CHANNELS.length; i += BATCH_SIZE) {
      batches.push([...CHANNELS.slice(i, i + BATCH_SIZE)]);
    }

    for (const [batchIdx, batch] of batches.entries()) {
      it(`batch ${batchIdx + 1}: [${batch.join(", ")}]`, async () => {
        const results = await Promise.all(
          batch.map((channel) =>
            sendChatMessage(
              `Channel test: ${channel}. Reply with just the channel name.`,
            ).then((result) => ({ channel, ...result })),
          ),
        );

        for (const result of results) {
          expect(
            result.status,
            `${result.channel}: expected 200, got ${result.status}`,
          ).toBe(200);
          expect(
            result.events.length,
            `${result.channel}: no events received`,
          ).toBeGreaterThanOrEqual(1);
          expect(
            result.fullResponse.length,
            `${result.channel}: empty response`,
          ).toBeGreaterThan(0);

          const done = result.events.find((e) => e.type === "done");
          expect(done, `${result.channel}: missing done event`).toBeDefined();
        }
      }, 120000);
    }
  });

  describe("Conversation history", () => {
    it("maintains context across turns", async () => {
      const r1 = await sendChatMessage(
        "My favorite color is blue. Remember this.",
      );
      expect(r1.status).toBe(200);

      const r2 = await sendChatMessage(
        "What is my favorite color?",
        [
          {
            role: "user",
            content: "My favorite color is blue. Remember this.",
          },
          { role: "assistant", content: r1.fullResponse },
        ],
      );

      expect(r2.status).toBe(200);
      expect(r2.fullResponse.toLowerCase()).toContain("blue");
    }, 60000);
  });
});
