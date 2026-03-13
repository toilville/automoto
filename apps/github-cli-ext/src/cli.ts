#!/usr/bin/env node
/**
 * gh msr — GitHub CLI extension for Microsoft Research
 *
 * Usage:
 *   gh msr search <query>         Search publications, researchers, projects
 *   gh msr researcher <name>      Get researcher details
 *   gh msr publications [query]   Browse recent publications
 *   gh msr areas                  List research areas
 *   gh msr chat <message>         Chat with the MSR Research Assistant
 *   gh msr labs                   List MSR labs worldwide
 *   gh msr lab <id>               Detail view of a specific lab
 *   gh msr project <name>         Deep dive on a research project
 *   gh msr cite <paper>           Get citation (BibTeX/APA/MLA)
 *   gh msr trending [area]        Trending papers, optionally by area
 *   gh msr collab <researcher>    Show co-author graph
 *   gh msr summarize <paper>      AI-summarize a paper
 *   gh msr watch [area]           Watch a research area for updates
 *   gh msr status                 Platform service health
 *   gh msr channels               List channel adapters
 *   gh msr news                   Latest MSR news & highlights
 *   gh msr rag <query>            Semantic search in RAG knowledge base
 *   gh msr config [action]        Manage CLI configuration
 *   gh msr --help                 Show help
 *
 * Install:
 *   gh extension install microsoft/gh-msr
 *
 * Or link locally for development:
 *   cd apps/github-cli-ext && npm run build
 *   gh extension install .
 */
import { parseArgs } from "node:util";
import {
  search,
  getResearcher,
  getPublications,
  getResearchAreas,
  chat,
  getLabs,
  getLabDetail,
  getProject,
  cite,
  trending,
  collab,
  summarize,
  watch,
  status,
  channels,
  news,
  rag,
  config,
} from "./commands.js";

