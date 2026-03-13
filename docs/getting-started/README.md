# Getting Started

Developer setup guide for the Automoto monorepo.

## Prerequisites

- **Node.js** ≥ 22 (LTS recommended)
- **npm** ≥ 10 (ships with Node.js 22)
- **Git**

## Install & Build

```bash
git clone <repo-url>
cd automoto

npm install          # Install all workspace dependencies
npm run build        # Build all packages and apps
```

### Building a Single Package or App

```bash
npm run build --workspace=packages/chat-ui
npm run build --workspace=apps/chat

# Or navigate into the workspace
cd packages/chat-ui && npx tsc
```

## Dev Servers

Each app has its own dev script. See [Apps](../apps/) for the full list.

| Command | App | Port |
|---------|-----|------|
| `npm run dev` | chat (default) | 5173 |
| `npm run dev:home` | home | 5174 |
| `npm run dev:teams` | teams | 5175 |
| `npm run dev:agents` | agents-sdk | 5176 |
| `npm run dev:gateway` | gateway | 8080 |
| `npm run dev:mcp` | mcp-server | 3100 |
| `npm run dev:m365` | m365-agents | 3978 |
| `npm run dev:devtools` | channel devtools | 5173 |
| `npm run dev:devtools:mock` | devtools (mock, no auth) | 5173 |

> **Full list:** Run `npm run` at the repo root to see all available scripts.

SSR apps use `react-router dev`. API servers use `tsx watch`.

## Testing

```bash
npm run test         # Vitest across all workspaces
npm run typecheck    # TypeScript type-check without emitting
npm run lint         # ESLint across all workspaces
```

### Testing a Single Workspace

```bash
npm run test --workspace=apps/chat
npm run typecheck --workspace=packages/data-client
```

### DevTools Tests

```bash
cd apps/devtools
npm run test:unit          # 56 unit tests (store, hooks, components)
npm run test:integration   # 14-channel integration tests (requires running server)
```

Integration tests require a running dev server — see [DevTools](../devtools/) for details.

### Watch Mode

```bash
cd apps/chat
npx vitest           # Watch mode
```

## Linting

```bash
npm run lint         # ESLint across all workspaces

# Per-app (where available)
cd apps/chat
npm run lint         # ESLint for TypeScript/TSX
npm run lint:css     # stylelint for CSS
npm run lint:fix     # ESLint with auto-fix
```

## Vendoring Packages to Downstream Repos

Shared packages are **vendored** (copied) into consumer repos like TNREvents. There are no npm registry publishes — consumers commit both `src/` and `dist/`.

### Syncing updates to a consumer

1. **Make and test changes** in this repo.
2. **Copy** updated `src/`, `dist/`, and `package.json` to the consumer's `packages/<name>/`.
3. **Commit** in the consumer repo.

```
this-repo/packages/chat-ui/        → consumer-repo/packages/chat-ui/
this-repo/packages/data-client/    → consumer-repo/packages/data-client/
this-repo/packages/analytics/      → consumer-repo/packages/analytics/
```

See the TNREvents [developer guide](https://dev.azure.com/user/project/_git/TNREvents?path=/docs/getting-started/developer-guide.md) for consumer-side details.

## Key Conventions

- Components use **PascalCase** file names
- Packages export from `src/index.ts`
- All UI components follow **Fluent UI v9** patterns and tokens
- CSS-in-JS via **Griffel** (not CSS modules or Tailwind)
- `authLevel: "anonymous"` on Azure Functions — auth handled in code
- **DefaultAzureCredential** only for Azure service calls — no secrets in code
