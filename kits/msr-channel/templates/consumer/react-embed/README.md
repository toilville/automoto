# MSR Agent Chat — React Embed

Embed the MSR Agent chat UI into your React application. Uses the vendored `@msr/chat-ui` and `@msr/data-client` packages.

## Quick Start

```bash
npm install
npm run dev
```

## How It Works

This template uses the **consumer** path — you don't build a new channel, you embed an existing one:

1. **`@msr/chat-ui`** provides `ChatContainer`, message rendering, typing indicators
2. **`@msr/data-client`** handles API communication with the MSR Agent backend
3. **Fluent UI v9** provides the design system (theming, components)

## Configuration

Set environment variables in `.env`:

```env
VITE_MSR_ENDPOINT=https://your-msr-agent.azurewebsites.net
VITE_MSR_SCOPE=your-event-name
```

Or configure directly in `src/App.tsx`.

## Vendoring for Your Repo

To use this in your own repo (outside the monorepo), copy the packages:

```bash
# From msr-event-agent-client
cp -r packages/chat-ui your-repo/packages/chat-ui
cp -r packages/data-client your-repo/packages/data-client
```

Then add them as workspace dependencies in your `package.json`.

## Customization

- **Theme**: Swap `webLightTheme` for `webDarkTheme` or a custom Fluent UI theme
- **Layout**: Adjust the wrapper div in `App.tsx` for your page layout
- **Channel**: Change `channel` from `"web"` to any registered channel type
- **Scope**: Set `scope` to filter responses to a specific event or topic
