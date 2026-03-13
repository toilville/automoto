/**
 * ChatMessage — Renders a single user or assistant message.
 * Handles markdown rendering for assistant messages.
 */
import { makeStyles, tokens, mergeClasses } from "@fluentui/react-components";
import { PersonRegular, BotRegular } from "@fluentui/react-icons";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ChatMessage as ChatMessageType } from "~/models/types";

const useStyles = makeStyles({
  container: {
    display: "flex",
    gap: "12px",
    padding: "12px 16px",
    maxWidth: "100%",
  },
  userContainer: {
    flexDirection: "row-reverse",
  },
  avatar: {
    flexShrink: 0,
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
  },
  userAvatar: {
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
  },
  assistantAvatar: {
    backgroundColor: tokens.colorNeutralBackground3,
    color: tokens.colorNeutralForeground2,
  },
  bubble: {
    maxWidth: "75%",
    padding: "10px 14px",
    borderRadius: "12px",
    lineHeight: "1.5",
    fontSize: tokens.fontSizeBase300,
    overflowWrap: "break-word",
    "& p": { margin: "0 0 8px 0" },
    "& p:last-child": { marginBottom: 0 },
    "& code": {
      backgroundColor: tokens.colorNeutralBackground3,
      padding: "2px 4px",
      borderRadius: "4px",
      fontSize: tokens.fontSizeBase200,
    },
    "& pre": {
      backgroundColor: tokens.colorNeutralBackground3,
      padding: "12px",
      borderRadius: "8px",
      overflowX: "auto",
    },
    "& ul, & ol": { paddingLeft: "20px", margin: "4px 0" },
  },
  userBubble: {
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorNeutralForeground1,
    borderBottomRightRadius: "4px",
  },
  assistantBubble: {
    backgroundColor: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground1,
    borderBottomLeftRadius: "4px",
    boxShadow: tokens.shadow2,
  },
  errorBubble: {
    backgroundColor: tokens.colorPaletteRedBackground1,
    color: tokens.colorPaletteRedForeground1,
  },
  sources: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
    marginTop: "6px",
    fontStyle: "italic",
  },
});

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const styles = useStyles();
  const isUser = message.role === "user";
  const isError = message.refusal && message.refusalReason === "error";

  return (
    <div className={mergeClasses(styles.container, isUser && styles.userContainer)}>
      <div className={mergeClasses(
        styles.avatar,
        isUser ? styles.userAvatar : styles.assistantAvatar,
      )}>
        {isUser ? <PersonRegular /> : <BotRegular />}
      </div>
      <div className={mergeClasses(
        styles.bubble,
        isUser ? styles.userBubble : styles.assistantBubble,
        isError && styles.errorBubble,
      )}>
        {isUser ? (
          <p>{message.content}</p>
        ) : (
          <Markdown remarkPlugins={[remarkGfm]}>
            {message.content}
          </Markdown>
        )}
        {message.ragSources && message.ragSources.length > 0 && (
          <div className={styles.sources}>
            Sources: {message.ragSources.join(", ")}
          </div>
        )}
      </div>
    </div>
  );
}
