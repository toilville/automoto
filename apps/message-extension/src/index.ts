/**
 * MSR Message Extension entry point — Express server hosting an M365 Agents SDK
 * messaging extension. Receives composeExtension/* activities from Teams and Outlook.
 */
import express from "express";
import {
  CloudAdapter,
  type AuthConfiguration,
} from "@microsoft/agents-hosting";
import { SearchExtension } from "./handlers/search-handler.js";

const port = process.env.PORT ?? 7074;

const authConfig: AuthConfiguration = {
  clientId: process.env.BOT_ID ?? "",
  clientSecret: process.env.BOT_PASSWORD ?? "",
  tenantId: process.env.BOT_TENANT_ID ?? "",
};

const adapter = new CloudAdapter(authConfig);

adapter.onTurnError = async (context, error) => {
  console.error("[MessageExtension] Unhandled error:", error);
  await context.sendActivity("Sorry, something went wrong. Please try again.");
};

const handler = new SearchExtension();

const app = express();
app.use(express.json());

// Bot Framework messages endpoint
app.post("/api/messages", async (req, res) => {
  await adapter.process(req, res, (context) => handler.run(context));
});

// Health check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "healthy",
    app: "message-extension",
    timestamp: new Date().toISOString(),
  });
});

app.listen(port, () => {
  console.log(`[Message Extension] Server running on port ${port}`);
});
