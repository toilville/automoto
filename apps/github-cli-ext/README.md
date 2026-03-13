# gh msr — GitHub CLI Extension for Microsoft Research

Search Microsoft Research publications, find researchers, and explore research areas directly from your terminal.

## Install

```bash
gh extension install microsoft/gh-msr
```

Or for local development:
```bash
cd apps/github-cli-ext
npm run build
gh extension install .
```

## Usage

```bash
gh msr search "transformer architecture"
gh msr researcher "John Smith"
gh msr publications --limit 10
gh msr areas
gh msr chat "What are the latest advances in quantum computing?"
```

## Options

| Flag | Description |
|------|-------------|
| `--limit, -l` | Max results (default: 5) |
| `--type, -t` | Filter: all, publications, researchers, projects |
| `--json` | Output raw JSON |
| `--help, -h` | Show help |
