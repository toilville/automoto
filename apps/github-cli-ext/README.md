# gh automoto — GitHub CLI Extension for Automoto

Search Automoto publications, find people, and explore focus areas directly from your terminal.

## Install

```bash
gh extension install automoto/gh-automoto
```

Or for local development:
```bash
cd apps/github-cli-ext
npm run build
gh extension install .
```

## Usage

```bash
gh automoto search "transformer architecture"
gh automoto researcher "John Smith"
gh automoto publications --limit 10
gh automoto areas
gh automoto chat "What are the latest advances in quantum computing?"
```

## Options

| Flag | Description |
|------|-------------|
| `--limit, -l` | Max results (default: 5) |
| `--type, -t` | Filter: all, publications, researchers, projects |
| `--json` | Output raw JSON |
| `--help, -h` | Show help |
