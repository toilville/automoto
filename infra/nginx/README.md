# Automoto Platform — nginx Infrastructure

Production reverse-proxy configuration for the Automoto platform,
routing external traffic to 11 runtime services across multiple channels.

## Architecture Overview

```
                    ┌──────────┐
        Internet ───│  nginx   │─── :443 (HTTPS) / :80 (redirect)
                    └────┬─────┘
                         │
         ┌───────────────┼───────────────────────────────────┐
         │               │                                   │
    SSR Apps (React Router)      API Servers (Express)       │
    ┌──────────┐  ┌──────────┐  ┌──────────────┐  ┌───────────────┐
    │   chat   │  │   home   │  │ m365-agents  │  │  mcp-server   │
    │  :5173   │  │  :5174   │  │    :3978     │  │    :3100      │
    ├──────────┤  ├──────────┤  ├──────────────┤  ├───────────────┤
    │  teams   │  │agents-sdk│  │ msg-extension│  │  direct-line  │
    │  :5175   │  │  :5176   │  │    :7074     │  │    :7075      │
    └──────────┘  └──────────┘  ├──────────────┤  └───────────────┘
                                │copilot-knowl.│
                                │    :8081     │
                                ├──────────────┤
                                │power-platform│
                                │    :7072     │
                                ├──────────────┤
                                │github-copilot│
                                │    :7073     │
                                └──────────────┘
                         │
                    ┌────┴─────┐
                    │ gateway  │─── :8080 (health + service registry)
                    └──────────┘
```

## Deployment Modes

### Direct Mode (default — `nginx.conf`)

nginx routes each path prefix directly to the corresponding upstream service.
Best for production: lower latency, fine-grained rate limiting, per-route SSE
configuration.

### Gateway Mode (alternative)

All traffic is forwarded to the API gateway on port 8080, which handles internal
routing. Simpler configuration but adds one extra hop. To use gateway mode,
replace all `location` blocks in `nginx.conf` with a single catch-all:

```nginx
location / {
    proxy_pass http://gateway;
    include /etc/nginx/includes/proxy-common.conf;
    include /etc/nginx/includes/sse-support.conf;
}
```

## Path Routing Table

| Path                         | Upstream              | Port  | Rate Limit   | SSE |
|------------------------------|-----------------------|-------|--------------|-----|
| `/` (root)                   | chat_app              | 5173  | —            | ✓   |
| `/api/chat`                  | chat_app              | 5173  | 60 req/min   | ✓   |
| `/home/`                     | home_app              | 5174  | —            | ✓   |
| `/teams/`                    | teams_app             | 5175  | —            | ✓   |
| `/agents-sdk/`               | agents_sdk_app        | 5176  | —            | ✓   |
| `/m365/api/messages`         | m365_agents           | 3978  | 120 req/min  | —   |
| `/m365/api/health`           | m365_agents           | 3978  | —            | —   |
| `/message-ext/api/messages`  | message_extension     | 7074  | 120 req/min  | —   |
| `/message-ext/api/health`    | message_extension     | 7074  | —            | —   |
| `/copilot-knowledge/`        | copilot_knowledge     | 8081  | 300 req/min  | —   |
| `/power-platform/`           | power_platform        | 7072  | 300 req/min  | —   |
| `/github-copilot/agent`      | github_copilot        | 7073  | 120 req/min  | ✓   |
| `/github-copilot/health`     | github_copilot        | 7073  | —            | —   |
| `/direct-line/`              | direct_line           | 7075  | —            | —   |
| `/direct-line/widget`        | direct_line           | 7075  | —            | —   |
| `/mcp/sse`                   | mcp_server            | 3100  | —            | ✓   |
| `/mcp/messages`              | mcp_server            | 3100  | —            | —   |
| `/mcp/health`                | mcp_server            | 3100  | —            | —   |
| `/health`                    | gateway               | 8080  | —            | —   |
| `/api/services`              | gateway               | 8080  | —            | —   |

## How to Add a New Channel

1. **Add an upstream** in `nginx.conf`:
   ```nginx
   upstream new_service { server localhost:<PORT>; keepalive 16; }
   ```

