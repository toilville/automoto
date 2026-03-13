/**
 * Content ingestion service — fetches MSR content from the data API
 * and pushes it to the Microsoft Graph connector as external items.
 *
 * Run: npm run ingest
 *
 * Handles publications, researchers, and projects. Each item is mapped
 * to the MSR content schema and pushed as a Graph externalItem.
 */
import { createGraphClient } from "../index.js";
import { getConnectionConfig } from "../schema/msr-schema.js";

const BATCH_SIZE = parseInt(process.env.INGESTION_BATCH_SIZE ?? "50", 10);
const RATE_LIMIT_MS = parseInt(process.env.INGESTION_RATE_LIMIT_MS ?? "500", 10);
const DATA_API_URL = process.env.DATA_API_URL ?? "http://localhost:7071";

interface ExternalItem {
  id: string;
  properties: Record<string, unknown>;
  content: {
    type: "text" | "html";
    value: string;
  };
  acl: Array<{
    type: "everyone" | "user" | "group";
    value: string;
    accessType: "grant" | "deny";
  }>;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetches content from the data API and converts to Graph external items.
 */
async function fetchPublications(): Promise<ExternalItem[]> {
  try {
    const res = await fetch(`${DATA_API_URL}/api/publications?limit=100`);
    if (!res.ok) throw new Error(`Data API returned ${res.status}`);
    const data = (await res.json()) as Array<Record<string, unknown>>;

    return data.map((pub) => ({
      id: `pub-${pub.id}`,
      properties: {
        contentType: "publication",
        title: pub.title ?? "",
        description: pub.abstract ?? "",
        url: pub.url ?? "",
        authors: pub.authors ?? [],
        abstract: pub.abstract ?? "",
        publicationDate: pub.date ?? null,
        researchAreas: pub.researchAreas ?? [],
        lastModifiedDateTime: pub.updatedAt ?? new Date().toISOString(),
        createdBy: Array.isArray(pub.authors) ? (pub.authors as string[])[0] ?? "" : "",
      },
      content: {
        type: "text" as const,
        value: `${pub.title}\n\n${pub.abstract ?? ""}\n\nAuthors: ${Array.isArray(pub.authors) ? (pub.authors as string[]).join(", ") : ""}`,
      },
      acl: [{ type: "everyone" as const, value: "everyone", accessType: "grant" as const }],
    }));
  } catch (err) {
    console.warn("⚠ Could not fetch publications:", err);
    return [];
  }
}

async function fetchResearchers(): Promise<ExternalItem[]> {
  try {
    const res = await fetch(`${DATA_API_URL}/api/researchers?limit=100`);
    if (!res.ok) throw new Error(`Data API returned ${res.status}`);
    const data = (await res.json()) as Array<Record<string, unknown>>;

    return data.map((r) => ({
      id: `researcher-${r.id}`,
      properties: {
        contentType: "researcher",
        title: r.name ?? "",
        researcherName: r.name ?? "",
        description: r.bio ?? "",
        url: r.url ?? "",
        role: r.role ?? "",
        lab: r.lab ?? "",
        researchAreas: r.researchAreas ?? [],
        lastModifiedDateTime: r.updatedAt ?? new Date().toISOString(),
        createdBy: "",
      },
      content: {
        type: "text" as const,
        value: `${r.name}\n${r.role ?? ""} at ${r.lab ?? ""}\n\n${r.bio ?? ""}\n\nResearch areas: ${Array.isArray(r.researchAreas) ? (r.researchAreas as string[]).join(", ") : ""}`,
      },
      acl: [{ type: "everyone" as const, value: "everyone", accessType: "grant" as const }],
    }));
  } catch (err) {
    console.warn("⚠ Could not fetch researchers:", err);
    return [];
  }
}

async function fetchProjects(): Promise<ExternalItem[]> {
  try {
    const res = await fetch(`${DATA_API_URL}/api/projects?limit=100`);
    if (!res.ok) throw new Error(`Data API returned ${res.status}`);
    const data = (await res.json()) as Array<Record<string, unknown>>;

    return data.map((p) => ({
      id: `project-${p.id}`,
      properties: {
        contentType: "project",
        title: p.title ?? "",
        description: p.description ?? "",
        url: p.url ?? "",
        tags: p.tags ?? [],
        projectStatus: p.status ?? "active",
        lastModifiedDateTime: p.updatedAt ?? new Date().toISOString(),
        createdBy: "",
      },
      content: {
        type: "text" as const,
        value: `${p.title}\n\n${p.description ?? ""}\n\nTags: ${Array.isArray(p.tags) ? (p.tags as string[]).join(", ") : ""}`,
      },
      acl: [{ type: "everyone" as const, value: "everyone", accessType: "grant" as const }],
    }));
  } catch (err) {
    console.warn("⚠ Could not fetch projects:", err);
    return [];
  }
}

/**
 * Pushes external items to the Graph connector in batches.
 */
async function pushItems(items: ExternalItem[], connectionId: string) {
  const client = createGraphClient();
  let success = 0;
  let failed = 0;

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);

    for (const item of batch) {
      try {
        await client
          .api(`/external/connections/${connectionId}/items/${item.id}`)
          .put(item);
        success++;
      } catch (err) {
        console.error(`  ✗ Failed to push ${item.id}:`, err);
        failed++;
      }
      await sleep(RATE_LIMIT_MS);
    }

    console.log(`  Progress: ${Math.min(i + BATCH_SIZE, items.length)}/${items.length}`);
  }

  return { success, failed };
}

async function runIngestion() {
  const config = getConnectionConfig();
  console.log(`\nMSR Content Ingestion → ${config.id}`);
  console.log("=".repeat(50));

  // Fetch all content types
  console.log("\n📚 Fetching publications...");
  const publications = await fetchPublications();
  console.log(`   Found ${publications.length} publications`);

  console.log("👩‍🔬 Fetching researchers...");
  const researchers = await fetchResearchers();
  console.log(`   Found ${researchers.length} researchers`);

  console.log("🔬 Fetching projects...");
  const projects = await fetchProjects();
  console.log(`   Found ${projects.length} projects`);

  const allItems = [...publications, ...researchers, ...projects];
  console.log(`\n📤 Pushing ${allItems.length} items to Graph connector...`);

  if (allItems.length === 0) {
    console.log("⚠ No items to ingest. Is the DATA_API_URL configured?");
    return;
  }

  const result = await pushItems(allItems, config.id);
  console.log(`\n✓ Ingestion complete: ${result.success} succeeded, ${result.failed} failed`);
}

runIngestion().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
