/**
 * EventBadge — Color-coded badge for StreamEvent types.
 */
import { Badge, tokens } from "@fluentui/react-components";

const EVENT_COLORS: Record<string, { bg: string; fg: string; label: string }> = {
  text_delta: { bg: tokens.colorPaletteBlueBorderActive, fg: "#fff", label: "TEXT" },
  chunk: { bg: tokens.colorPaletteBlueBorderActive, fg: "#fff", label: "TEXT" },
  card: { bg: tokens.colorPaletteGreenBorderActive, fg: "#fff", label: "CARD" },
  reference: { bg: tokens.colorPaletteTealBorderActive, fg: "#fff", label: "REF" },
  tool_start: { bg: tokens.colorPaletteMarigoldBorderActive, fg: "#000", label: "TOOL▶" },
  tool_end: { bg: tokens.colorPaletteMarigoldBorderActive, fg: "#000", label: "TOOL■" },
  usage: { bg: tokens.colorNeutralForeground4, fg: "#fff", label: "USAGE" },
  suggested_actions: { bg: tokens.colorPalettePurpleBorderActive, fg: "#fff", label: "ACTIONS" },
  done: { bg: tokens.colorNeutralForeground2, fg: "#fff", label: "DONE" },
  error: { bg: tokens.colorPaletteRedBorderActive, fg: "#fff", label: "ERROR" },
  references: { bg: tokens.colorPaletteTealBorderActive, fg: "#fff", label: "REFS" },
  cards: { bg: tokens.colorPaletteGreenBorderActive, fg: "#fff", label: "CARDS" },
};

export interface EventBadgeProps {
  type: string;
}

export function EventBadge({ type }: EventBadgeProps) {
  const config = EVENT_COLORS[type] || {
    bg: tokens.colorNeutralForeground4,
    fg: "#fff",
    label: type.toUpperCase(),
  };

  return (
    <Badge
      size="small"
      appearance="filled"
      style={{
        backgroundColor: config.bg,
        color: config.fg,
        fontFamily: "monospace",
        fontSize: "10px",
        minWidth: "48px",
        textAlign: "center",
      }}
    >
      {config.label}
    </Badge>
  );
}
