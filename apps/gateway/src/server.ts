import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import { createProxyMiddleware, type Options } from "http-proxy-middleware";
import { loggingMiddleware } from "./middleware/logging.js";
import { rateLimitMiddleware } from "./middleware/rate-limit.js";
import { healthHandler } from "./health.js";
import { registryHandler } from "./registry.js";
import { normalizedRouter } from "./normalized.js";

export interface ServiceDefinition {
  name: string;
  prefix: string;
  upstream: string;
  description: string;
}

const PORT = parseInt(process.env.PORT ?? "8080", 10);

const services: ServiceDefinition[] = [
  { name: "chat", prefix: "/chat", upstream: process.env.CHAT_UPSTREAM ?? "http://localhost:5173", description: "Web chat app" },
  { name: "msr-home", prefix: "/msr-home", upstream: process.env.MSR_HOME_UPSTREAM ?? "http://localhost:5174", description: "MSR homepage chat" },
  { name: "teams", prefix: "/teams", upstream: process.env.TEAMS_UPSTREAM ?? "http://localhost:5175", description: "Teams app" },
  { name: "agents-sdk", prefix: "/agents-sdk", upstream: process.env.AGENTS_SDK_UPSTREAM ?? "http://localhost:5176", description: "Azure AI Agents SDK" },
  { name: "m365", prefix: "/m365", upstream: process.env.M365_UPSTREAM ?? "http://localhost:3978", description: "M365 Bot Framework" },
  { name: "message-ext", prefix: "/message-ext", upstream: process.env.MESSAGE_EXT_UPSTREAM ?? "http://localhost:7074", description: "Teams message extension" },
  { name: "copilot-knowledge", prefix: "/copilot-knowledge", upstream: process.env.COPILOT_KNOWLEDGE_UPSTREAM ?? "http://localhost:8081", description: "Copilot knowledge connector" },
  { name: "power-platform", prefix: "/power-platform", upstream: process.env.POWER_PLATFORM_UPSTREAM ?? "http://localhost:7072", description: "Power Platform connector" },
  { name: "github-copilot", prefix: "/github-copilot", upstream: process.env.GITHUB_COPILOT_UPSTREAM ?? "http://localhost:7073", description: "GitHub Copilot extension" },
  { name: "direct-line", prefix: "/direct-line", upstream: process.env.DIRECT_LINE_UPSTREAM ?? "http://localhost:7075", description: "Direct Line WebChat widget" },
  { name: "mcp", prefix: "/mcp", upstream: process.env.MCP_UPSTREAM ?? "http://localhost:3100", description: "MCP SSE server" },
];

const app = express();

// Global middleware
app.use(cors());
app.use(loggingMiddleware());
app.use(
  rateLimitMiddleware({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? "60000", 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS ?? "120", 10),
  })
);

// Gateway endpoints
app.get("/health", healthHandler(services));
app.get("/api/services", registryHandler(services, PORT));

// Normalized adapter endpoint — single typed pipeline for all channels
app.use(express.json());
app.use("/api/v1", normalizedRouter());

// Proxy routes
for (const service of services) {
  const proxyOptions: Options = {
    target: service.upstream,
    changeOrigin: true,
    pathRewrite: { [`^${service.prefix}`]: "" },
    ws: true,
    on: {
      proxyReq: (_proxyReq, req) => {
        // Tag request for logging
        (req as unknown as Record<string, unknown>).__gatewayService = service.name;
        (req as unknown as Record<string, unknown>).__gatewayUpstream = service.upstream;
      },
      proxyRes: (proxyRes, _req, res) => {
        // Disable buffering for SSE streams
        const contentType = proxyRes.headers["content-type"] ?? "";
        if (contentType.includes("text/event-stream")) {
          (res as Response).flushHeaders();
          proxyRes.headers["cache-control"] = "no-cache";
          proxyRes.headers["x-accel-buffering"] = "no";
        }
      },
      error: (err, _req, res) => {
        const message = err instanceof Error ? err.message : "Proxy error";
        console.error(`✗ Proxy error [${service.name}]: ${message}`);

        // res could be a Socket for WS upgrades — only send JSON for HTTP
        if ("writeHead" in res && !("headersSent" in res && (res as Response).headersSent)) {
          (res as Response).status(502).json({
            error: "Bad Gateway",
            service: service.name,
            message: `Upstream ${service.name} (${service.upstream}) is unreachable`,
          });
        }
      },
    },
  };

  app.use(service.prefix, createProxyMiddleware(proxyOptions));
}

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: "Not Found",
    message: "No service matched the requested path. GET /api/services for available routes.",
  });
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled error:", err.message);
  res.status(500).json({
    error: "Internal Server Error",
    message: process.env.NODE_ENV === "production" ? "An unexpected error occurred" : err.message,
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`\n🚀 API Gateway listening on http://localhost:${PORT}`);
  console.log(`   Mode: reverse-proxy`);
  console.log(`   Services: ${services.length}`);
  console.log(`\n   Routes:`);
  for (const svc of services) {
    console.log(`     ${svc.prefix.padEnd(22)} → ${svc.upstream.padEnd(30)} (${svc.description})`);
  }
  console.log(`\n   GET /health         — Aggregated health check`);
  console.log(`   GET /api/services   — Service registry`);
  console.log(`   GET /api/v1/adapters — List channel adapters`);
  console.log(`   POST /api/v1/:channel — Normalized endpoint (msr.pub → msr.sub/stream)\n`);
});

// Graceful shutdown
function shutdown(signal: string) {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  server.close(() => {
    console.log("Gateway closed.");
    process.exit(0);
  });

  // Force exit after 10s
  setTimeout(() => {
    console.error("Forced shutdown after timeout.");
    process.exit(1);
  }, 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

export { app, services };
