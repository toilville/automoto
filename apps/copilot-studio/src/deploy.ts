/**
 * Copilot Studio Deployment Helper
 *
 * Validates the agent manifest and provides deployment instructions.
 * Actual deployment is done via the Copilot Studio portal or Power Platform CLI.
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");

function validateManifest(): void {
  const manifestDir = resolve(projectRoot, "src/manifest");
  const manifestPath = resolve(manifestDir, "agent-manifest.json");
  const topicsPath = resolve(manifestDir, "topics.json");
  const pluginPath = resolve(manifestDir, "api-plugin.json");

  try {
    const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
    const topics = JSON.parse(readFileSync(topicsPath, "utf-8"));
    const plugin = JSON.parse(readFileSync(pluginPath, "utf-8"));

    console.log("✅ Agent manifest valid:", manifest.name);
    console.log("✅ Topics defined:", topics.topics.length);
    console.log("✅ API plugin valid:", plugin.name_for_human);

    console.log("\n📋 Deployment Steps:");
    console.log("1. Open https://copilotstudio.microsoft.com");
    console.log("2. Create new agent → Import from manifest");
    console.log("3. Upload the files from src/manifest/");
    console.log("4. Configure the API plugin endpoint (DATA_API_URL)");
    console.log("5. Enable Graph Connector knowledge source");
    console.log("6. Test in the Copilot Studio test pane");
    console.log("7. Publish to your M365 tenant");
    console.log("\nAlternatively, use Power Platform CLI:");
    console.log(
      "  pac copilot create --manifest src/manifest/agent-manifest.json",
    );
  } catch (err) {
    console.error("❌ Manifest validation failed:", err);
    process.exit(1);
  }
}

validateManifest();
