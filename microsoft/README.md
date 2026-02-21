# Microsoft Generic Agent Starter

This folder contains a generic, de-branded starter agent application for Azure AI Foundry-style workflows.

## What is included

- Generic catalog-based recommendation/explanation runtime
- Foundry adapter (`microsoft.adapters.foundry_adapter`)
- Prompt Flow starter assets (`microsoft/flow.dag.yaml`, `microsoft/flows/*`)
- Config separation pattern (`microsoft/config/*`)
- Starter infrastructure templates (`microsoft/infra/*`)
- Teams/Copilot starter manifests (`microsoft/teams-app.json`, `microsoft/copilot-plugin.json`, `microsoft/agent-declaration.json`)
- Containerized starter deployment (`microsoft/deploy/*`)

## Quick start

```powershell
python -m microsoft.agent recommend --interests "foundry, agents" --top 3
python -m microsoft.agent explain --title "Foundry Agent Basics" --interests "foundry, agents"
python -m microsoft.agent check-foundry
python -m microsoft.agent serve --port 8010
```

## Foundry environment variables

- `FOUNDRY_ENABLED`
- `FOUNDRY_PROJECT_ENDPOINT`
- `FOUNDRY_SUBSCRIPTION_ID`
- `FOUNDRY_RESOURCE_GROUP`
- `FOUNDRY_PROJECT_NAME`
- `FOUNDRY_MODEL_DEPLOYMENT`

## Notes

- The starter removes EventKit-specific content and naming.
- The Foundry adapter runs in degraded mode when Agent Framework SDK is not installed.

## Docker run

```powershell
docker compose -f microsoft/deploy/docker-compose.yml --env-file microsoft/deploy/.env.example up --build
```

## Manifest placeholders

- Replace app IDs and `example.com` domains in:
	- `microsoft/teams-app.json`
	- `microsoft/copilot-plugin.json`
	- `microsoft/agent-declaration.json`
