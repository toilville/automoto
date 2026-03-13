/**
 * __CHANNEL_DISPLAY_NAME__ Channel Server
 *
 * Express server that receives requests from your platform,
 * normalizes them via the ChannelAdapter, forwards to the MSR Agent backend,
 * and returns the response in your platform's native format.
 */
import express from "express";
import { __CHANNEL_NAME__Adapter } from "./adapter.js";
import type { __CHANNEL_NAME__Inbound } from "./adapter.js";

const app = express();
app.use(express.json());

const adapter = new __CHANNEL_NAME__Adapter();
const PORT = parseInt(process.env.PORT ?? "3100", 10);

// TODO: Set this to your MSR Agent backend or gateway URL
const AGENT_BACKEND_URL =
  process.env.AGENT_BACKEND_URL ?? "http://localhost:4000/api/v1/__CHANNEL_ID__";

/* ── Health ───────────────────────────────────────────────── */

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    channel: adapter.type,
    name: adapter.name,
    supportsStreaming: adapter.supportsStreaming,
  });
});

/* ── Inbound Endpoint ─────────────────────────────────────── */
// TODO: Replace this with your platform's webhook/callback endpoint pattern.

app.post("/api/messages", async (req, res) => {
  try {
    // 1. Parse platform-native payload
    const nativePayload: __CHANNEL_NAME__Inbound = req.body;

    // 2. pub() — Normalize to canonical AgentRequest
    const canonicalRequest = adapter.pub(nativePayload);

    // 3. Forward to agent backend
    const agentResponse = await fetch(AGENT_BACKEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(canonicalRequest),
    });

    if (!agentResponse.ok) {
      throw new Error(`Agent backend returned ${agentResponse.status}`);
    }

    const canonicalResponse = await agentResponse.json();

    // 4. sub() — Format canonical response to platform-native
    const nativeResponse = adapter.sub(canonicalResponse);

    res.json(nativeResponse);
  } catch (error) {
    console.error("Error processing message:", error);
    res.status(500).json({
      text: "Sorry, something went wrong processing your request.",
    });
  }
});

/* ── Start ────────────────────────────────────────────────── */

app.listen(PORT, () => {
  console.log(
    `🚀 ${adapter.name} channel listening on http://localhost:${PORT}`,
  );
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   Messages: POST http://localhost:${PORT}/api/messages`);
});
