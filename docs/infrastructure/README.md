# Infrastructure

Production deployment configuration for the MSR Event Agent Client platform.

> Canonical source: [`infra/nginx/README.md`](../../infra/nginx/README.md)

## Architecture

```
                    ┌──────────┐
        Internet ───│  nginx   │─── :443 (HTTPS) / :80 (redirect)
                    └────┬─────┘
                         │
         ┌───────────────┼───────────────────────────────────┐
         │               │                                   │
    SSR Apps (React Router)      API Servers (Express)       │
    ┌──────────┐  ┌──────────┐  ┌──────────────┐  ┌───────────────┐
    │   chat   │  │ msr-home │  │ m365-agents  │  │  mcp-server   │
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

- **Direct Mode** (default) — nginx routes each path prefix to the upstream service. Lower latency, per-route config.
- **Gateway Mode** — all traffic forwarded to gateway `:8080`. Simpler but adds one hop.

## Key Routes

| Path | Service | Port |
|------|---------|------|
| `/` | chat | 5173 |
| `/msr-home/` | msr-home | 5174 |
| `/teams/` | teams | 5175 |
| `/agents-sdk/` | agents-sdk | 5176 |
| `/m365/api/messages` | m365-agents | 3978 |
| `/message-ext/api/messages` | message-extension | 7074 |
| `/mcp/sse`, `/mcp/messages` | mcp-server | 3100 |
| `/github-copilot/agent` | github-copilot-ext | 7073 |
| `/health`, `/api/services` | gateway | 8080 |

## Full Documentation

See [`infra/nginx/README.md`](../../infra/nginx/README.md) for:
- Complete path routing table with rate limits and SSE flags
- Docker Compose setup
- SSL certificate configuration
- Environment variables
- How to add a new channel
