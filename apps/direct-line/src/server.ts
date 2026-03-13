/**
 * Direct Line WebChat Widget Server
 *
 * Serves an embeddable Research chat widget via Azure Bot Service Direct Line.
 *
 * Endpoints:
 *   GET  /           — Widget demo page
 *   GET  /widget     — Embeddable widget HTML (for iframe)
 *   POST /api/token  — Exchange Direct Line secret for user token
 *   GET  /embed.js   — JavaScript embed snippet
 *   GET  /health     — Health check
 */
import express from "express";
import cors from "cors";

const app = express();
const PORT = parseInt(process.env.PORT ?? "7075", 10);
const DIRECT_LINE_SECRET = process.env.DIRECT_LINE_SECRET ?? "";
const BOT_NAME = "Research Assistant";

app.use(cors());
app.use(express.json());

// Token exchange endpoint — generates a user-specific Direct Line token
app.post("/api/token", async (_req, res) => {
  if (!DIRECT_LINE_SECRET) {
    res.status(500).json({ error: "DIRECT_LINE_SECRET not configured" });
    return;
  }

  try {
    const response = await fetch(
      "https://directline.botframework.com/v3/directline/tokens/generate",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${DIRECT_LINE_SECRET}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user: { id: `user-${Date.now()}`, name: "Website Visitor" },
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Token generation failed: ${response.status}`);
    }

    const data = (await response.json()) as {
      token: string;
      conversationId: string;
      expires_in: number;
    };
    res.json({
      token: data.token,
      conversationId: data.conversationId,
      expiresIn: data.expires_in,
    });
  } catch (err) {
    console.error("[Token Exchange] Error:", err);
    res.status(500).json({ error: "Failed to generate token" });
  }
});

// Serve the embeddable widget page (for iframe embedding)
app.get("/widget", (_req, res) => {
  res.setHeader("Content-Type", "text/html");
  res.send(getWidgetHTML());
});

// Serve the JavaScript embed snippet
app.get("/embed.js", (req, res) => {
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  res.setHeader("Content-Type", "application/javascript");
  res.send(getEmbedScript(baseUrl));
});

// Demo page showing the widget
app.get("/", (req, res) => {
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  res.setHeader("Content-Type", "text/html");
  res.send(getDemoHTML(baseUrl));
});

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "automoto-direct-line-widget", bot: BOT_NAME });
});

app.listen(PORT, () => {
  console.log(`💬 Direct Line Widget server on port ${PORT}`);
  console.log(`   GET  /          — Demo page`);
  console.log(`   GET  /widget    — Embeddable widget (iframe)`);
  console.log(`   GET  /embed.js  — JavaScript embed snippet`);
  console.log(`   POST /api/token — Token exchange`);
});

function getWidgetHTML(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${BOT_NAME}</title>
  <script crossorigin="anonymous" src="https://cdn.botframework.com/botframework-webchat/latest/webchat.js"></script>
  <style>
    html, body { margin: 0; padding: 0; height: 100%; overflow: hidden; font-family: 'Segoe UI', sans-serif; }
    #webchat { height: 100%; width: 100%; }
    .loading { display: flex; align-items: center; justify-content: center; height: 100%; color: #666; }
  </style>
</head>
<body>
  <div id="webchat"><div class="loading">Loading ${BOT_NAME}...</div></div>
  <script>
    (async function () {
      const tokenRes = await fetch('/api/token', { method: 'POST' });
      const { token } = await tokenRes.json();

      window.WebChat.renderWebChat(
        {
          directLine: window.WebChat.createDirectLine({ token }),
          userID: 'website-visitor',
          username: 'Visitor',
          locale: 'en-US',
          styleOptions: {
            primaryFont: "'Segoe UI', sans-serif",
            bubbleBackground: '#f3f2f1',
            bubbleFromUserBackground: '#742774',
            bubbleFromUserTextColor: '#ffffff',
            botAvatarInitials: 'AI',
            userAvatarInitials: 'You',
            hideUploadButton: true,
            sendBoxButtonColor: '#742774',
            suggestedActionBackground: '#742774',
            suggestedActionTextColor: '#ffffff',
          },
        },
        document.getElementById('webchat'),
      );
    })();
  </script>
</body>
</html>`;
}

function getEmbedScript(baseUrl: string): string {
  return `
/**
 * Research Chat Widget — Embed Script
 *
 * Add this to any website:
 *   <script src="${baseUrl}/embed.js"></script>
 *
 * Or with custom options:
 *   <script src="${baseUrl}/embed.js" data-position="bottom-left" data-height="500"></script>
 */
(function() {
  var script = document.currentScript;
  var position = script?.getAttribute('data-position') || 'bottom-right';
  var height = script?.getAttribute('data-height') || '600';
  var width = script?.getAttribute('data-width') || '400';

  // Create floating button
  var btn = document.createElement('div');
  btn.id = 'automoto-chat-btn';
  btn.innerHTML = '🔬';
  btn.title = 'Chat with Research Assistant';
  btn.style.cssText = 'position:fixed;' + (position.includes('left') ? 'left' : 'right') + ':20px;bottom:20px;width:56px;height:56px;border-radius:50%;background:#742774;color:white;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:24px;box-shadow:0 4px 12px rgba(0,0,0,0.3);z-index:99999;transition:transform 0.2s;';
  btn.onmouseenter = function() { btn.style.transform = 'scale(1.1)'; };
  btn.onmouseleave = function() { btn.style.transform = 'scale(1)'; };

  // Create chat container
  var container = document.createElement('div');
  container.id = 'automoto-chat-container';
  container.style.cssText = 'position:fixed;' + (position.includes('left') ? 'left' : 'right') + ':20px;bottom:90px;width:' + width + 'px;height:' + height + 'px;border-radius:12px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.2);z-index:99999;display:none;';

  var iframe = document.createElement('iframe');
  iframe.src = '${baseUrl}/widget';
  iframe.style.cssText = 'width:100%;height:100%;border:none;';
  iframe.title = 'Research Chat';
  container.appendChild(iframe);

  var isOpen = false;
  btn.onclick = function() {
    isOpen = !isOpen;
    container.style.display = isOpen ? 'block' : 'none';
    btn.innerHTML = isOpen ? '✕' : '🔬';
  };

  document.body.appendChild(btn);
  document.body.appendChild(container);
})();
`;
}

function getDemoHTML(baseUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${BOT_NAME} — Widget Demo</title>
  <style>
    body { font-family: 'Segoe UI', sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #333; }
    h1 { color: #742774; }
    code { background: #f3f2f1; padding: 2px 6px; border-radius: 3px; font-size: 14px; }
    pre { background: #f3f2f1; padding: 16px; border-radius: 8px; overflow-x: auto; }
    .demo-frame { border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; margin: 20px 0; }
  </style>
</head>
<body>
  <h1>🔬 ${BOT_NAME}</h1>
  <p>Embed the Research chat on any website.</p>

  <h2>Option 1: iframe</h2>
  <pre>&lt;iframe src="${baseUrl}/widget" width="400" height="600" style="border:none;"&gt;&lt;/iframe&gt;</pre>

  <h2>Option 2: Floating Widget (script tag)</h2>
  <pre>&lt;script src="${baseUrl}/embed.js"&gt;&lt;/script&gt;</pre>

  <h2>Live Demo</h2>
  <div class="demo-frame">
    <iframe src="${baseUrl}/widget" width="100%" height="600" style="border:none;"></iframe>
  </div>

  <script src="${baseUrl}/embed.js" data-position="bottom-right"></script>
</body>
</html>`;
}
