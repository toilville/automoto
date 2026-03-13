# Documentation

Welcome to the MSR Event Agent Client wiki. This monorepo contains shared front-end packages and applications for the MSR Event Hub platform.

## Pages

| Section | Description |
|---------|-------------|
| **[Getting Started](getting-started/)** | Prerequisites, install, dev servers, testing, linting |
| **[Architecture](architecture/)** | System design, tech stack, data flow, package consumption model |
| **[Apps](apps/)** | All 17 applications — SSR apps, API servers, connectors, devtools |
| **[Packages](packages/)** | 4 shared packages — chat-ui, data-client, analytics, channel-adapter |
| **[Channel DevTools](devtools/)** | Multi-channel debugger & event inspector (replaces Bot Framework Emulator) |
| **[Channel Onboarding](channel-onboarding/)** | Partner onboarding — build a new channel or embed an existing one |
| **[Infrastructure](infrastructure/)** | Production nginx routing, Docker Compose, deployment modes |

## Quick Reference

```bash
npm install            # Install all workspace deps
npm run build          # Build everything
npm run dev            # Chat app dev server (default)
npm run test           # All tests
npm run typecheck      # Type-check
npm run lint           # ESLint
```

## Security (SFI)

- **DefaultAzureCredential ONLY** for Azure service calls
- No API keys, connection strings, or secrets in code
- No user PII in logs or error messages
