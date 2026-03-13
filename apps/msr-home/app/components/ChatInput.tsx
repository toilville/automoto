/**
 * ChatInput — Message input with send button.
 */
import { useState, useCallback, type KeyboardEvent } from "react";
import {
  makeStyles,
  tokens,
  Textarea,
  Button,
} from "@fluentui/react-components";
import { SendRegular } from "@fluentui/react-icons";

const useStyles = makeStyles({
  container: {
    display: "flex",
    alignItems: "flex-end",
    gap: "8px",
    padding: "12px 16px",
    borderTop: `1px solid ${tokens.colorNeutralStroke1}`,
    backgroundColor: tokens.colorNeutralBackground1,
  },
  textarea: {
    flexGrow: 1,
    "& textarea": {
      maxHeight: "120px",
    },
  },
  sendButton: {
    minWidth: "40px",
    height: "40px",
  },
  charCount: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
    textAlign: "right" as const,
    paddingRight: "4px",
  },
  charCountOver: {
    color: tokens.colorPaletteRedForeground1,
  },
});

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
}

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = "Ask about Microsoft Research...",
  maxLength = 2000,
}: ChatInputProps) {
  const styles = useStyles();
  const [value, setValue] = useState("");

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || trimmed.length > maxLength) return;
    onSend(trimmed);
    setValue("");
  }, [value, maxLength, onSend]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const isOverLimit = value.length > maxLength;

  return (
    <div className={styles.container}>
      <div style={{ flexGrow: 1 }}>
        <Textarea
          className={styles.textarea}
          value={value}
          onChange={(_e, data) => setValue(data.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          resize="vertical"
          aria-label="Chat message input"
        />
        {value.length > maxLength * 0.8 && (
          <div className={`${styles.charCount} ${isOverLimit ? styles.charCountOver : ""}`}>
            {value.length}/{maxLength}
          </div>
        )}
      </div>
      <Button
        className={styles.sendButton}
        icon={<SendRegular />}
        appearance="primary"
        onClick={handleSend}
        disabled={disabled || !value.trim() || isOverLimit}
        aria-label="Send message"
      />
    </div>
  );
}
