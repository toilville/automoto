/**
 * M365 Agents entry point — Express server hosting an M365 Agents SDK bot.
 * Receives activities from Teams, Outlook, and other M365 channels.
 */
import express from "express";
import {
  CloudAdapter,
  type AuthConfiguration,
} from "@microsoft/agents-hosting";
import { MSRAgentBot } from "./handlers/msr-agent-bot.js";

const port = process.env.PORT ?? 3978;

const authConfig: AuthConfiguration = {
  clientId: process.env.BOT_ID ?? "",
  clientSecret: process.env.BOT_PASSWORD ?? "",
  tenantId: process.env.BOT_TENANT_ID ?? "",
};

const adapter = new CloudAdapter(authConfig);

// Error handler
adapter.onTurnError = async (context, error) => {
  console.error("[Bot] Unhandled error:", error);
  await context.sendActivity("Sorry, something went wrong. Please try again.");
};

const bot = new MSRAgentBot();

const app = express();
app.use(express.json());

// Bot Framework messages endpoint
app.post("/api/messages", async (req, res) => {
  await adapter.process(req, res, (context) => bot.run(context));
});

// Health check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "healthy",
    app: "m365-agents",
    timestamp: new Date().toISOString(),
  });
});

app.listen(port, () => {
  console.log(`[M365 Agent] Server running on port ${port}`);
});
