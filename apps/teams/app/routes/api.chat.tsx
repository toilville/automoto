/**
 * POST /api/chat — Thin proxy to Foundry Agent.
 *
 * Same pattern as the msr-home app:
 *   - Input validation & sanitization
 *   - Rate limiting (in-memory, per-IP)
 *   - SSE stream relay
 */
import type { ActionFunctionArgs } from "react-router";
import { streamAgentResponse } from "~/services/foundry-agent.server";
import type { ChatRequest } from "@msr/chat-ui";

/* ── Rate Limiting (in-memory, per-IP) ────────────────────── */

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 60;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  entry.count++;
  return entry.count <= RATE_LIMIT_MAX;
}

/* ── Input Validation ─────────────────────────────────────── */

const MAX_MESSAGE_LENGTH = 2000;
const MAX_HISTORY_TURNS = 50;

function validateRequest(body: unknown): { valid: true; data: ChatRequest } | { valid: false; error: string } {
  if (!body || typeof body !== "object") {
    return { valid: false, error: "Request body is required" };
  }

  const req = body as Record<string, unknown>;

  if (typeof req.message !== "string" || req.message.trim().length === 0) {
    return { valid: false, error: "Message is required" };
  }

  if (req.message.length > MAX_MESSAGE_LENGTH) {
    return { valid: false, error: `Message exceeds ${MAX_MESSAGE_LENGTH} characters` };
  }

  const history = Array.isArray(req.conversationHistory) ? req.conversationHistory : [];
  if (history.length > MAX_HISTORY_TURNS) {
    return { valid: false, error: `History exceeds ${MAX_HISTORY_TURNS} turns` };
  }

  for (const entry of history) {
    if (typeof entry !== "object" || !entry) continue;
    const e = entry as Record<string, unknown>;
    if (e.role !== "user" && e.role !== "assistant") {
      return { valid: false, error: "Invalid history entry role" };
    }
    if (typeof e.content !== "string") {
      return { valid: false, error: "Invalid history entry content" };
    }
  }

  return {
    valid: true,
    data: {
      message: req.message.trim(),
      conversationHistory: history as ChatRequest["conversationHistory"],
      action: req.action as ChatRequest["action"],
      pageContext: req.pageContext as ChatRequest["pageContext"],
      stream: req.stream !== false,
    },
  };
}

/* ── Route Handler ────────────────────────────────────────── */

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Rate limit
  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!checkRateLimit(clientIp)) {
    return Response.json(
      { error: "Rate limit exceeded. Please wait before sending more messages." },
      { status: 429 },
    );
  }

  // Parse & validate
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const validation = validateRequest(body);
  if (!validation.valid) {
    return Response.json({ error: validation.error }, { status: 400 });
  }

  const chatRequest = validation.data;

  // Stream response from Foundry Agent
  try {
    const stream = await streamAgentResponse(chatRequest);

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
    const message = error instanceof Error ? error.message : "Internal server error";
    return Response.json(
      { error: "Chat service unavailable", detail: message },
      { status: 502 },
    );
  }
}
