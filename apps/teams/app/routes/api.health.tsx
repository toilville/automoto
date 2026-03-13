/**
 * GET /api/health — Health check endpoint for the Teams app.
 */
import type { LoaderFunctionArgs } from "react-router";

export async function loader({ request: _request }: LoaderFunctionArgs) {
  const hasFoundryEndpoint = !!process.env.FOUNDRY_ENDPOINT;
  const hasAgentId = !!process.env.FOUNDRY_AGENT_ID;

  const status = hasFoundryEndpoint && hasAgentId ? "healthy" : "degraded";

  return Response.json({
    status,
    timestamp: new Date().toISOString(),
    app: "teams",
    services: {
      foundryAgent: hasFoundryEndpoint && hasAgentId ? "configured" : "missing",
      modelInference: process.env.MODEL_INFERENCE_ENDPOINT ? "configured" : "missing",
    },
  });
}
