# MSR Event Agent Client — AI Assistant Context

npm workspaces monorepo: React 19, TypeScript 5.5, Fluent UI v9, Vite 7.2.
17 apps + 4 shared packages for the MSR Event Hub platform.

## Build & Test

```bash
npm install                # Install all workspace deps
npm run build              # Build all packages and apps
npm run dev                # Dev server for apps/chat (default)
npm run dev:devtools       # Channel DevTools
npm run dev:devtools:mock  # DevTools with mock backend (no auth)
npm run lint               # ESLint across all workspaces
npm run test               # Vitest across all workspaces
npm run typecheck          # Type-check without emitting
```

## Security (SFI — non-negotiable)

- **DefaultAzureCredential ONLY** for any Azure service calls
- Never store tokens, secrets, or credentials in code or env vars
- No API keys or connection strings — managed identity only
- Never expose user PII in logs or error messages

## Architecture

See [docs/architecture/](docs/architecture/) for full system design.

**Core abstraction:** `@automoto/channel-adapter` with `pub()` / `sub()` / `stream()` methods.
Key types in `packages/channel-adapter/src/protocol.ts`: `ChannelType`, `MSRAgentRequest`, `MSRAgentResponse`, `MSRStreamEvent`, `ChannelAdapter<TInbound, TOutbound, TStreamChunk>`.
7 concrete adapters: Web, BotFramework, GitHubCopilot, MCP, PowerPlatform, DirectLine, CLI.

### Packages

| Package | Purpose |
|---------|---------|
| `@automoto/chat-ui` | Reusable chat UI components |
| `@automoto/data-client` | API client for event data, search, tools |
| `@automoto/analytics` | Analytics abstraction (1DS + App Insights) |
| `@automoto/channel-adapter` | Channel adapter protocol + implementations |

### Apps (17)

See [docs/apps/](docs/apps/) for full details. Key apps:
- **chat** (default), **msr-home**, **teams**, **agents-sdk** — SSR apps
- **devtools** — Channel DevTools (multi-channel debugger, mock mode)
- **gateway**, **mcp-server**, **m365-agents** — API servers
- **github-copilot-ext**, **github-cli-ext**, **power-platform** — extensions
- **copilot-search-connector**, **copilot-knowledge-connector**, **copilot-studio** — connectors
- **message-extension**, **direct-line**, **sharepoint** — platform integrations

### Channel DevTools (`apps/devtools`)

Modern replacement for Bot Framework Emulator:
- Multi-channel chat with all 14 channels
- Real-time SSE event timeline, protocol viewer, network log, console
- **Mock mode** (`MOCK_MODE=true`): instant responses without Azure credentials
- Custom lightweight store (useSyncExternalStore, no zustand)
- Direct file imports (not barrel re-exports) to prevent Vite HMR issues
- See [docs/devtools/](docs/devtools/) for full docs

## Key Conventions

- Components use **PascalCase** file names
- Packages export from `src/index.ts`
- **Fluent UI v9** patterns and tokens · **Griffel** CSS-in-JS
- New channel adapters register in `packages/channel-adapter/src/factory.ts`
- New channel types added to `ChannelType` union in `packages/channel-adapter/src/protocol.ts`
- Consumers **vendor** packages — copy `src/` + `dist/` into their repos

## Documentation

Wiki structure in `docs/`:
- [Getting Started](docs/getting-started/) — setup, dev servers, testing
- [Architecture](docs/architecture/) — system design, tech stack
- [Apps](docs/apps/) — all 17 apps
- [Packages](docs/packages/) — all 4 packages
- [DevTools](docs/devtools/) — channel debugger
- [Channel Onboarding](docs/channel-onboarding/) — partner templates
- [Infrastructure](docs/infrastructure/) — nginx production routing