const HELP = `
gh msr — Microsoft Research CLI

USAGE
  gh msr <command> [arguments]

COMMANDS
  search <query>           Search across all MSR content
  researcher <name>        Look up a researcher by name
  publications [query]     Browse or search publications
  areas                    List research focus areas
  chat <message>           Ask the MSR Research Assistant
  labs                     List MSR labs worldwide
  lab <id>                 Details for a specific lab
  project <name>           Deep dive on a research project
  cite <paper>             Get BibTeX/APA/MLA citation
  trending [area]          Trending/recent papers by area
  collab <researcher>      Show co-author collaboration graph
  summarize <query>        AI-summarize a paper abstract
  watch [area]             Subscribe to new papers in an area
  status                   Show platform service health
  channels                 List registered channel adapters
  news                     Latest MSR news & highlights
  rag <query>              Semantic search in RAG knowledge base
  config [list|set|get|reset]  Manage CLI configuration

OPTIONS
  --limit, -l <n>          Max results (default: 5)
  --type, -t <type>        Filter: all, publications, researchers, projects
  --format, -f <fmt>       Citation format: bibtex, apa, mla (for cite)
  --collection, -c <id>    RAG collection ID (for rag)
  --remove                 Remove a watch (for watch --remove <area>)
  --json                   Output raw JSON instead of formatted text
  --help, -h               Show this help

EXAMPLES
  gh msr search "transformer architecture"
  gh msr researcher "John Smith"
  gh msr publications --limit 10
  gh msr cite "attention is all you need" --format apa
  gh msr trending "quantum computing"
  gh msr collab "Satya Nadella"
  gh msr watch "reinforcement learning"
  gh msr status
  gh msr rag "how does RLHF work"
  gh msr config set defaultLimit 10

ENVIRONMENT
  DATA_API_URL             MSR data service URL (default: http://localhost:7071)
  GATEWAY_URL              Gateway URL (default: http://localhost:4000)
`.trim();

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    console.log(HELP);
    process.exit(0);
  }

  const command = args[0];
  const rest = args.slice(1);

  // Parse common flags
  const { values } = parseArgs({
    args: rest,
    options: {
      limit: { type: "string", short: "l", default: "5" },
      type: { type: "string", short: "t", default: "all" },
      format: { type: "string", short: "f", default: "bibtex" },
      collection: { type: "string", short: "c" },
      remove: { type: "boolean", default: false },
      json: { type: "boolean", default: false },
    },
    allowPositionals: true,
    strict: false,
  });

  const limit = parseInt(values.limit as string, 10) || 5;
  const type = (values.type as string) ?? "all";
  const jsonOutput = values.json as boolean;
  const format = (values.format as string) ?? "bibtex";
  const collection = values.collection as string | undefined;
  const remove = values.remove as boolean;
  const positionals = rest.filter(
    (a) => !a.startsWith("-") && a !== values.limit && a !== values.type && a !== values.format && a !== values.collection,
  );

  try {
    switch (command) {
      case "search": {
        const query = positionals.join(" ");
        if (!query) {
          console.error(
            "Error: search requires a query. Usage: gh msr search <query>",
          );
          process.exit(1);
        }
        await search(query, { limit, type, json: jsonOutput });
        break;
      }
      case "researcher": {
        const name = positionals.join(" ");
        if (!name) {
          console.error(
            "Error: researcher requires a name. Usage: gh msr researcher <name>",
          );
          process.exit(1);
        }
        await getResearcher(name, { json: jsonOutput });
        break;
      }
      case "publications": {
        const query = positionals.join(" ") || undefined;
        await getPublications(query, { limit, json: jsonOutput });
        break;
      }
      case "areas": {
        await getResearchAreas({ json: jsonOutput });
        break;
      }
      case "chat": {
        const message = positionals.join(" ");
        if (!message) {
          console.error(
            "Error: chat requires a message. Usage: gh msr chat <message>",
          );
          process.exit(1);
        }
        await chat(message, { json: jsonOutput });
        break;
      }
      case "labs": {
        await getLabs({ json: jsonOutput });
        break;
      }
      case "lab": {
        const labId = positionals.join(" ");
        if (!labId) {
          console.error("Error: lab requires an ID. Usage: gh msr lab <id>");
          process.exit(1);
        }
        await getLabDetail(labId, { json: jsonOutput });
        break;
      }
      case "project": {
        const name = positionals.join(" ");
        if (!name) {
          console.error("Error: project requires a name. Usage: gh msr project <name>");
          process.exit(1);
        }
        await getProject(name, { json: jsonOutput });
        break;
      }
      case "cite": {
        const query = positionals.join(" ");
        if (!query) {
          console.error("Error: cite requires a paper query. Usage: gh msr cite <paper>");
          process.exit(1);
        }
        await cite(query, { json: jsonOutput, format });
        break;
      }
      case "trending": {
        const area = positionals.join(" ") || undefined;
        await trending(area, { limit, json: jsonOutput });
        break;
      }
      case "collab": {
        const researcher = positionals.join(" ");
        if (!researcher) {
          console.error("Error: collab requires a researcher name. Usage: gh msr collab <name>");
          process.exit(1);
        }
        await collab(researcher, { limit, json: jsonOutput });
        break;
      }
      case "summarize": {
        const query = positionals.join(" ");
        if (!query) {
          console.error("Error: summarize requires a paper query. Usage: gh msr summarize <paper>");
          process.exit(1);
        }
        await summarize(query, { json: jsonOutput });
        break;
      }
      case "watch": {
        const area = positionals.join(" ") || undefined;
        await watch(area, { json: jsonOutput, remove, list: !area && !remove });
        break;
      }
      case "status": {
        await status({ json: jsonOutput });
        break;
      }
      case "channels": {
        await channels({ json: jsonOutput });
        break;
      }
      case "news": {
        await news({ limit, json: jsonOutput });
        break;
      }
      case "rag": {
        const query = positionals.join(" ");
        if (!query) {
          console.error("Error: rag requires a query. Usage: gh msr rag <query>");
          process.exit(1);
        }
        await rag(query, { json: jsonOutput, limit, collection });
        break;
      }
      case "config": {
        const action = positionals[0];
        const key = positionals[1];
        const value = positionals[2];
        await config(action, key, value, { json: jsonOutput });
        break;
      }
      default:
        console.error(`Unknown command: ${command}\n`);
        console.log(HELP);
        process.exit(1);
    }
  } catch (err) {
    console.error(
      `Error: ${err instanceof Error ? err.message : String(err)}`,
    );
    process.exit(1);
  }
}

main();
