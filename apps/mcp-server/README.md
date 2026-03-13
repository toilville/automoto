# @automoto/mcp-server

Model Context Protocol (MCP) server for Automoto. Exposes Automoto tools — search, people, publications, and RAG knowledge bases — to any MCP-compatible client.

## Supported Clients

- Claude Desktop
- VS Code Copilot (MCP support)
- Cursor
- Custom MCP clients

## Features

### Tools

| Tool | Description |
|------|-------------|
| `search_research` | Search all Automoto content — publications, people, projects, news |
| `find_researchers` | Find people by name, topic, lab, or area |
| `browse_publications` | Browse publications by topic, author, or date |
| `get_research_areas` | List all focus areas and labs |
| `get_latest_news` | Fetch recent news and blog posts |
| `search_rag_collection` | Semantic search within the Automoto RAG knowledge base |
| `list_rag_collections` | List available RAG knowledge collections |

### Resources

| Resource | URI | Description |
|----------|-----|-------------|
| RAG Collections | `automoto://rag/collections` | All RAG knowledge collections |
| RAG Sources | `automoto://rag/sources` | All RAG data sources |
| Research Area | `automoto://research-areas/{areaId}` | Details for a specific research area |

### Prompts

| Prompt | Description |
|--------|-------------|
| `research-overview` | Comprehensive overview of a research topic |
| `find-expert` | Find the right Automoto expert for a topic |

## Authentication

### SSE Transport (Remote)

The server validates **Entra ID (Azure AD) bearer tokens** on all SSE endpoints (`/sse`, `/messages`). The `/health` endpoint is unauthenticated.

| Variable | Required | Description |
|----------|----------|-------------|
| `AZURE_TENANT_ID` | Yes | Microsoft Entra tenant ID for issuer validation |
| `MCP_AUTH_AUDIENCE` | Yes | App registration audience (e.g., `api://automoto-mcp-server`) |
| `MCP_AUTH_ENABLED` | No | Set to `"false"` to disable (dev only) |

### Outbound (Data API)

When `DATA_API_SCOPE` is set, the server uses **DefaultAzureCredential** (managed identity) to authenticate to the backend data API. No secrets, API keys, or connection strings required.

### Stdio Transport (Local)

No authentication required — security is inherited from the local machine context.

## Installation

### Local (stdio — Claude Desktop, VS Code, Cursor)

```bash
# Clone and build
git clone <repo-url>
cd automoto
npm install
npm run build --workspace=apps/mcp-server

# Run
DATA_API_URL=http://localhost:7071 node apps/mcp-server/dist/index.js
```

### Remote (SSE — HTTP clients)

```bash
MCP_TRANSPORT=sse \
MCP_PORT=3100 \
DATA_API_URL=https://your-data-api.azurewebsites.net \
DATA_API_SCOPE=api://your-data-api/.default \
AZURE_TENANT_ID=your-tenant-id \
MCP_AUTH_AUDIENCE=api://automoto-mcp-server \
  node apps/mcp-server/dist/index.js
```

## Configuration

Copy `.env.example` and adjust values:

```bash
cp .env.example .env
```

| Variable | Default | Description |
|----------|---------|-------------|
| `DATA_API_URL` | `http://localhost:7071` | Backend data service endpoint |
| `DATA_API_SCOPE` | — | Azure AD scope for outbound auth (optional in dev) |
| `MCP_TRANSPORT` | `stdio` | Transport mode: `stdio` or `sse` |
| `MCP_PORT` | `3100` | SSE server port |
| `MCP_AUTH_ENABLED` | `true` | Enable bearer token validation (SSE only) |
| `AZURE_TENANT_ID` | — | Entra tenant ID for token validation |
| `MCP_AUTH_AUDIENCE` | — | Expected token audience |
| `MCP_ALLOWED_ORIGINS` | — | Comma-separated CORS origins (empty = same-origin only; `*` = all) |

## Usage Examples

### Claude Desktop

Add to `~/.claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "automoto": {
      "command": "node",
      "args": ["/path/to/mcp-server/dist/index.js"],
      "env": {
        "DATA_API_URL": "http://localhost:7071"
      }
    }
  }
}
```

### VS Code Copilot

Add to `.vscode/settings.json`:

```json
{
  "mcp": {
    "servers": {
      "automoto": {
        "command": "node",
        "args": ["/path/to/mcp-server/dist/index.js"],
        "env": {
          "DATA_API_URL": "http://localhost:7071"
        }
      }
    }
  }
}
```

### SSE Client

```bash
# Connect to SSE endpoint
curl -H "Authorization: Bearer <token>" http://localhost:3100/sse

# Health check
curl http://localhost:3100/health
```

## Development

```bash
# Watch mode
npm run dev --workspace=apps/mcp-server

# Build
npm run build --workspace=apps/mcp-server

# Run tests
npm run test --workspace=apps/mcp-server

# Type-check
npm run typecheck --workspace=apps/mcp-server
```

## Support

For issues and questions:

- **Internal**: File an issue in this repository
- **Teams channel**: Automoto team
