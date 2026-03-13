/**
 * Inspired by the Power CAT Copilot Studio Kit
 * (https://github.com/microsoft/Power-CAT-Copilot-Studio-Kit)
 * Ported to run locally without Power Platform/Dataverse dependencies.
 * Original kit is maintained by the Power Customer Advisory Team at Microsoft.
 */
import type { WebChatTheme } from "../types";

export function exportThemeAsJson(theme: WebChatTheme): string {
  return `${JSON.stringify(theme.styleOptions ?? {}, null, 2)}\n`;
}

export function exportThemeAsHtml(
  theme: WebChatTheme,
  tokenEndpoint: string,
): string {
  const styleOptionsJson = exportThemeAsJson(theme).trim();
  const pageTitle = escapeHtml(theme.name ?? "Copilot Studio Webchat");
  const accent = escapeHtml(
    String(theme.styleOptions?.accent ?? theme.styleOptions?.sendBoxButtonColor ?? "#0078D4"),
  );
  const backgroundColor = escapeHtml(
    String(theme.styleOptions?.backgroundColor ?? "#F5F7FA"),
  );
  const botAvatarInitials = escapeHtml(
    String(theme.styleOptions?.botAvatarInitials ?? "AI"),
  );

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${pageTitle}</title>
  <script crossorigin="anonymous" src="https://cdn.botframework.com/botframework-webchat/latest/webchat.js"></script>
  <style>
    :root {
      color-scheme: light;
      --page-background: ${backgroundColor};
      --accent: ${accent};
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      min-height: 100vh;
      font-family: "Segoe UI", Arial, sans-serif;
      background: linear-gradient(135deg, var(--page-background) 0%, #ffffff 100%);
      color: #1f1f1f;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }

    .shell {
      width: min(960px, 100%);
      background: rgba(255, 255, 255, 0.92);
      border: 1px solid rgba(0, 0, 0, 0.06);
      border-radius: 20px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.14);
      overflow: hidden;
    }

    .header {
      padding: 20px 24px;
      background: linear-gradient(135deg, var(--accent) 0%, #111827 160%);
      color: #ffffff;
    }

    .header h1 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
    }

    .header p {
      margin: 8px 0 0;
      opacity: 0.88;
    }

    #webchat {
      width: 100%;
      height: 720px;
      background: var(--page-background);
    }

    .error {
      color: #b42318;
      padding: 24px;
    }
  </style>
</head>
<body>
  <div class="shell">
    <div class="header">
      <h1>${pageTitle}</h1>
      <p>Bot initials: ${botAvatarInitials}</p>
    </div>
    <div id="webchat" role="main"></div>
  </div>

  <script>
    const tokenEndpoint = ${JSON.stringify(tokenEndpoint)};
    const styleOptions = ${styleOptionsJson};

    function normalizeDirectLineDomain(url) {
      return String(url || "")
        .replace(/\/v3\/directline\/?$/i, "")
        .replace(/\/+$/, "");
    }

    function buildRegionalChannelSettingsUrl(endpoint) {
      const url = new URL(endpoint);
      if (!url.pathname.toLowerCase().includes('/powervirtualagents/')) {
        return null;
      }

      const apiVersion = url.searchParams.get('api-version') || '2022-03-01-preview';
      return url.origin + '/powervirtualagents/regionalchannelsettings?api-version=' + encodeURIComponent(apiVersion);
    }

    async function parseJson(response, source) {
      const text = await response.text();
      if (!response.ok) {
        throw new Error('Request to ' + source + ' failed with ' + response.status + ' ' + response.statusText + '. ' + text.slice(0, 200));
      }
      return text ? JSON.parse(text) : {};
    }

    async function fetchToken(endpoint) {
      const response = await fetch(endpoint, { headers: { Accept: 'application/json' } });
      return parseJson(response, endpoint);
    }

    async function fetchRegionalSettings(endpoint) {
      const settingsUrl = buildRegionalChannelSettingsUrl(endpoint);
      if (!settingsUrl) {
        return undefined;
      }

      const response = await fetch(settingsUrl, { headers: { Accept: 'application/json' } });
      if (!response.ok) {
        return undefined;
      }

      return parseJson(response, settingsUrl);
    }

    (async function init() {
      try {
        const [tokenInfo, regionalSettings] = await Promise.all([
          fetchToken(tokenEndpoint),
          fetchRegionalSettings(tokenEndpoint),
        ]);

        if (!tokenInfo.token) {
          throw new Error('Token endpoint did not return a Direct Line token.');
        }

        const directLineDomain =
          normalizeDirectLineDomain(regionalSettings?.channelUrlsById?.directline) ||
          normalizeDirectLineDomain(tokenInfo.channelUrlsById?.directline) ||
          'https://directline.botframework.com';

        window.WebChat.renderWebChat(
          {
            directLine: window.WebChat.createDirectLine({
              token: tokenInfo.token,
              domain: directLineDomain + '/v3/directline',
            }),
            styleOptions,
          },
          document.getElementById('webchat'),
        );
      } catch (error) {
        console.error('Failed to initialize themed webchat.', error);
        document.getElementById('webchat').innerHTML = '<div class="error">' + String(error instanceof Error ? error.message : error) + '</div>';
      }
    })();
  </script>
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
