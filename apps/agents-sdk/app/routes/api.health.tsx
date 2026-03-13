/**
 * GET /api/health — Health check for the Agents SDK app.
 */
import type { LoaderFunctionArgs } from "react-router";

export async function loader({ request: _request }: LoaderFunctionArgs) {
  return Response.json({
    status: process.env.AZURE_AI_PROJECTS_CONNECTION_STRING && process.env.AGENT_ID ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    app: "agents-sdk",
    services: {
      azureAiProjects: process.env.AZURE_AI_PROJECTS_CONNECTION_STRING ? "configured" : "missing",
      agentId: process.env.AGENT_ID ? "configured" : "missing",
    },
  });
}
