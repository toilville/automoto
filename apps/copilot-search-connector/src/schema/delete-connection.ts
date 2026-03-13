/**
 * Delete the Microsoft Graph external connection.
 *
 * Run: npm run schema:delete
 *
 * Removes the connection and all indexed items.
 */
import { createGraphClient } from "../index.js";
import { getConnectionConfig } from "./msr-schema.js";

async function deleteConnection() {
  const client = createGraphClient();
  const config = getConnectionConfig();

  console.log(`Deleting connection "${config.id}"...`);

  try {
    await client.api(`/external/connections/${config.id}`).delete();
    console.log("✓ Connection deleted");
  } catch (err: unknown) {
    const error = err as { statusCode?: number; message?: string };
    if (error.statusCode === 404) {
      console.log("⚠ Connection not found (already deleted?)");
    } else {
      throw err;
    }
  }
}

deleteConnection().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
