# Copilot Studio Webchat

A standalone Vite + TypeScript webchat widget that embeds a [Microsoft Copilot Studio](https://aka.ms/CopilotStudio) agent using the official Bot Framework Web Chat SDK. When no token endpoint is configured it falls back to a **local mock Direct Line** so the full UI can be tested without any Power Platform access.

> **Replaces** the single-file [`CustomChatbotUI.html`](https://github.com/microsoft/CopilotStudioSamples/tree/main/CustomExternalUI) sample with a typed, themeable, testable implementation.

## Features

| Feature | Description |
|---|---|
| **Webchat widget** | Floating chat bubble, popup panel, responsive mobile-fullscreen, restart / close controls, keyboard accessible. |
| **Mock Direct Line** | Echoes messages, sends sample adaptive cards, suggested actions and typing indicators — zero backend needed. |
| **Theme presets** | 5 ready-made themes (Default Blue, Dark Mode, Warm Coral, Forest Green, Purple Glow) ported from the Power CAT Webchat Playground. |
| **Theme export** | Export any theme as JSON `styleOptions` or as a self-contained HTML snippet. |
| **Adaptive Cards gallery** | 5 template cards (hero, list, form, weather, receipt) for quick prototyping. |
| **CLI test runner** | Batch-test your agent via Direct Line REST API — response match, topic match, attachment match, generative (rubric) and multi-turn. No Dataverse required. |

## Quick start

```bash
# From the monorepo root
npm install
npm run dev:webchat          # → http://localhost:5173
```

### Connect to a real agent

1. Copy `.env.example` → `.env`.
2. Paste your **Copilot Studio → Channels → Mobile App → Token Endpoint** URL into `VITE_TOKEN_ENDPOINT`.
3. Restart the dev server.

### Run agent tests

```bash
npm run test:agents                          # run sample test set (mock)
npx tsx src/testing/run-tests.ts --token-endpoint <URL>   # run against live agent
```

See [`test-sets/sample.json`](test-sets/sample.json) for the test-set format.

## Project structure

```
apps/copilot-studio-webchat/
├── index.html                   # Entry point (floating widget)
├── src/
│   ├── main.ts                  # Boot logic, Direct Line connection, WebChat render
│   ├── mock-direct-line.ts      # Mock Direct Line for offline testing
│   ├── style-options.ts         # Default WebChat styleOptions type + defaults
│   ├── types.ts                 # Shared TypeScript types
│   ├── cards/
│   │   ├── gallery.ts           # Card template index
│   │   └── templates/           # Adaptive Card JSON templates
│   ├── themes/
│   │   ├── presets.ts           # 5 theme presets
│   │   └── export.ts            # JSON / HTML export utilities
│   └── testing/
│       ├── run-tests.ts         # CLI test runner
│       ├── evaluators.ts        # Test result evaluators
│       └── direct-line-client.ts  # Direct Line REST client (Node.js)
└── test-sets/
    └── sample.json              # Example test set
```

## How the token flow works

This is the same pattern used by the official [CopilotStudioSamples/CustomExternalUI](https://github.com/microsoft/CopilotStudioSamples/tree/main/CustomExternalUI):

1. Fetch **regional channel settings** from the token endpoint to get the correct Direct Line domain.
2. Fetch a **Direct Line token** from the token endpoint.
3. Create a `WebChat.createDirectLine()` connection with the token and domain.
4. On `DIRECT_LINE/CONNECT_FULFILLED`, dispatch a `startConversation` event.

If token fetch fails the app automatically falls back to mock mode.

## Attribution

This app is inspired by and incorporates patterns from:

- [Power CAT Copilot Studio Kit](https://github.com/microsoft/Power-CAT-Copilot-Studio-Kit) — Webchat Playground, Testing Capabilities, Adaptive Cards Gallery (MIT License)
- [CopilotStudioSamples/CustomExternalUI](https://github.com/microsoft/CopilotStudioSamples/tree/main/CustomExternalUI) — Custom webchat embed pattern (MIT License)
- [Microsoft Copilot Studio guidance — Agent samples](https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/agent-samples)

These upstream projects are maintained by Microsoft under their respective licenses.

## See also

- [Copilot Product Cheat Sheet](../../docs/copilot-products.md) — Copilot Studio vs M365 Copilot vs GitHub Copilot
- [Power CAT Kit overview](https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/kit-overview)
- [Web Chat customization docs](https://learn.microsoft.com/en-us/azure/bot-service/bot-builder-webchat-customization)
