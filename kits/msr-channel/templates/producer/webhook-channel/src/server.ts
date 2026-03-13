/**
 * __CHANNEL_DISPLAY_NAME__ Webhook Server
 *
 * Minimal Express server for a webhook-based channel.
 * Receives a webhook POST, normalizes, forwards to agent, returns response.
 */
import express from "express";
import crypto from "node:crypto";
import { __CHANNEL_NAME__Adapter } from "./adapter.js";
import type { WebhookInbound } from "./adapter.js";

const app = express();
app.use(express.json());

const adapter = new __CHANNEL_NAME__Adapter();
const PORT = parseInt(process.env.PORT ?? "3100", 10);
const AGENT_BACKEND_URL =
  process.env.AGENT_BACKEND_URL ??
  "http://localhost:4000/api/v1/__CHANNEL_ID__";

// TODO: Set this to your webhook's verification secret
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

/* ── Webhook Verification (optional) ──────────────────────── */

function verifySignature(
  body: string,
  signature: string | undefined,
): boolean {
  if (!WEBHOOK_SECRET || !signature) return !WEBHOOK_SECRET; // skip if no secret configured
  const expected = crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(body)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected),
  );
}

/* ── Health ───────────────────────────────────────────────── */

app.get("/health", (_req, res) => {
  res.json({ status: "ok", channel: adapter.type });
});

/* ── Webhook Endpoint ─────────────────────────────────────── */

app.post("/webhook", async (req, res) => {
  try {
    // Verify signature if configured
    const sig = req.headers["x-signature"] as string | undefined;
    if (!verifySignature(JSON.stringify(req.body), sig)) {
      res.status(401).json({ error: "Invalid signature" });
      return;
    }

    const inbound: WebhookInbound = {
      text: req.body.text ?? req.body.message ?? "",
      sourceId: req.body.sourceId ?? req.body.channel ?? "unknown",
      userId: req.body.userId ?? req.body.user,
      signature: sig,
    };

    const canonicalRequest = adapter.pub(inbound);

    const agentResponse = await fetch(AGENT_BACKEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(canonicalRequest),
    });

    if (!agentResponse.ok) {
      throw new Error(`Agent backend returned ${agentResponse.status}`);
    }

    const canonicalResponse = await agentResponse.json();
    const nativeResponse = adapter.sub(canonicalResponse);

    res.json(nativeResponse);
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).json({ text: "Error processing webhook." });
  }
});

/* ── Start ────────────────────────────────────────────────── */

app.listen(PORT, () => {
  console.log(
    `🪝 ${adapter.name} webhook channel on http://localhost:${PORT}`,
  );
  console.log(`   Webhook: POST http://localhost:${PORT}/webhook`);
});