2. **Add location blocks** in the `server` block:
   ```nginx
   location /new-service/ {
       proxy_pass http://new_service/;
       include /etc/nginx/includes/proxy-common.conf;
       # Add SSE support if the service uses streaming:
       # include /etc/nginx/includes/sse-support.conf;
   }
   ```

3. **Add the service** to `docker-compose.yml`:
   ```yaml
   new-service:
     build:
       context: ../../
       dockerfile: apps/new-service/Dockerfile
     environment:
       <<: *common-env
       PORT: <PORT>
     expose:
       - "<PORT>"
     healthcheck:
       <<: *healthcheck-defaults
       test: ["CMD", "wget", "--spider", "-q", "http://localhost:<PORT>/health"]
     networks:
       - automoto-network
     restart: unless-stopped
   ```

4. **Add the dependency** to the `nginx` service in `docker-compose.yml`.

5. **Reload nginx** (zero-downtime):
   ```bash
   docker-compose exec nginx nginx -s reload
   ```

## Development Setup

For local development, run services individually without nginx:

```bash
# Start the gateway (handles routing in dev)
pnpm --filter gateway dev

# Start individual apps
pnpm --filter chat dev
pnpm --filter m365-agents dev
# ... etc
```

The gateway provides the same routing table and can be used as a single entry
point during development at `http://localhost:8080`.

## Production Setup

### 1. Configure SSL Certificates

Place your TLS certificate and private key in the `ssl/` directory:

```
infra/nginx/ssl/
├── cert.pem      # TLS certificate (or fullchain)
└── key.pem       # Private key
```

For self-signed certificates (testing only):

```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/key.pem -out ssl/cert.pem \
  -subj "/CN=localhost"
```

### 2. Create the `.env` File

```bash
cp .env.example .env
# Edit .env with your values
```

### 3. Build and Start

```bash
# Build all images
docker-compose build

# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f nginx
```

### 4. Verify

```bash
curl -k https://localhost/health
curl -k https://localhost/api/services
```

## Environment Variables

| Variable                  | Service            | Default         | Description                         |
|---------------------------|--------------------|-----------------|-------------------------------------|
| `NODE_ENV`                | All                | `production`    | Node.js environment                 |
| `LOG_LEVEL`               | All                | `info`          | Logging level                       |
| `NGINX_HTTPS_PORT`        | nginx              | `443`           | External HTTPS port                 |
| `NGINX_HTTP_PORT`         | nginx              | `80`            | External HTTP port                  |
| `AZURE_OPENAI_ENDPOINT`   | chat               | —               | Azure OpenAI endpoint URL           |
| `AZURE_OPENAI_API_KEY`    | chat               | —               | Azure OpenAI API key                |
| `AZURE_OPENAI_DEPLOYMENT` | chat               | `gpt-4o`        | Azure OpenAI deployment name        |
| `BOT_ID`                  | m365-agents        | —               | Microsoft Bot Framework app ID      |
| `BOT_PASSWORD`            | m365-agents        | —               | Microsoft Bot Framework password    |
| `BOT_TYPE`                | m365-agents        | `MultiTenant`   | Bot registration type               |
| `ME_BOT_ID`               | message-extension  | —               | Message extension bot app ID        |
| `ME_BOT_PASSWORD`         | message-extension  | —               | Message extension bot password      |
| `GITHUB_APP_ID`           | github-copilot-ext | —               | GitHub App ID                       |
| `GITHUB_APP_PRIVATE_KEY`  | github-copilot-ext | —               | GitHub App private key              |
| `DIRECT_LINE_SECRET`      | direct-line        | —               | Direct Line channel secret          |

## File Structure

```
infra/nginx/
├── nginx.conf              # Main nginx configuration (direct mode)
├── docker-compose.yml      # Full-stack Docker Compose
├── README.md               # This file
├── includes/
│   ├── proxy-common.conf   # Shared proxy headers and timeouts
│   └── sse-support.conf    # Server-Sent Events streaming support
└── ssl/                    # TLS certificates (not committed)
    ├── cert.pem
    └── key.pem
```
