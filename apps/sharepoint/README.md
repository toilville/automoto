# @automoto/sharepoint — SPFx Web Part for Research Chat

Scaffold for a SharePoint Framework (SPFx) web part that embeds the Research chat experience into SharePoint pages and Viva Connections dashboards.

## What's Included

| File | Description |
|------|-------------|
| `src/webparts/research/ResearchWebPart.ts` | SPFx web part that renders an iframe embedding the home chat app, passing SharePoint context (site URL, user, page) as query parameters. |
| `src/webparts/research/ResearchWebPart.manifest.json` | SPFx manifest defining the web part metadata, supported hosts (SharePoint, Teams Personal App, Teams Tab), and default property values. |
| `src/webparts/research/VivaConnectionsCard.ts` | Viva Connections Adaptive Card Extension (ACE) that shows research highlights on the dashboard and links to the full chat experience. |

## Integrating with a Full SPFx Project

This scaffold contains source files and type stubs. To build a deployable `.sppkg` package, integrate these into a full SPFx project:

```bash
# 1. Scaffold a new SPFx project
npx @microsoft/generator-sharepoint

# 2. Copy the web part source files into the generated project
cp -r src/webparts/research <spfx-project>/src/webparts/

# 3. Install dependencies and build
cd <spfx-project>
npm install
gulp bundle --ship
gulp package-solution --ship
```

## Deployment

1. Build the `.sppkg` package using the SPFx toolchain (see above).
2. Upload the package to your **SharePoint App Catalog** (tenant or site-scoped).
3. Add the **Research Chat** web part to any SharePoint page.
4. Configure the web part properties (chat endpoint, agent ID, height, header visibility) via the property pane.

## Web Part Properties

| Property | Default | Description |
|----------|---------|-------------|
| `chatEndpoint` | `https://home.azurewebsites.net` | URL of the home chat application |
| `agentId` | (empty) | Optional agent identifier for routing |
| `height` | `600px` | Height of the embedded iframe |
| `showHeader` | `true` | Whether to display the branded header bar |

## Viva Connections ACE

The `VivaConnectionsCard.ts` exports Adaptive Card templates for:

- **Card view** — shows "Research" branding with a highlights container and actions to open the chat or refresh.
- **Quick view** — provides a search input that opens the chat with a pre-filled query.

The `ResearchAce` class includes a `fetchHighlights()` method that retrieves research area data from the data API.
