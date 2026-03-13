/**
 * CLI command implementations.
 * Each command calls the MSR data API and formats output for the terminal.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

const DATA_API_URL = process.env.DATA_API_URL ?? "http://localhost:7071";
const GATEWAY_URL = process.env.GATEWAY_URL ?? "http://localhost:4000";

export interface OutputOptions {
  json: boolean;
  limit?: number;
  type?: string;
}

interface SearchResult {
  title?: string;
  snippet?: string;
  url?: string;
  type?: string;
  authors?: string;
  year?: number;
  doi?: string;
  lab?: string;
  researchArea?: string;
}

interface LabInfo {
  id: string;
  name: string;
  location?: string;
  description?: string;
  researcherCount?: number;
  focusAreas?: string[];
}

interface ProjectInfo {
  title?: string;
  description?: string;
  status?: string;
  team?: string[];
  url?: string;
  lab?: string;
}

interface ServiceHealth {
  status: string;
  service?: string;
  uptime?: number;
  version?: string;
}

// ── Colors (ANSI) ────────────────────────────────────
const bold = (s: string) => `\x1b[1m${s}\x1b[0m`;
const purple = (s: string) => `\x1b[35m${s}\x1b[0m`;
const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;
const cyan = (s: string) => `\x1b[36m${s}\x1b[0m`;
const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
const red = (s: string) => `\x1b[31m${s}\x1b[0m`;
const yellow = (s: string) => `\x1b[33m${s}\x1b[0m`;

async function callApi(
  path: string,
  options?: { method?: string; body?: unknown; baseUrl?: string },
): Promise<unknown> {
  const base = options?.baseUrl ?? DATA_API_URL;
  const url = `${base}${path}`;
  const res = await fetch(url, {
    method: options?.method ?? "GET",
    headers: options?.body
      ? { "Content-Type": "application/json" }
      : undefined,
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    throw new Error(`API request failed: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

// ── Config management ────────────────────────────────

const CONFIG_DIR = path.join(os.homedir(), ".config", "gh-msr");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");
const WATCHES_FILE = path.join(CONFIG_DIR, "watches.json");

interface MsrConfig {
  apiUrl: string;
  gatewayUrl: string;
  defaultLab?: string;
  defaultLimit: number;
  outputFormat: "text" | "json";
}

function loadConfig(): MsrConfig {
  const defaults: MsrConfig = {
    apiUrl: DATA_API_URL,
    gatewayUrl: GATEWAY_URL,
    defaultLab: undefined,
    defaultLimit: 5,
    outputFormat: "text",
  };
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
      return { ...defaults, ...data };
    }
  } catch { /* use defaults */ }
  return defaults;
}

