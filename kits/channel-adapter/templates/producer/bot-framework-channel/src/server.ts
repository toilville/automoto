/**
 * __CHANNEL_DISPLAY_NAME__ Channel Server (Bot Framework)
 *
 * Express server that acts as a Bot Framework messaging endpoint.
 * Receives Activity payloads, normalizes them via the adapter,
 * forwards to the MSR Agent backend, and replies.
 */
import express from "express";
import { __CHANNEL_NAME__Adapter } from "./adapter.js";
import type { BotFrameworkInbound } from "./adapter.js";

const app = express();
app.use(express.json());

const adapter = new __CHANNEL_NAME__Adapter();
const PORT = parseInt(process.env.PORT ?? "3100", 10);
const AGENT_BACKEND_URL =
  process.env.AGENT_BACKEND_URL ??
  "http://localhost:4000/api/v1/__CHANNEL_ID__";

/* ── Health ───────────────────────────────────────────────── */

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    channel: adapter.type,
    name: adapter.name,
  });
});

/* ── Bot Framework Messaging Endpoint ─────────────────────── */

app.post("/api/messages", async (req, res) => {
  try {
    // TODO: Verify Bot Framework authentication (see botbuilder docs)
    const activity = req.body;

    if (activity.type !== "message" && !activity.type?.startsWith("composeExtension")) {
      // Skip non-message activities (e.g., conversationUpdate)
      res.status(200).json({});
      return;
    }

    const inbound: BotFrameworkInbound = {
      text: activity.text ?? "",
      conversationId: activity.conversation?.id ?? "unknown",
      memberId: activity.from?.id,
      type: activity.type,
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

    // Reply to the conversation via Bot Framework
    // TODO: Use BotFrameworkAdapter from botbuilder SDK for proper turn context
    res.json({
      type: "message",
      text: nativeResponse.text,
      attachments: nativeResponse.attachments,
    });
  } catch (error) {
    console.error("Error processing activity:", error);
    res.status(500).json({
      type: "message",
      text: "Sorry, something went wrong.",
    });
  }
});

/* ── Start ────────────────────────────────────────────────── */

app.listen(PORT, () => {
  console.log(
    `🤖 ${adapter.name} Bot Framework channel on http://localhost:${PORT}`,
  );
  console.log(`   Messages: POST http://localhost:${PORT}/api/messages`);
});
