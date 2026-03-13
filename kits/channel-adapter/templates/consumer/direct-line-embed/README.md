# Agent — Direct Line Embed

Embed the Agent as a web chat widget using the Direct Line channel.

## Quick Start

Add this snippet to your HTML page:

```html
<!-- Agent Chat Widget -->
<div id="agent-chat"></div>
<script>
  (function () {
    const config = {
      // TODO: Replace with your Direct Line endpoint
      directLineUrl:
        window.AUTOMOTO_DIRECT_LINE_URL || "http://localhost:4000/api/v1/direct-line",

      // Container element ID
      containerId: "agent-chat",

      // Optional: initial greeting message
      greeting: "Hi! I can help you find Automoto events and research information.",

      // Optional: widget title
      title: "Agent",

      // Optional: collapsed by default (click to expand)
      startCollapsed: true,

      // Optional: position (bottom-right, bottom-left)
      position: "bottom-right",

      // Optional: theme colors (Fluent UI tokens)
      theme: {
        primary: "#0078d4",
        background: "#ffffff",
      },
    };

    // Load the embed script
    const script = document.createElement("script");
    script.src = config.directLineUrl.replace(
      "/api/v1/direct-line",
      "/embed.js",
    );
    script.dataset.config = JSON.stringify(config);
    document.body.appendChild(script);
  })();
</script>
```

## Widget Customization

| Option | Default | Description |
|--------|---------|-------------|
| `directLineUrl` | — | Your Direct Line channel endpoint |
| `containerId` | `agent-chat` | DOM element to mount the widget in |
| `greeting` | — | Initial bot message |
| `title` | `Agent` | Widget header title |
| `startCollapsed` | `true` | Start as a floating button |
| `position` | `bottom-right` | Widget position |
| `theme.primary` | `#0078d4` | Primary accent color |
| `theme.background` | `#ffffff` | Widget background color |

## How It Works

The embed script:
1. Creates an iframe or shadow DOM container
2. Establishes a Direct Line WebSocket connection
3. Renders a Fluent UI-styled chat interface
4. Sends/receives Bot Framework Activities through the Direct Line channel

## When to Use This

- You want a drop-in chat widget with no React dependency
- Your site is server-rendered (PHP, Django, Rails, etc.)
- You want iframe-based isolation from your page's CSS/JS
- You're already using Bot Framework / Azure Bot Service