function saveConfig(config: MsrConfig): void {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

interface WatchEntry {
  area: string;
  addedAt: string;
}

function loadWatches(): WatchEntry[] {
  try {
    if (fs.existsSync(WATCHES_FILE)) {
      return JSON.parse(fs.readFileSync(WATCHES_FILE, "utf-8"));
    }
  } catch { /* empty */ }
  return [];
}

function saveWatches(watches: WatchEntry[]): void {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(WATCHES_FILE, JSON.stringify(watches, null, 2));
}

// ── Original commands ────────────────────────────────

export async function search(
  query: string,
  opts: OutputOptions,
): Promise<void> {
  const data = (await callApi("/tools/quick_search", {
    method: "POST",
    body: { query, type: opts.type ?? "all", limit: opts.limit ?? 5 },
  })) as { results?: SearchResult[] };

  const results = data.results ?? [];

  if (opts.json) {
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  if (results.length === 0) {
    console.log(dim(`No results found for "${query}"`));
    return;
  }

  console.log(bold(purple(`\n🔬 MSR Search: "${query}"\n`)));
  for (const r of results) {
    console.log(`  ${bold(r.title ?? "Untitled")}`);
    if (r.type) console.log(`  ${dim(`[${r.type}]`)}`);
    if (r.snippet) console.log(`  ${r.snippet}`);
    if (r.authors) console.log(`  ${dim(`Authors: ${r.authors}`)}`);
    if (r.url) console.log(`  ${cyan(r.url)}`);
    console.log();
  }
  console.log(dim(`${results.length} result(s)`));
}

export async function getResearcher(
  name: string,
  opts: OutputOptions,
): Promise<void> {
  const data = (await callApi("/tools/quick_search", {
    method: "POST",
    body: { query: name, type: "researchers", limit: 1 },
  })) as { results?: SearchResult[] };

  if (opts.json) {
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  const results = data.results ?? [];
  if (results.length === 0) {
    console.log(dim(`No researcher found matching "${name}"`));
    return;
  }

  const r = results[0];
  console.log(bold(purple(`\n👤 ${r.title ?? name}\n`)));
  if (r.snippet) console.log(`  ${r.snippet}`);
  if (r.url) console.log(`  ${cyan(r.url)}`);
  console.log();
}

export async function getPublications(
  query: string | undefined,
  opts: OutputOptions,
): Promise<void> {
  const data = (await callApi("/tools/quick_search", {
    method: "POST",
    body: {
      query: query ?? "recent research",
      type: "publications",
      limit: opts.limit ?? 5,
    },
  })) as { results?: SearchResult[] };

  if (opts.json) {
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  const results = data.results ?? [];
  if (results.length === 0) {
    console.log(dim("No publications found"));
    return;
  }

  console.log(
    bold(purple(`\n📄 MSR Publications${query ? `: "${query}"` : ""}\n`)),
  );
  for (const r of results) {
    console.log(`  ${bold(r.title ?? "Untitled")}`);
    if (r.authors) console.log(`  ${dim(r.authors)}`);
    if (r.snippet) console.log(`  ${r.snippet}`);
    if (r.url) console.log(`  ${cyan(r.url)}`);
    console.log();
  }
}

export async function getResearchAreas(opts: OutputOptions): Promise<void> {
  const data = (await callApi("/tools/quick_search", {
    method: "POST",
    body: { query: "research areas", type: "all", limit: 10 },
  })) as { results?: SearchResult[] };

  if (opts.json) {
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  const results = data.results ?? [];
  console.log(bold(purple("\n🧪 MSR Research Areas\n")));
  for (const r of results) {
    console.log(`  ${bold(r.title ?? "Unknown")} — ${r.snippet ?? ""}`);
  }
  console.log();
}

export async function chat(
  message: string,
  opts: OutputOptions,
): Promise<void> {
  const data = (await callApi("/tools/quick_search", {
    method: "POST",
    body: { query: message, type: "all", limit: 3 },
  })) as { results?: SearchResult[] };

  if (opts.json) {
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  const results = data.results ?? [];
  console.log(bold(purple("\n🤖 MSR Research Assistant\n")));

  if (results.length === 0) {
    console.log(`  I couldn't find specific results for "${message}".`);
    console.log(
      `  Try searching for specific topics, researcher names, or paper titles.`,
    );
  } else {
    console.log(`  Here's what I found about "${message}":\n`);
    for (const r of results) {
      console.log(`  ${bold("•")} ${bold(r.title ?? "")}`);
      if (r.snippet) console.log(`    ${r.snippet}`);
      if (r.url) console.log(`    ${cyan(r.url)}`);
      console.log();
    }
  }
  console.log(
    dim(
      "  For richer conversations, use the full research chat at https://home.example.com",
    ),
  );
  console.log();
}

// ── New commands ──────────────────────────────────────

export async function getLabs(opts: OutputOptions): Promise<void> {
  const data = (await callApi("/tools/quick_search", {
    method: "POST",
    body: { query: "microsoft research labs locations", type: "all", limit: 20 },
  })) as { results?: SearchResult[]; labs?: LabInfo[] };

  if (opts.json) {
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  const labs = data.labs ?? [];
  const results = data.results ?? [];

  console.log(bold(purple("\n🏢 MSR Labs Worldwide\n")));

  if (labs.length > 0) {
    for (const lab of labs) {
      console.log(`  ${bold(lab.name)} ${dim(lab.location ?? "")}`);
      if (lab.description) console.log(`    ${lab.description}`);
      if (lab.focusAreas?.length) console.log(`    ${dim(`Focus: ${lab.focusAreas.join(", ")}`)}`);
      if (lab.researcherCount) console.log(`    ${dim(`${lab.researcherCount} researchers`)}`);
      console.log();
    }
  } else {
    for (const r of results) {
      console.log(`  ${bold(r.title ?? "Unknown Lab")}`);
      if (r.snippet) console.log(`    ${r.snippet}`);
      if (r.url) console.log(`    ${cyan(r.url)}`);
      console.log();
    }
  }
}

export async function getLabDetail(
  labId: string,
  opts: OutputOptions,
): Promise<void> {
  const data = (await callApi("/tools/quick_search", {
    method: "POST",
    body: { query: `microsoft research ${labId} lab researchers projects`, type: "all", limit: 10 },
  })) as { results?: SearchResult[]; lab?: LabInfo };

  if (opts.json) {
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  const results = data.results ?? [];
  const lab = data.lab;

  console.log(bold(purple(`\n🏢 MSR Lab: ${lab?.name ?? labId}\n`)));

  if (lab) {
    if (lab.location) console.log(`  ${dim(`📍 ${lab.location}`)}`);
    if (lab.description) console.log(`  ${lab.description}\n`);
    if (lab.focusAreas?.length) console.log(`  ${bold("Focus Areas:")} ${lab.focusAreas.join(", ")}`);
    if (lab.researcherCount) console.log(`  ${bold("Researchers:")} ${lab.researcherCount}`);
    console.log();
  }

  if (results.length > 0) {
    console.log(`  ${bold("Related:")}`);
    for (const r of results) {
      console.log(`  ${bold("•")} ${r.title ?? "Untitled"} ${dim(`[${r.type ?? ""}]`)}`);
      if (r.snippet) console.log(`    ${r.snippet}`);
      console.log();
    }
  }
}

export async function getProject(
  name: string,
  opts: OutputOptions,
): Promise<void> {
  const data = (await callApi("/tools/quick_search", {
    method: "POST",
    body: { query: `${name} project`, type: "projects", limit: 5 },
  })) as { results?: SearchResult[]; project?: ProjectInfo };

  if (opts.json) {
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  const results = data.results ?? [];
  const project = data.project;

  console.log(bold(purple(`\n📁 MSR Project: ${project?.title ?? name}\n`)));

  if (project) {
    if (project.description) console.log(`  ${project.description}\n`);
    if (project.status) console.log(`  ${bold("Status:")} ${project.status}`);
    if (project.lab) console.log(`  ${bold("Lab:")} ${project.lab}`);
    if (project.team?.length) console.log(`  ${bold("Team:")} ${project.team.join(", ")}`);
    if (project.url) console.log(`  ${cyan(project.url)}`);
    console.log();
  }

  if (results.length > 0) {
    for (const r of results) {
      console.log(`  ${bold("•")} ${bold(r.title ?? "Untitled")}`);
      if (r.snippet) console.log(`    ${r.snippet}`);
      if (r.url) console.log(`    ${cyan(r.url)}`);
      console.log();
    }
  } else if (!project) {
    console.log(dim(`  No project found matching "${name}"`));
  }
}

export async function cite(
  query: string,
  opts: OutputOptions & { format?: string },
): Promise<void> {
  const data = (await callApi("/tools/quick_search", {
    method: "POST",
    body: { query, type: "publications", limit: 1 },
  })) as { results?: SearchResult[] };

  const results = data.results ?? [];

  if (results.length === 0) {
    console.log(dim(`No publication found matching "${query}"`));
    return;
  }

  const r = results[0];
  const format = opts.format ?? "bibtex";

  if (opts.json) {
    console.log(JSON.stringify({ ...r, citationFormat: format }, null, 2));
    return;
  }

  console.log(bold(purple(`\n📋 Citation: ${r.title ?? query}\n`)));

  // Generate a citation key from authors and year
  const firstAuthor = r.authors?.split(",")[0]?.trim().split(" ").pop()?.toLowerCase() ?? "unknown";
  const year = r.year ?? new Date().getFullYear();
  const key = `${firstAuthor}${year}`;

  if (format === "bibtex") {
    console.log(`  @article{${key},`);
    console.log(`    title     = {${r.title ?? "Untitled"}},`);
    if (r.authors) console.log(`    author    = {${r.authors}},`);
    console.log(`    year      = {${year}},`);
    if (r.doi) console.log(`    doi       = {${r.doi}},`);
    if (r.url) console.log(`    url       = {${r.url}},`);
    console.log(`    publisher = {Microsoft Research}`);
    console.log(`  }`);
  } else if (format === "apa") {
    const authorStr = r.authors ?? "Microsoft Research";
    console.log(`  ${authorStr} (${year}). ${r.title ?? "Untitled"}. Microsoft Research.`);
    if (r.url) console.log(`  ${r.url}`);
  } else if (format === "mla") {
    const authorStr = r.authors ?? "Microsoft Research";
    console.log(`  ${authorStr}. "${r.title ?? "Untitled"}." Microsoft Research, ${year}.`);
    if (r.url) console.log(`  ${r.url}`);
  } else {
    console.log(`  ${r.authors ?? "Microsoft Research"} (${year}). ${r.title ?? "Untitled"}.`);
    if (r.url) console.log(`  ${r.url}`);
  }
  console.log();
}

export async function trending(
  area: string | undefined,
  opts: OutputOptions,
): Promise<void> {
  const query = area
    ? `trending recent ${area} research publications`
    : "trending recent research publications highlights";

  const data = (await callApi("/tools/quick_search", {
    method: "POST",
    body: { query, type: "publications", limit: opts.limit ?? 10 },
  })) as { results?: SearchResult[] };

  if (opts.json) {
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  const results = data.results ?? [];
  console.log(bold(purple(`\n📈 Trending Research${area ? `: ${area}` : ""}\n`)));

  if (results.length === 0) {
    console.log(dim("  No trending publications found"));
    return;
  }

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    const rank = dim(`${(i + 1).toString().padStart(2)}.`);
    console.log(`  ${rank} ${bold(r.title ?? "Untitled")}`);
    if (r.authors) console.log(`      ${dim(r.authors)}`);
    if (r.snippet) console.log(`      ${r.snippet}`);
    if (r.url) console.log(`      ${cyan(r.url)}`);
    console.log();
  }
}

export async function collab(
  researcher: string,
  opts: OutputOptions,
): Promise<void> {
  // Find the researcher first, then search for their co-authored publications
  const researcherData = (await callApi("/tools/quick_search", {
    method: "POST",
    body: { query: researcher, type: "researchers", limit: 1 },
  })) as { results?: SearchResult[] };

  const researcherResults = researcherData.results ?? [];

  const name = researcherResults[0]?.title ?? researcher;

  const collabData = (await callApi("/tools/quick_search", {
    method: "POST",
    body: { query: `${name} publications collaborators co-authors`, type: "publications", limit: opts.limit ?? 10 },
  })) as { results?: SearchResult[] };

  if (opts.json) {
    console.log(JSON.stringify({ researcher: researcherResults[0], collaborations: collabData.results }, null, 2));
    return;
  }

  const results = collabData.results ?? [];
  console.log(bold(purple(`\n🤝 Collaboration Graph: ${name}\n`)));

  if (researcherResults.length > 0) {
    const r = researcherResults[0];
    if (r.snippet) console.log(`  ${r.snippet}`);
    if (r.url) console.log(`  ${cyan(r.url)}`);
    console.log();
  }

  // Extract co-authors from publication results
  const coauthors = new Map<string, number>();
  for (const r of results) {
    if (r.authors) {
      for (const author of r.authors.split(",").map((a) => a.trim())) {
        if (author.toLowerCase() !== name.toLowerCase() && author.length > 0) {
          coauthors.set(author, (coauthors.get(author) ?? 0) + 1);
        }
      }
    }
  }

  if (coauthors.size > 0) {
    console.log(`  ${bold("Co-authors")} (by shared publications):\n`);
    const sorted = [...coauthors.entries()].sort((a, b) => b[1] - a[1]);
    for (const [author, count] of sorted.slice(0, 15)) {
      const bar = "█".repeat(Math.min(count, 20));
      console.log(`  ${author.padEnd(30)} ${yellow(bar)} ${dim(`(${count})`)}`);
    }
  } else {
    console.log(dim("  No co-author data found"));
  }

  if (results.length > 0) {
    console.log(bold(`\n  Recent joint publications:\n`));
    for (const r of results.slice(0, 5)) {
      console.log(`  ${bold("•")} ${r.title ?? "Untitled"}`);
      if (r.authors) console.log(`    ${dim(r.authors)}`);
      console.log();
    }
  }
}

export async function summarize(
  query: string,
  opts: OutputOptions,
): Promise<void> {
  // First find the paper, then attempt RAG-backed summary
  const paperData = (await callApi("/tools/quick_search", {
    method: "POST",
    body: { query, type: "publications", limit: 1 },
  })) as { results?: SearchResult[] };

  const paper = paperData.results?.[0];

  if (!paper) {
    console.log(dim(`No publication found matching "${query}"`));
    return;
  }

  // Try to get a richer summary from the RAG endpoint
  let ragSummary: string | undefined;
  try {
    const ragData = (await callApi("/mcp/rag-search", {
      method: "POST",
      body: { query: `summarize ${paper.title}`, maxResults: 3 },
    })) as { results?: Array<{ text?: string }> };
    if (ragData.results?.length) {
      ragSummary = ragData.results.map((r) => r.text).filter(Boolean).join("\n\n");
    }
  } catch { /* RAG not available, use snippet */ }

  if (opts.json) {
    console.log(JSON.stringify({ paper, summary: ragSummary ?? paper.snippet }, null, 2));
    return;
  }

  console.log(bold(purple(`\n📝 Summary: ${paper.title ?? query}\n`)));
  if (paper.authors) console.log(`  ${dim(`Authors: ${paper.authors}`)}`);
  if (paper.year) console.log(`  ${dim(`Year: ${paper.year}`)}`);
  console.log();

  if (ragSummary) {
    console.log(`  ${ragSummary}`);
  } else if (paper.snippet) {
    console.log(`  ${paper.snippet}`);
  }

  if (paper.url) {
    console.log(`\n  ${bold("Full paper:")} ${cyan(paper.url)}`);
  }
  console.log();
}

export async function watch(
  area: string | undefined,
  opts: OutputOptions & { remove?: boolean; list?: boolean },
): Promise<void> {
  const watches = loadWatches();

  if (opts.list || !area) {
    if (opts.json) {
      console.log(JSON.stringify(watches, null, 2));
      return;
    }
    console.log(bold(purple("\n👁️  Watched Research Areas\n")));
    if (watches.length === 0) {
      console.log(dim("  No watches configured. Use `gh msr watch <area>` to add one."));
    } else {
      for (const w of watches) {
        console.log(`  ${bold("•")} ${w.area} ${dim(`(since ${w.addedAt.split("T")[0]})`)}`);
      }
    }
    console.log();
    return;
  }

  if (opts.remove) {
    const filtered = watches.filter(
      (w) => w.area.toLowerCase() !== area.toLowerCase(),
    );
    if (filtered.length === watches.length) {
      console.log(dim(`  "${area}" is not in your watch list`));
    } else {
      saveWatches(filtered);
      console.log(green(`  ✓ Removed "${area}" from your watch list`));
    }
    return;
  }

  const exists = watches.some(
    (w) => w.area.toLowerCase() === area.toLowerCase(),
  );
  if (exists) {
    console.log(dim(`  "${area}" is already in your watch list`));
    return;
  }

  watches.push({ area, addedAt: new Date().toISOString() });
  saveWatches(watches);
  console.log(green(`  ✓ Now watching "${area}"`));
  console.log(dim(`  Use \`gh msr trending ${area}\` to see latest publications`));

  // Show a preview of recent work in the area
  const preview = (await callApi("/tools/quick_search", {
    method: "POST",
    body: { query: `${area} recent`, type: "publications", limit: 3 },
  })) as { results?: SearchResult[] };

  const results = preview.results ?? [];
  if (results.length > 0) {
    console.log(bold(`\n  Recent in "${area}":\n`));
    for (const r of results) {
      console.log(`  ${bold("•")} ${r.title ?? "Untitled"}`);
    }
    console.log();
  }
}

export async function status(opts: OutputOptions): Promise<void> {
  const services = [
    { name: "Gateway", url: `${GATEWAY_URL}/health` },
    { name: "Data API", url: `${DATA_API_URL}/health` },
    { name: "MCP Server", url: `${GATEWAY_URL}/mcp/health` },
    { name: "Teams Bot", url: `${GATEWAY_URL}/teams/health` },
    { name: "Copilot Extension", url: `${GATEWAY_URL}/copilot-ext/health` },
    { name: "MSR Home", url: `${GATEWAY_URL}/home/health` },
  ];

  const results: Array<{ name: string; status: string; details?: ServiceHealth }> = [];

  await Promise.all(
    services.map(async ({ name, url }) => {
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
        if (res.ok) {
          const data = (await res.json()) as ServiceHealth;
          results.push({ name, status: "healthy", details: data });
        } else {
          results.push({ name, status: `error (${res.status})` });
        }
      } catch {
        results.push({ name, status: "unreachable" });
      }
    }),
  );

  // Sort: healthy first, then by name
  results.sort((a, b) => {
    if (a.status === "healthy" && b.status !== "healthy") return -1;
    if (b.status === "healthy" && a.status !== "healthy") return 1;
    return a.name.localeCompare(b.name);
  });

  if (opts.json) {
    console.log(JSON.stringify(results, null, 2));
    return;
  }

  console.log(bold(purple("\n🔌 MSR Platform Status\n")));

  const maxNameLen = Math.max(...results.map((r) => r.name.length));
  for (const r of results) {
    const icon = r.status === "healthy" ? green("●") : r.status === "unreachable" ? red("●") : yellow("●");
    const statusText = r.status === "healthy" ? green(r.status) : r.status === "unreachable" ? red(r.status) : yellow(r.status);
    const version = r.details?.version ? dim(` v${r.details.version}`) : "";
    console.log(`  ${icon} ${r.name.padEnd(maxNameLen)}  ${statusText}${version}`);
  }

  const healthy = results.filter((r) => r.status === "healthy").length;
  console.log(`\n  ${dim(`${healthy}/${results.length} services operational`)}`);
  console.log();
}

export async function channels(opts: OutputOptions): Promise<void> {
  try {
    const data = (await callApi("/api/v1/adapters", {
      baseUrl: GATEWAY_URL,
    })) as { adapters?: Array<{ channel: string; patterns: string[] }> };

    if (opts.json) {
      console.log(JSON.stringify(data, null, 2));
      return;
    }

    const adapters = data.adapters ?? [];
    console.log(bold(purple("\n📡 MSR Channel Adapters\n")));

    if (adapters.length === 0) {
      console.log(dim("  No adapters registered (gateway may be offline)"));
    } else {
      for (const a of adapters) {
        console.log(`  ${bold(a.channel)}`);
        for (const p of a.patterns) {
          console.log(`    ${dim(p)}`);
        }
        console.log();
      }
      console.log(dim(`  ${adapters.length} channel adapter(s) registered`));
    }
  } catch {
    // Gateway offline — show static list
    const channelList = [
      "web", "home", "teams", "agents-sdk", "m365-agents",
      "copilot-search", "copilot-knowledge", "mcp-server",
      "copilot-studio", "power-platform", "sharepoint",
      "github-copilot", "github-cli", "message-extension", "direct-line",
    ];

    if (opts.json) {
      console.log(JSON.stringify({ channels: channelList, source: "static" }, null, 2));
      return;
    }

    console.log(bold(purple("\n📡 MSR Channels (static list)\n")));
    console.log(yellow("  ⚠ Gateway offline — showing configured channels\n"));
    for (const ch of channelList) {
      console.log(`  ${bold("•")} ${ch}`);
    }
    console.log(dim(`\n  ${channelList.length} channel(s) configured`));
  }
  console.log();
}

export async function config(
  action: string | undefined,
  key: string | undefined,
  value: string | undefined,
  opts: OutputOptions,
): Promise<void> {
  const cfg = loadConfig();

  if (!action || action === "list") {
    if (opts.json) {
      console.log(JSON.stringify(cfg, null, 2));
      return;
    }
    console.log(bold(purple("\n⚙️  MSR CLI Configuration\n")));
    console.log(`  ${bold("apiUrl")}         ${cfg.apiUrl}`);
    console.log(`  ${bold("gatewayUrl")}     ${cfg.gatewayUrl}`);
    console.log(`  ${bold("defaultLab")}     ${cfg.defaultLab ?? dim("(not set)")}`);
    console.log(`  ${bold("defaultLimit")}   ${cfg.defaultLimit}`);
    console.log(`  ${bold("outputFormat")}   ${cfg.outputFormat}`);
    console.log(`\n  ${dim(`Config file: ${CONFIG_FILE}`)}`);
    console.log();
    return;
  }

  if (action === "set") {
    if (!key || !value) {
      console.error("Usage: gh msr config set <key> <value>");
      process.exit(1);
    }
    const validKeys = ["apiUrl", "gatewayUrl", "defaultLab", "defaultLimit", "outputFormat"] as const;
    if (!validKeys.includes(key as (typeof validKeys)[number])) {
      console.error(`Invalid config key: ${key}. Valid keys: ${validKeys.join(", ")}`);
      process.exit(1);
    }
    if (key === "defaultLimit") {
      (cfg as unknown as Record<string, unknown>)[key] = parseInt(value, 10);
    } else {
      (cfg as unknown as Record<string, unknown>)[key] = value;
    }
    saveConfig(cfg);
    console.log(green(`  ✓ Set ${key} = ${value}`));
    return;
  }

  if (action === "get") {
    if (!key) {
      console.error("Usage: gh msr config get <key>");
      process.exit(1);
    }
    const val = (cfg as unknown as Record<string, unknown>)[key];
    console.log(val !== undefined ? String(val) : dim("(not set)"));
    return;
  }

  if (action === "reset") {
    if (fs.existsSync(CONFIG_FILE)) {
      fs.unlinkSync(CONFIG_FILE);
    }
    console.log(green("  ✓ Configuration reset to defaults"));
    return;
  }

  console.error(`Unknown config action: ${action}. Use: list, set, get, reset`);
  process.exit(1);
}

export async function news(opts: OutputOptions): Promise<void> {
  const data = (await callApi("/tools/quick_search", {
    method: "POST",
    body: { query: "latest news highlights blog posts", type: "all", limit: opts.limit ?? 10 },
  })) as { results?: SearchResult[] };

  if (opts.json) {
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  const results = data.results ?? [];
  console.log(bold(purple("\n📰 MSR News & Highlights\n")));

  if (results.length === 0) {
    console.log(dim("  No recent news found"));
    return;
  }

  for (const r of results) {
    console.log(`  ${bold(r.title ?? "Untitled")}`);
    if (r.snippet) console.log(`    ${r.snippet}`);
    if (r.url) console.log(`    ${cyan(r.url)}`);
    console.log();
  }
}

export async function rag(
  query: string,
  opts: OutputOptions & { collection?: string },
): Promise<void> {
  const data = (await callApi("/mcp/rag-search", {
    method: "POST",
    body: { query, collectionId: opts.collection, maxResults: opts.limit ?? 5 },
  })) as { results?: Array<{ text?: string; source?: string; score?: number }> };

  if (opts.json) {
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  const results = data.results ?? [];
  console.log(bold(purple(`\n🧠 RAG Search: "${query}"\n`)));

  if (results.length === 0) {
    console.log(dim("  No grounded results found"));
    return;
  }

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    const score = r.score ? dim(` (${(r.score * 100).toFixed(1)}%)`) : "";
    console.log(`  ${bold(`${i + 1}.`)}${score}`);
    if (r.text) console.log(`    ${r.text.slice(0, 200)}${r.text.length > 200 ? "..." : ""}`);
    if (r.source) console.log(`    ${dim(`Source: ${r.source}`)}`);
    console.log();
  }
}
