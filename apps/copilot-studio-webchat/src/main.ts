import type { Subscription } from "rxjs";
import { MockDirectLine } from "./mock-direct-line";
import type { WebChatStyleOptions } from "./style-options";
import { defaultTheme } from "./themes/presets";
import type { DirectLineLike, WebChatTheme } from "./types";

declare global {
  interface ImportMetaEnv {
    readonly VITE_TOKEN_ENDPOINT?: string;
    readonly VITE_BOT_NAME?: string;
    readonly VITE_ACCENT_COLOR?: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }

  interface Window {
    WebChat?: WebChatSDK;
    automotoCopilotStudioWebchat?: {
      applyTheme: typeof applyTheme;
      hideChat: typeof hideChat;
      initializeChat: typeof initializeChat;
      restartConversation: typeof restartConversation;
      showChat: typeof showChat;
    };
  }
}

interface WebChatStoreAction {
  type: string;
  payload?: {
    name?: string;
    value?: unknown;
  };
}

interface WebChatStoreMiddlewareApi {
  dispatch: (action: WebChatStoreAction) => void;
}

interface WebChatSDK {
  createDirectLine(options: { token: string; domain?: string }): DirectLineLike;
  createStore(
    initialState?: unknown,
    enhancer?: (api: WebChatStoreMiddlewareApi) => (next: (action: WebChatStoreAction) => unknown) => (action: WebChatStoreAction) => unknown,
  ): unknown;
  renderWebChat(
    options: {
      directLine: DirectLineLike;
      locale: string;
      store: unknown;
      styleOptions: WebChatStyleOptions;
      userID: string;
      username: string;
    },
    element: HTMLElement,
  ): void;
}

interface RegionalChannelSettings {
  channelUrlsById?: {
    directline?: string;
  };
}

interface TokenPayload {
  token: string;
}

interface ConnectionSetup {
  directLine: DirectLineLike;
  mode: "live" | "mock";
  banner?: {
    text: string;
    tone: "info" | "warning";
  };
}

const tokenEndpoint = import.meta.env.VITE_TOKEN_ENDPOINT?.trim() ?? "";
const botName = import.meta.env.VITE_BOT_NAME?.trim() || "Automoto Assistant";
const locale = navigator.language || document.documentElement.lang || "en-US";
const userId = createUserId();

const bubbleButton = assertElement(document.querySelector<HTMLButtonElement>("#chat-bubble"), "chat bubble button");
const chatPanel = assertElement(document.querySelector<HTMLElement>("#chat-panel"), "chat panel");
const closeButton = assertElement(document.querySelector<HTMLButtonElement>("#close-chat"), "close button");
const restartButton = assertElement(document.querySelector<HTMLButtonElement>("#restart-chat"), "restart button");
const titleElement = assertElement(document.querySelector<HTMLElement>("#chat-title"), "chat title");
const subtitleElement = assertElement(document.querySelector<HTMLElement>("#chat-subtitle"), "chat subtitle");
const bannerElement = assertElement(document.querySelector<HTMLElement>("#chat-banner"), "chat banner");
const webchatElement = assertElement(document.querySelector<HTMLElement>("#webchat"), "webchat root");

let currentTheme = buildBootTheme(defaultTheme);
let currentDirectLine: DirectLineLike | null = null;
let currentStore: unknown;
let currentMode: "live" | "mock" = tokenEndpoint ? "live" : "mock";
let restartPromise: Promise<void> | null = null;
let connectionSubscription: Subscription | { unsubscribe: () => void } | null = null;

titleElement.textContent = botName;
subtitleElement.textContent = "Open the widget to start a conversation.";
applyTheme(currentTheme);

bubbleButton.addEventListener("click", () => {
  if (chatPanel.classList.contains("is-open")) {
    hideChat();
  } else {
    void showChat();
  }
});

closeButton.addEventListener("click", () => hideChat());
restartButton.addEventListener("click", () => {
  void restartConversation();
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && chatPanel.classList.contains("is-open")) {
    hideChat();
  }
});

window.automotoCopilotStudioWebchat = {
  applyTheme,
  hideChat,
  initializeChat,
  restartConversation,
  showChat,
};

