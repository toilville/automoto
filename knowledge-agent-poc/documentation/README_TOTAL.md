# Knowledge Agent – Channel Guide with Pros/Cons and Microsoft Docs

Status: Production Ready
Date: December 18, 2025

Overview
This guide maps what you can do in each channel and links to authoritative Microsoft documentation. Choose the channel that fits your workflow, scale, and governance needs.

Channels at a Glance

- Local CLI (Tier 1) – Fast local runs for development and testing.
- Microsoft 365 (Tier 2) – Enterprise document sources (SharePoint/OneDrive) and Teams notifications.
- Azure AI Foundry (Tier 3) – Managed models, evaluation, monitoring, and agentic patterns.
- Power Platform (Tier 4) – No/low‑code automation, apps, and analytics.


Local CLI (Tier 1)

- What: Run extraction locally from files; emit JSON artifacts.
- Pros: Simple, quick iteration; zero external dependencies; great for dev.
- Cons: No enterprise storage/notifications; limited observability at scale.
- Try:
  - python knowledge_agent_bot.py
  - python examples.py
- See: [knowledge_agent_bot.py](knowledge-agent-poc/knowledge_agent_bot.py), [examples.py](knowledge-agent-poc/examples.py)

Microsoft 365 (Tier 2)

- What: Extract from SharePoint and OneDrive; optional Teams posting.
- Pros: Built into M365 governance; provenance; collaboration via Teams; storage in SharePoint.
- Cons: Requires tenant/app registration and Graph permissions; network/tenant dependencies.
- Try:
  - set M365_ENABLED=true
  - python knowledge_agent_bot.py --m365
  - python m365_examples.py
- See: [m365_connector.py](knowledge-agent-poc/integrations/m365_connector.py), [m365_examples.py](knowledge-agent-poc/m365_examples.py)
- Microsoft Docs:
  - [Microsoft Graph overview](https://learn.microsoft.com/graph/)
  - [SharePoint via Graph](https://learn.microsoft.com/graph/api/resources/sharepoint)
  - [OneDrive overview](https://learn.microsoft.com/graph/onedrive-concept-overview)
  - [Teams overview](https://learn.microsoft.com/graph/teams-concept-overview)

Azure AI Foundry (Tier 3)

- What: Use Foundry‑deployed models (gpt‑4‑turbo, gpt‑4o, phi‑3, mistral); enable evaluation and monitoring.
- Pros: Managed endpoints; observability; evaluation at scale; team collaboration; agentic workflows.
- Cons: Additional service setup; model costs; operational complexity for large workloads.
- Try:
  - pip install -r requirements-tier3-tier4.txt
  - set FOUNDRY_ENABLED=true
  - set FOUNDRY_CONNECTION_STRING=YOUR_CONNECTION
  - python tier3_tier4_examples.py
- See: [foundry_provider.py](knowledge-agent-poc/integrations/foundry_provider.py), [foundry_integration.py](knowledge-agent-poc/integrations/foundry_integration.py)
- Microsoft Docs:
  - [Azure AI Foundry (Learn)](https://learn.microsoft.com/azure/ai-services/ai-foundry/)
  - [Azure AI Foundry portal](https://ai.azure.com/)

Power Platform (Tier 4)

- What: Expose REST API for Power Automate, Power Apps, and analytics for Power BI.
- Pros: Rapid automation; citizen developer friendly; deep Microsoft ecosystem integrations.
- Cons: Flow run costs; API hosting; best with M365/Foundry backing for storage and quality.
- Try:
  - pip install -r requirements-tier3-tier4.txt
  - set POWER_PLATFORM_ENABLED=true
  - python -m integrations.power_platform_connector
  - curl %API_URL%/health
- Default API URL: [http://localhost:8000](http://localhost:8000)
- See: [power_platform_connector.py](knowledge-agent-poc/integrations/power_platform_connector.py)
- Microsoft Docs:
  - [Power Automate](https://learn.microsoft.com/power-automate/)
  - [Power Apps](https://learn.microsoft.com/power-apps/)
  - [Power BI](https://learn.microsoft.com/power-bi/)

Bot Testing (Optional)

- What: Conversational testing via Bot Framework Emulator.
- Pros: Chat UX to drive extractions; quick validation.
- Cons: Not a production surface by itself; best for testing.
- Docs: [Bot Framework Emulator](https://learn.microsoft.com/azure/bot-service/bot-service-debug-emulator)

When to Use Which

- Prototype quickly → Local CLI
- Enterprise files & collaboration → Microsoft 365
- Production scale, observability → Azure AI Foundry
- Business workflows & dashboards → Power Platform
- Conversational testing → Bot Emulator

Feature Matrix (Summary)

- Paper/talk/repo extraction: All channels
- Save to SharePoint/OneDrive: Microsoft 365, Power Platform (via flows)
- Teams notifications: Microsoft 365; Power Platform flows
- Quality evaluation/monitoring: Azure AI Foundry; Power BI summaries
- Automation/UI: Power Automate/Apps; Bot Emulator (testing)

Configuration

- Unified settings: [integrations/extended_settings.py](knowledge-agent-poc/integrations/extended_settings.py)
- Env keys (common):
  - Tier 2: M365_ENABLED, M365_TENANT_ID, M365_CLIENT_ID, M365_CLIENT_SECRET
  - Tier 3: FOUNDRY_ENABLED, FOUNDRY_CONNECTION_STRING, LLM_PROVIDER
  - Tier 4: POWER_PLATFORM_ENABLED, API_PORT
  - Mode: INTEGRATION_MODE=local|m365|foundry|power-platform|full-enterprise

Start Here

- CLI routes: [CLI_ROUTES.md](knowledge-agent-poc/CLI_ROUTES.md)
- Verify setup: `python verify_tier3_tier4.py`
- Run examples: `python tier3_tier4_examples.py`

Security Notes

- Store secrets in Key Vault or environment; HTTPS for APIs; least‑privilege app registrations; audit flows and Graph calls.

Support

- [Microsoft Graph](https://learn.microsoft.com/graph/)
- [Azure AI Foundry](https://learn.microsoft.com/azure/ai-services/ai-foundry/)
- [Power Platform](https://learn.microsoft.com/power-platform/)
