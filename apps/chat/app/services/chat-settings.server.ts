/**
 * Chat Settings Loader — server-only.
 * Reads config/chat-settings.yaml and returns UI-relevant settings.
 */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parse } from "yaml";
import type { ChatUiText, WelcomeCard } from "~/models/types";

let cachedUiText: ChatUiText | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 30_000; // 30 seconds in dev, effectively forever in prod

export async function loadChatUiText(): Promise<ChatUiText> {
  const now = Date.now();
  if (cachedUiText && now - cachedAt < CACHE_TTL_MS) {
    return cachedUiText;
  }

  const configPath = resolve(process.cwd(), "config", "chat-settings.yaml");
  const raw = await readFile(configPath, "utf-8");
  const config = parse(raw) as {
    chat?: {
      title?: string;
      subtitle?: string;
      disclaimer?: string;
      inputPlaceholder?: string;
      loadingText?: string;
      stillThinkingText?: string;
      welcomeTitle?: string;
      welcomeSubtitle?: string;
      welcomeCards?: WelcomeCard[];
    };
  };

  const chat = config.chat || {};

  cachedUiText = {
    title: chat.title || "Event Assistant",
    subtitle: chat.subtitle || "",
    disclaimer: chat.disclaimer || "AI may be inaccurate.",
    inputPlaceholder: chat.inputPlaceholder || "Ask about this event.",
    loadingText: chat.loadingText || "AI is thinking.",
    stillThinkingText: chat.stillThinkingText || "Gathering results...",
    welcomeTitle: chat.welcomeTitle || "Explore the Event",
    welcomeSubtitle: chat.welcomeSubtitle || "",
    welcomeCards: chat.welcomeCards || [],
  };
  cachedAt = now;

  return cachedUiText;
}
