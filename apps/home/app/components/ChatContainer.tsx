/**
 * ChatContainer — Main chat layout for the Automoto home experience.
 * Composes ChatWelcome, ChatMessage, ChatInput, and TypingIndicator.
 */
import { useCallback } from "react";
import { makeStyles, tokens, Text, Button } from "@fluentui/react-components";
import { DismissRegular } from "@fluentui/react-icons";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { ChatWelcome } from "./ChatWelcome";
import { TypingIndicator } from "./TypingIndicator";
import { useAutoScroll } from "~/hooks/useAutoScroll";
import { useChatService } from "~/hooks/useChatService";
import type { ChatUiText } from "~/models/types";

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    maxWidth: "800px",
    margin: "0 auto",
    backgroundColor: tokens.colorNeutralBackground2,
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 16px",
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    backgroundColor: tokens.colorNeutralBackground1,
  },
  headerTitle: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
  },
  messages: {
    flexGrow: 1,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
  },
  disclaimer: {
    textAlign: "center" as const,
    padding: "8px 16px",
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
  },
  errorBanner: {
    padding: "8px 16px",
    backgroundColor: tokens.colorPaletteRedBackground1,
    color: tokens.colorPaletteRedForeground1,
    fontSize: tokens.fontSizeBase200,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
});

interface ChatContainerProps {
  uiText?: ChatUiText;
}

export function ChatContainer({ uiText }: ChatContainerProps) {
  const styles = useStyles();
  const { messages, isLoading, error, sendMessage, clearMessages } = useChatService();
  const { containerRef, handleScroll } = useAutoScroll([messages, isLoading]);

  const handleWelcomeAction = useCallback(
    (payload: string) => {
      sendMessage(payload, { type: "fastPath", payload });
    },
    [sendMessage],
  );

  const handleSend = useCallback(
    (message: string) => {
      sendMessage(message);
    },
    [sendMessage],
  );

  const hasMessages = messages.length > 0;

  return (
    <div className={styles.root}>
      {/* Header */}
      <div className={styles.header}>
        <Text className={styles.headerTitle}>
          {uiText?.title || "Automoto Assistant"}
        </Text>
        {hasMessages && (
          <Button
            size="small"
            appearance="subtle"
            icon={<DismissRegular />}
            onClick={clearMessages}
            aria-label="New conversation"
          >
            New chat
          </Button>
        )}
      </div>

      {/* Error banner */}
      {error && (
        <div className={styles.errorBanner}>
          <span>{error}</span>
        </div>
      )}

      {/* Messages area */}
      <div
        className={styles.messages}
        ref={containerRef}
        onScroll={handleScroll}
      >
        {!hasMessages ? (
          <ChatWelcome
            title={uiText?.welcomeTitle}
            subtitle={uiText?.welcomeSubtitle}
            cards={uiText?.welcomeCards}
            onAction={handleWelcomeAction}
          />
        ) : (
          <>
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            {isLoading && (
              <TypingIndicator label={uiText?.loadingText || "AI is thinking"} />
            )}
          </>
        )}
      </div>

      {/* Disclaimer */}
      <div className={styles.disclaimer}>
        {uiText?.disclaimer || "AI-generated responses may contain inaccuracies. Please verify important details."}
      </div>

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        disabled={isLoading}
        placeholder={uiText?.inputPlaceholder}
      />
    </div>
  );
}
