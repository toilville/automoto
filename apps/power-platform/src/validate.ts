import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ApiDefinition {
  swagger: string;
  info: { title: string; version: string };
  paths: Record<string, Record<string, { operationId: string; summary: string }>>;
}

interface ApiProperties {
  properties: {
    connectionParameters: Record<string, unknown>;
    publisher: string;
  };
}

async function loadJson<T>(filePath: string): Promise<T> {
  const raw = await readFile(filePath, "utf-8");
  return JSON.parse(raw) as T;
}

async function main(): Promise<void> {
  const connectorDir = path.resolve(__dirname, "connector");
  const defPath = path.join(connectorDir, "apiDefinition.json");
  const propPath = path.join(connectorDir, "apiProperties.json");

  console.log("Validating Power Platform connector files...\n");

  // Validate apiDefinition.json
  let definition: ApiDefinition;
  try {
    definition = await loadJson<ApiDefinition>(defPath);
    console.log(`✓ apiDefinition.json parsed successfully`);
    console.log(`  Title:   ${definition.info.title}`);
    console.log(`  Version: ${definition.info.version}`);
    console.log(`  Swagger: ${definition.swagger}`);
  } catch (err) {
    console.error(`✗ apiDefinition.json failed to parse: ${err}`);
    process.exit(1);
  }

  // List operations
  const operations: { method: string; path: string; operationId: string; summary: string }[] = [];
  for (const [routePath, methods] of Object.entries(definition.paths)) {
    for (const [method, op] of Object.entries(methods)) {
      operations.push({
        method: method.toUpperCase(),
        path: routePath,
        operationId: op.operationId,
        summary: op.summary,
      });
    }
  }

  console.log(`\n  Operations (${operations.length}):`);
  for (const op of operations) {
    console.log(`    ${op.method.padEnd(6)} ${op.path.padEnd(25)} ${op.operationId.padEnd(22)} ${op.summary}`);
  }

  // Validate apiProperties.json
  let properties: ApiProperties;
  try {
    properties = await loadJson<ApiProperties>(propPath);
    console.log(`\n✓ apiProperties.json parsed successfully`);
    console.log(`  Publisher: ${properties.properties.publisher}`);
  } catch (err) {
    console.error(`\n✗ apiProperties.json failed to parse: ${err}`);
    process.exit(1);
  }

  // Deployment instructions
  console.log("\n─────────────────────────────────────────────");
  console.log("Deployment instructions:");
  console.log("─────────────────────────────────────────────");
  console.log("\n1. Install the Power Platform CLI:");
  console.log("   pip install paconn\n");
  console.log("2. Login to your Power Platform environment:");
  console.log("   paconn login\n");
  console.log("3. Create the custom connector:");
  console.log("   paconn create --api-def src/connector/apiDefinition.json --api-prop src/connector/apiProperties.json\n");
  console.log("4. To update an existing connector:");
  console.log("   paconn update --api-def src/connector/apiDefinition.json --api-prop src/connector/apiProperties.json\n");

  console.log("All validations passed ✓");
}

main().catch((err) => {
  console.error("Validation failed:", err);
  process.exit(1);
});
