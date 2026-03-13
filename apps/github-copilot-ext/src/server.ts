/**
 * GitHub Copilot Extension — @automoto
 *
 * Handles incoming messages from GitHub Copilot Chat and streams responses
 * using the Copilot Extensions API protocol (SSE).
 *
 * Protocol: GitHub sends POST /agent with messages array.
 * We stream back SSE events with the agent's response.
 *
 * Docs: https://docs.github.com/en/copilot/building-copilot-extensions
 */
import express from "express";
import { verify } from "@octokit/webhooks-methods";
import { handleCopilotRequest } from "./handler.js";

const app = express();
const PORT = parseInt(process.env.PORT ?? "7073", 10);
const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET ?? "";

// Raw body needed for signature verification
app.use(express.json({
  verify: (req: express.Request & { rawBody?: string }, _res, buf) => {
    req.rawBody = buf.toString();
  },
}));

// Signature verification middleware
async function verifySignature(
  req: express.Request & { rawBody?: string },
  res: express.Response,
  next: express.NextFunction,
): Promise<void> {
  if (!WEBHOOK_SECRET) {
    // Skip verification in development
    next();
    return;
  }

  const signature = req.headers["github-public-key-signature"] as string;
  if (!signature || !req.rawBody) {
    res.status(401).json({ error: "Missing signature" });
    return;
  }

  try {
    const isValid = await verify(WEBHOOK_SECRET, req.rawBody, signature);
    if (!isValid) {
      res.status(401).json({ error: "Invalid signature" });
      return;
    }
    next();
  } catch {
    res.status(401).json({ error: "Signature verification failed" });
    return;
  }
}

// Main agent endpoint
app.post("/agent", verifySignature as express.RequestHandler, async (req, res) => {
  try {
    await handleCopilotRequest(req, res);
  } catch (err) {
    console.error("[GitHub Copilot Extension] Error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "msr-github-copilot-extension" });
});

app.listen(PORT, () => {
  console.log(`🐙 GitHub Copilot Extension listening on port ${PORT}`);
  console.log(`   POST /agent — Copilot webhook endpoint`);
  console.log(`   GET  /health — Health check`);
});
