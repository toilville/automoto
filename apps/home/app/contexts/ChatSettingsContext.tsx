import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import type { ChatSettings, PageContext } from "~/models/types";

interface ChatSettingsContextValue {
  settings: ChatSettings;
  updateSettings: (updates: Partial<ChatSettings>) => void;
  setPageContext: (ctx: PageContext | undefined) => void;
}

const defaultSettings: ChatSettings = {
  enableAI: true,
  theme: "light",
  chatContrast: "default",
  chatSpacing: "default",
};

const ChatSettingsContext = createContext<ChatSettingsContextValue | null>(null);

export function ChatSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ChatSettings>(() => {
    if (typeof window === "undefined") return defaultSettings;
    try {
      const stored = localStorage.getItem("chatSettings");
      return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });

  const updateSettings = useCallback((updates: Partial<ChatSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem("chatSettings", JSON.stringify(next));
      } catch { /* ignore */ }
      return next;
    });
  }, []);

  const setPageContext = useCallback((ctx: PageContext | undefined) => {
    updateSettings({ currentPageContext: ctx });
  }, [updateSettings]);

  return (
    <ChatSettingsContext.Provider value={{ settings, updateSettings, setPageContext }}>
      {children}
    </ChatSettingsContext.Provider>
  );
}

export function useChatSettings(): ChatSettingsContextValue {
  const ctx = useContext(ChatSettingsContext);
  if (!ctx) throw new Error("useChatSettings must be used within ChatSettingsProvider");
  return ctx;
}