export async function initializeChat() {
  if (currentDirectLine) {
    return;
  }

  await restartConversation();
}

export async function restartConversation() {
  if (restartPromise) {
    return restartPromise;
  }

  restartPromise = (async () => {
    setLoadingState("Starting conversation", "Creating a new Direct Line connection…");
    disposeCurrentConnection();

    const connection = await createConnection();
    currentDirectLine = connection.directLine;
    currentStore = createCustomStore();
    currentMode = connection.mode;

    if (connection.banner) {
      showBanner(connection.banner.text, connection.banner.tone);
    } else {
      hideBanner();
    }

    updateSubtitle(connection.mode === "live" ? "Connected to Copilot Studio." : "Demo mode • local mock agent.");
    updateStatusIndicator(connection.mode === "live" ? "#4ADE80" : "#F59E0B");

    await renderConversation();
    subscribeToConnectionStatus(currentDirectLine);
  })().finally(() => {
    restartPromise = null;
  });

  return restartPromise;
}

export function createCustomStore() {
  const sdk = getWebChatSdk();

  return sdk.createStore({}, ({ dispatch }) => next => action => {
    if (action.type === "DIRECT_LINE/CONNECT_FULFILLED") {
      dispatch({
        type: "WEB_CHAT/SEND_EVENT",
        payload: {
          name: "startConversation",
          value: {
            language: locale,
            source: currentMode,
          },
        },
      });
    }

    return next(action);
  });
}

export async function showChat() {
  chatPanel.classList.add("is-open");
  chatPanel.setAttribute("aria-hidden", "false");
  bubbleButton.setAttribute("aria-expanded", "true");

  await initializeChat();
}

export function hideChat() {
  chatPanel.classList.remove("is-open");
  chatPanel.setAttribute("aria-hidden", "true");
  bubbleButton.setAttribute("aria-expanded", "false");
  bubbleButton.focus();
}

export function applyTheme(theme: WebChatTheme) {
  currentTheme = theme;

  const accent = theme.styleOptions.accent || "#0078D4";
  document.documentElement.style.setProperty("--accent-color", accent);
  document.documentElement.style.setProperty("--accent-contrast", "#FFFFFF");

  if (currentDirectLine) {
    void renderConversation();
  }
}

async function createConnection(): Promise<ConnectionSetup> {
  if (!tokenEndpoint) {
    return {
      directLine: new MockDirectLine(botName),
      mode: "mock",
      banner: {
        text: "Configure VITE_TOKEN_ENDPOINT in .env to connect to your Copilot Studio agent. Demo mode is active with a local mock Direct Line implementation.",
        tone: "info",
      },
    };
  }

  try {
    const sdk = await ensureWebChatSdk();
    const apiVersion = new URL(tokenEndpoint).searchParams.get("api-version") ?? "2022-03-01-preview";
    const regionalSettingsUrl = new URL(`/powervirtualagents/regionalchannelsettings?api-version=${apiVersion}`, tokenEndpoint).toString();

    const [regionalSettings, tokenPayload] = await Promise.all([
      fetchJson<RegionalChannelSettings>(regionalSettingsUrl).catch(() => undefined),
      fetchToken(tokenEndpoint),
    ]);

    const directLineOptions: { token: string; domain?: string } = { token: tokenPayload.token };
    const regionalDirectLineUrl = regionalSettings?.channelUrlsById?.directline;

    if (regionalDirectLineUrl) {
      directLineOptions.domain = new URL("v3/directline", regionalDirectLineUrl).toString();
    }

    return {
      directLine: sdk.createDirectLine(directLineOptions),
      mode: "live",
    };
  } catch (error) {
    console.warn("Falling back to mock Direct Line.", error);

    return {
      directLine: new MockDirectLine(botName),
      mode: "mock",
      banner: {
        text: `Could not connect to the configured token endpoint. Falling back to demo mode. ${getErrorMessage(error)}`,
        tone: "warning",
      },
    };
  }
}

async function renderConversation() {
  if (!currentDirectLine) {
    return;
  }

  const sdk = await ensureWebChatSdk();
  webchatElement.innerHTML = "";

  sdk.renderWebChat(
    {
      directLine: currentDirectLine,
      locale,
      store: currentStore,
      styleOptions: currentTheme.styleOptions,
      userID: userId,
      username: "Website visitor",
    },
    webchatElement,
  );
}

