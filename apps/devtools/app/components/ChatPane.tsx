/**
 * ChatPane — Minimal chat interface for sending messages through
 * the selected channel. Intercepts all events for devtools inspection.
 */
import { useState, useRef, useEffect, useCallback } from "react";
import {
  makeStyles,
  tokens,
  Text,
  Input,
  Button,
  Spinner,
  Badge,
} from "@fluentui/react-components";
import {
  SendRegular,
  DismissRegular,
  StopRegular,
} from "@fluentui/react-icons";
import { useDevToolsStore } from "~/store/useDevToolsStore.js";
import { useDevToolsChat } from "~/hooks/useDevToolsChat.js";

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    backgroundColor: tokens.colorNeutralBackground2,
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: "8px",
    paddingBottom: "8px",
    paddingLeft: "12px",
    paddingRight: "12px",
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    backgroundColor: tokens.colorNeutralBackground1,
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  messages: {
    flexGrow: 1,
    overflowY: "auto",
    paddingTop: "8px",
    paddingBottom: "8px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  userMsg: {
    alignSelf: "flex-end",
    maxWidth: "80%",
    paddingTop: "8px",
    paddingBottom: "8px",
    paddingLeft: "12px",
    paddingRight: "12px",
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
    borderRadius: tokens.borderRadiusMedium,
    fontSize: tokens.fontSizeBase200,
    whiteSpace: "pre-wrap",
    marginLeft: "12px",
    marginRight: "12px",
  },
  assistantMsg: {
    alignSelf: "flex-start",
    maxWidth: "80%",
    paddingTop: "8px",
    paddingBottom: "8px",
    paddingLeft: "12px",
    paddingRight: "12px",
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusMedium,
    fontSize: tokens.fontSizeBase200,
    whiteSpace: "pre-wrap",
    marginLeft: "12px",
    marginRight: "12px",
    border: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  inputArea: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    paddingTop: "8px",
    paddingBottom: "8px",
    paddingLeft: "12px",
    paddingRight: "12px",
    borderTop: `1px solid ${tokens.colorNeutralStroke1}`,
    backgroundColor: tokens.colorNeutralBackground1,
  },
  errorBanner: {
    paddingTop: "4px",
    paddingBottom: "4px",
    paddingLeft: "12px",
    paddingRight: "12px",
    backgroundColor: tokens.colorPaletteRedBackground1,
    color: tokens.colorPaletteRedForeground1,
    fontSize: tokens.fontSizeBase100,
  },
});

export function ChatPane() {
  const styles = useStyles();
  const { selectedChannel, settings } = useDevToolsStore();
  const { messages, isLoading, error, sendMessage, clearMessages, abort } =
    useDevToolsChat(selectedChannel);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(() => {
    if (!input.trim() || isLoading) return;
    sendMessage(input);
    setInput("");
  }, [input, isLoading, sendMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  return (
    <div className={styles.root}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Text weight="semibold" size={200}>
            Chat
          </Text>
          <Badge size="small" appearance="outline" color="informative">
            {selectedChannel}
          </Badge>
        </div>
        <div style={{ display: "flex", gap: "4px" }}>
          {isLoading && (
            <Button
              size="small"
              appearance="subtle"
              icon={<StopRegular />}
              onClick={abort}
            >
              Stop
            </Button>
          )}
          <Button
            size="small"
            appearance="subtle"
            icon={<DismissRegular />}
            onClick={clearMessages}
          >
            Clear
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && <div className={styles.errorBanner}>{error}</div>}

      {/* Messages */}
      <div className={`${styles.messages} devtools-scrollable`}>
        {messages.length === 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: tokens.colorNeutralForeground4,
            }}
          >
            <Text size={200}>
              Send a message to test the <strong>{selectedChannel}</strong>{" "}
              channel
            </Text>
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={
              msg.role === "user" ? styles.userMsg : styles.assistantMsg
            }
          >
            {msg.content || (
              <Spinner size="tiny" label="Thinking..." labelPosition="after" />
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className={styles.inputArea}>
        <Input
          style={{ flexGrow: 1 }}
          size="medium"
          placeholder={`Message ${selectedChannel} channel...`}
          value={input}
          onChange={(_, data) => setInput(data.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
        />
        <Button
          appearance="primary"
          icon={<SendRegular />}
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
        />
      </div>
    </div>
  );
}
