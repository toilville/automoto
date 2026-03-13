/**
 * POST /api/chat — Proxies to Azure AI Agent Service via the SDK.
 */
import type { ActionFunctionArgs } from "react-router";
import { streamAgentResponse } from "~/services/agent-client.server";

/* ── Rate Limiting ────────────────────────────────────────── */

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  entry.count++;
  return entry.count <= 60;
}

/* ── Handler ──────────────────────────────────────────────── */

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!checkRateLimit(clientIp)) {
    return Response.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message || message.length > 2000) {
    return Response.json({ error: "Invalid message" }, { status: 400 });
  }

  const history = Array.isArray(body.conversationHistory)
    ? (body.conversationHistory as Array<{ role: "user" | "assistant"; content: string }>)
    : [];

  try {
    const stream = await streamAgentResponse({ message, conversationHistory: history });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("[api.chat] Agent error:", error);
    return Response.json(
      { error: "Agent service unavailable", detail: error instanceof Error ? error.message : "Unknown" },
      { status: 502 },
    );
  }
}