function subscribeToConnectionStatus(directLine: DirectLineLike) {
  connectionSubscription?.unsubscribe();
  connectionSubscription = directLine.connectionStatus$.subscribe(status => {
    if (status === 2) {
      updateSubtitle(currentMode === "live" ? "Connected to Copilot Studio." : "Demo mode • local mock agent.");
      updateStatusIndicator(currentMode === "live" ? "#4ADE80" : "#F59E0B");
      return;
    }

    if (status === 4) {
      updateSubtitle("Connection failed.");
      updateStatusIndicator("#EF4444");
      showBanner("The Direct Line connection could not be established.", "warning");
      return;
    }

    if (status === 5) {
      updateSubtitle("Conversation ended.");
      updateStatusIndicator("#94A3B8");
    }
  });
}

function disposeCurrentConnection() {
  connectionSubscription?.unsubscribe();
  connectionSubscription = null;
  currentDirectLine?.end?.();
  currentDirectLine = null;
  currentStore = undefined;
}

function setLoadingState(title: string, description: string) {
  webchatElement.innerHTML = `
    <div id="chat-loading" class="chat-loading">
      <div class="chat-loading-card">
        <strong>${escapeHtml(title)}</strong>
        <p>${escapeHtml(description)}</p>
      </div>
    </div>
  `;
}

function showBanner(message: string, tone: "info" | "warning") {
  bannerElement.textContent = message;
  bannerElement.dataset.tone = tone;
  bannerElement.classList.add("is-visible");
}

function hideBanner() {
  bannerElement.textContent = "";
  bannerElement.classList.remove("is-visible");
  bannerElement.removeAttribute("data-tone");
}

function updateSubtitle(text: string) {
  subtitleElement.textContent = text;
}

function updateStatusIndicator(color: string) {
  const indicator = document.querySelector<HTMLElement>(".chat-status-indicator");
  indicator?.style.setProperty("background", color);
}

function buildBootTheme(theme: WebChatTheme): WebChatTheme {
  const accent = normalizeAccentColor(import.meta.env.VITE_ACCENT_COLOR);

  if (!accent) {
    return theme;
  }

  return {
    ...theme,
    styleOptions: {
      ...theme.styleOptions,
      accent,
      botAvatarBackgroundColor: accent,
      bubbleFromUserBackground: accent,
      bubbleFromUserBorderColor: accent,
      sendBoxButtonColor: accent,
      sendBoxButtonColorOnFocus: accent,
      sendBoxButtonColorOnHover: accent,
      suggestedActionBorderColor: accent,
      suggestedActionTextColor: accent,
    },
  };
}

function normalizeAccentColor(color: string | undefined) {
  if (!color) {
    return undefined;
  }

  return /^#([0-9A-F]{3}|[0-9A-F]{6})$/i.test(color) ? color : undefined;
}

function getWebChatSdk() {
  if (!window.WebChat) {
    throw new Error("Bot Framework Web Chat SDK did not load.");
  }

  return window.WebChat;
}

async function ensureWebChatSdk() {
  return getWebChatSdk();
}

async function fetchToken(url: string): Promise<TokenPayload> {
  let lastError: Error | null = null;

  for (const method of ["GET", "POST"] as const) {
    try {
      const response = await fetch(url, { method });

      if (!response.ok) {
        lastError = new Error(`Token endpoint returned ${response.status} ${response.statusText}.`);
        continue;
      }

      const payload = (await response.json()) as Partial<TokenPayload>;
      if (!payload.token) {
        throw new Error("Token endpoint response did not include a token.");
      }

      return {
        token: payload.token,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown token endpoint error.");
    }
  }

  throw lastError ?? new Error("Token endpoint request failed.");
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as T;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown connection error.";
}

function assertElement<T>(element: T | null, label: string): T {
  if (!element) {
    throw new Error(`Required webchat DOM element is missing: ${label}.`);
  }

  return element;
}

function createUserId() {
  const suffix = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2, 12);
  return `webchat-user-${suffix}`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
