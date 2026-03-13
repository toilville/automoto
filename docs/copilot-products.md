# Copilot Product Cheat Sheet

This repo touches three distinct Copilot products. Their manifests, deployment flows, channels, and testing tools are **not** interchangeable.

## Microsoft Copilot Studio (formerly Power Virtual Agents)

- **What it is**: Low-code/no-code agent builder on Power Platform.
- **Target audience**: Citizen developers, business users, and makers.
- **Key artifacts**: `agent-manifest.json`, `topics.json`, `api-plugin.json`.
- **Deployment**: Power Platform CLI (`pac copilot create`, `pac copilot publish`) or the Copilot Studio portal.
- **Testing**: Power CAT Copilot Studio Kit for test automation, webchat playground, and adaptive cards; the built-in Copilot Studio test pane; `apps/copilot-studio-webchat/` for custom UI testing.
- **Channel**: Copilot Studio channels (web, Teams, mobile, custom).
- **Token pattern**: Use the token endpoint URL from **Channels → Mobile App** settings.
- **In this repo**: `apps/copilot-studio/`, `apps/copilot-studio-webchat/`.
- **Official samples**: [CopilotStudioSamples](https://github.com/microsoft/CopilotStudioSamples), [Power CAT Copilot Studio Kit](https://github.com/microsoft/Power-CAT-Copilot-Studio-Kit).

## Microsoft 365 Copilot (M365 Copilot)

- **What it is**: Enterprise AI assistant embedded in Microsoft 365 apps such as Word, Excel, Teams, Outlook, and more.
- **Target audience**: Enterprise developers extending Microsoft 365.
- **Key artifacts**: `declarativeAgent.json`, API plugins, Graph Connectors.
- **Deployment**: Teams App Package and Microsoft 365 Admin Center.
- **Channel**: Microsoft 365 surface areas (Teams, Outlook, Word, Excel, etc.).
- **In this repo**: `apps/m365-agents/`, `apps/copilot-search-connector/`, `apps/copilot-knowledge-connector/`, `apps/message-extension/`.
- **Official samples**: [M365 Agents Toolkit samples](https://github.com/OfficeDev/microsoft-365-agents-toolkit-samples).

## GitHub Copilot

- **What it is**: AI-powered developer assistant for code completion, chat, and CLI workflows.
- **Target audience**: Developers.
- **Key artifacts**: GitHub App manifest, Copilot Chat extensions.
- **Channel**: VS Code, JetBrains, CLI, and GitHub.com.
- **In this repo**: `apps/github-copilot-ext/`, `apps/github-cli-ext/`.

## Comparison Table

| Feature | Copilot Studio | M365 Copilot | GitHub Copilot |
|---|---|---|---|
| **Builder type** | Low-code/no-code maker experience on Power Platform | Declarative and enterprise extensibility for Microsoft 365 | Developer-focused coding assistant |
| **Manifest format** | `agent-manifest.json`, `topics.json`, `api-plugin.json` | `declarativeAgent.json`, API plugins, Graph Connectors | GitHub App manifest, Copilot Chat extension metadata |
| **Deployment target** | Copilot Studio channels (web, Teams, mobile, custom) | Teams App Package, Microsoft 365 Admin Center, Microsoft 365 apps | VS Code, JetBrains, CLI, GitHub.com |
| **Auth model** | Copilot Studio channel token endpoint plus Power Platform-managed auth/connectors | Microsoft Entra ID, Teams app permissions, tenant admin deployment | GitHub auth, GitHub App permissions, Copilot entitlement |
| **Testing tool** | Power CAT Copilot Studio Kit, Copilot Studio test pane, `apps/copilot-studio-webchat/` | Test tenant, Teams sideloading, connector/plugin validation | IDE chat, CLI, GitHub.com, extension test flows |
| **This repo's app** | `apps/copilot-studio/`, `apps/copilot-studio-webchat/` | `apps/m365-agents/`, `apps/copilot-search-connector/`, `apps/copilot-knowledge-connector/`, `apps/message-extension/` | `apps/github-copilot-ext/`, `apps/github-cli-ext/` |

## ⚠️ Common Confusion

- `copilot-plugin.json` at the repo root is a **Teams compose extension manifest** for M365 Copilot/Teams, **not** a Copilot Studio artifact.
- Copilot Studio uses `agent-manifest.json` in `apps/copilot-studio/src/manifest/` together with `topics.json` and `api-plugin.json`.
- The Power Platform adapter (`apps/power-platform/`) is for Power Platform connectors and flows, **not** Copilot Studio specifically.
