/**
 * Copilot Search Connector — Main entry point.
 *
 * A Microsoft Graph connector that indexes content (publications,
 * researchers, projects, news) for Microsoft Search and Microsoft 365 Copilot.
 *
 * Usage:
 *   npm run schema:create   # Create the connection + schema in Graph
 *   npm run ingest           # Push content items to the connection
 *   npm run schema:delete    # Tear down the connection
 */

import { TokenCredentialAuthenticationProvider } from "@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials/index.js";
import { ClientSecretCredential } from "@azure/identity";
import { Client } from "@microsoft/microsoft-graph-client";

export function createGraphClient(): Client {
  const tenantId = process.env.AZURE_TENANT_ID;
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;

  if (!tenantId || !clientId || !clientSecret) {
    throw new Error(
      "AZURE_TENANT_ID, AZURE_CLIENT_ID, and AZURE_CLIENT_SECRET are required",
    );
  }

  const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
  const authProvider = new TokenCredentialAuthenticationProvider(credential, {
    scopes: ["https://graph.microsoft.com/.default"],
  });

  return Client.initWithMiddleware({ authProvider });
}

// If run directly, show help
const isMain = process.argv[1]?.endsWith("index.ts") || process.argv[1]?.endsWith("index.js");
if (isMain) {
  console.log(`
Copilot Search Connector
=============================
Commands:
  npm run schema:create    Create Graph connection and schema
  npm run schema:delete    Delete Graph connection
  npm run ingest           Index content into the connection

Environment:
  CONNECTION_ID:   ${process.env.CONNECTION_ID ?? "(not set)"}
  DATA_API_URL:    ${process.env.DATA_API_URL ?? "(not set)"}
  AZURE_TENANT_ID: ${process.env.AZURE_TENANT_ID ? "✓" : "✗"}
  AZURE_CLIENT_ID: ${process.env.AZURE_CLIENT_ID ? "✓" : "✗"}
`);
}
