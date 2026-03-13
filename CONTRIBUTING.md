# Contributing to Automoto

Thank you for your interest in contributing to Automoto! This document provides guidelines and information for contributors.

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Install dependencies:
   ```bash
   npm install
   pip install -r requirements.txt
   ```
4. Create a branch for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development

### Build & Test

```bash
npm run build              # Build all packages and apps
npm run dev                # Dev server (default: chat app)
npm run dev:devtools       # Channel DevTools
npm run dev:devtools:mock  # DevTools with mock backend
npm run lint               # ESLint across all workspaces
npm run test               # Vitest across all workspaces
npm run typecheck          # Type-check without emitting
```

### Python Components

```bash
pip install -r requirements-dev.txt
make test                  # Run Python tests with coverage
make lint                  # Run linters (black, isort, pylint)
make format                # Auto-format code
```

## Code Style

- **TypeScript/React**: ESLint with TypeScript rules
- **Python**: Black + isort formatting, pylint
- **Components**: PascalCase file names
- **Packages**: Export from `src/index.ts`
- **CSS-in-JS**: Griffel (Fluent UI v9 patterns)

## Pull Request Process

1. Ensure all tests pass (`npm run test && make test`)
2. Ensure linting passes (`npm run lint && make lint`)
3. Update documentation if your changes affect public APIs
4. Describe your changes clearly in the PR description
5. Link any related issues

## Adding a New Channel Adapter

See `kits/channel-adapter/` for templates:

1. Implement `ChannelAdapter<TInbound, TOutbound, TStreamChunk>` with `pub()`, `sub()`, `stream()`
2. Add your channel name to the `ChannelType` union in the protocol
3. Register the adapter in the factory
4. Create an app in `apps/<your-channel>/`
5. Add gateway routing if needed

## Security

- **Never** commit secrets, API keys, or credentials
- Use environment variables for all configuration
- Use `DefaultAzureCredential` for Azure service calls
- Never expose user PII in logs

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md).

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
