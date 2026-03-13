/**
 * Azure AI Agent Service client — direct SDK usage.
 *
 * Uses @azure/ai-projects to create threads, run agents, and stream
 * responses without an intermediate web proxy layer.
 */
import { AIProjectClient } from "@azure/ai-projects";
import { DefaultAzureCredential } from "@azure/identity";

let _client: AIProjectClient | null = null;

function getClient(): AIProjectClient {
  if (!_client) {
    const endpoint = process.env.AZURE_AI_PROJECTS_CONNECTION_STRING;
    if (!endpoint) {
      throw new Error("AZURE_AI_PROJECTS_CONNECTION_STRING is required");
    }
    _client = AIProjectClient.fromEndpoint(
      endpoint,
      new DefaultAzureCredential(),
    );
  }
  return _client;
}

export interface AgentChatRequest {
  message: string;
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>;
  threadId?: string;
}

/**
 * Streams a response from the Azure AI Agent Service.
 * Returns a ReadableStream of SSE-formatted events compatible with @msr/chat-ui.
 */
export async function streamAgentResponse(request: AgentChatRequest): Promise<ReadableStream> {
  const client = getClient();
  const agentId = process.env.AGENT_ID;
  if (!agentId) throw new Error("AGENT_ID is required");

  // Create or reuse thread
  const thread = request.threadId
    ? { id: request.threadId }
    : await client.agents.threads.create();

  // Add user message to thread
  await client.agents.messages.create(thread.id, "user", request.message);

  // Start streaming run
  const runStream = await client.agents.runs.create(thread.id, agentId).stream();

  const encoder = new TextEncoder();
  let fullResponse = "";
  let chunkIndex = 0;

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const event of runStream) {
          if (event.event === "thread.message.delta") {
            const delta = event.data as { id: string; delta: { content?: Array<{ type: string; text?: { value?: string } }> } };
            if (delta.delta?.content) {
              for (const part of delta.delta.content) {
                if (part.type === "text" && part.text?.value) {
                  const chunk = part.text.value;
                  fullResponse += chunk;
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({
                      type: "chunk",
                      chunk,
                      id: delta.id,
                      index: chunkIndex++,
                    })}\n\n`),
                  );
                }
              }
            }
          } else if (event.event === "thread.run.completed") {
            const run = event.data as { usage?: { promptTokens: number; completionTokens: number; totalTokens: number } };
            const usage = run.usage;
            if (usage) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({
                  type: "usage",
                  usage: {
                    promptTokens: usage.promptTokens,
                    completionTokens: usage.completionTokens,
                    totalTokens: usage.totalTokens,
                  },
                })}\n\n`),
              );
            }
          } else if (event.event === "thread.run.failed") {
            const run = event.data as { lastError?: { message: string } | null };
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({
                type: "error",
                message: run.lastError?.message ?? "Agent run failed",
              })}\n\n`),
            );
          }
        }

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({
            type: "done",
            finishReason: "stop",
            fullResponse,
          })}\n\n`),
        );
      } catch (err) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({
            type: "error",
            message: err instanceof Error ? err.message : "Stream error",
          })}\n\n`),
        );
      } finally {
        controller.close();
      }
    },
  });
}
