/**
 * Create the Microsoft Graph external connection and schema.
 *
 * Run: npm run schema:create
 *
 * This creates the connection in Microsoft Graph and registers the schema
 * so Microsoft Search and Copilot know how to index and display Automoto content.
 */
import { createGraphClient } from "../index.js";
import { AUTOMOTO_CONTENT_SCHEMA, getConnectionConfig } from "./content-schema.js";

async function createConnection() {
  const client = createGraphClient();
  const config = getConnectionConfig();

  console.log(`Creating connection "${config.id}"...`);

  // Step 1: Create the external connection
  try {
    await client.api("/external/connections").post({
      id: config.id,
      name: config.name,
      description: config.description,
    });
    console.log("✓ Connection created");
  } catch (err: unknown) {
    const error = err as { statusCode?: number; message?: string };
    if (error.statusCode === 409) {
      console.log("⚠ Connection already exists, updating schema...");
    } else {
      throw err;
    }
  }

  // Step 2: Register the schema
  console.log("Registering schema...");
  try {
    await client
      .api(`/external/connections/${config.id}/schema`)
      .patch({
        baseType: "microsoft.graph.externalItem",
        properties: AUTOMOTO_CONTENT_SCHEMA,
      });
    console.log("✓ Schema registered (provisioning may take a few minutes)");
  } catch (err) {
    console.error("✗ Failed to register schema:", err);
    throw err;
  }

  console.log("\nDone! The connection is being provisioned.");
  console.log("Check status: GET /external/connections/" + config.id);
}

createConnection().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
