/**
 * POST /api/chat — Streams agent responses as SSE.
 *
 * Supports two backends:
 * - **Live mode** (default): Calls the Azure AI Foundry agent via DefaultAzureCredential
 * - **Mock mode** (MOCK_MODE=true): Returns canned responses instantly — no auth needed
 */
import type { ActionFunctionArgs } from "react-router";
import { streamAgentResponse } from "~/services/foundry-agent.server";
import { streamMockResponse, isMockMode } from "~/services/mock-agent.server";
import type { ChatRequest } from "~/models/types";

const MAX_MESSAGE_LENGTH = 4000;
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

  return {
    valid: true,
    data: {
      message: req.message.trim(),
      conversationHistory: history as ChatRequest["conversationHistory"],
      stream: req.stream !== false,
    },
  };
}

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

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

  try {
    const stream = isMockMode()
      ? await streamMockResponse(validation.data)
      : await streamAgentResponse(validation.data);

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("[devtools/api.chat] Agent error:", error);

    const message = error instanceof Error ? error.message : "Internal server error";

    return Response.json(
      { error: "Chat service unavailable", detail: message },
      { status: 502 },
    );
  }
}
