/**
 * ConsolePanel — Live log viewer for gateway and adapter events.
 * Color-coded by level (info/warn/error/debug).
 */
import { useRef, useEffect } from "react";
import {
  makeStyles,
  tokens,
  Text,
  Button,
  Input,
} from "@fluentui/react-components";
import { DeleteRegular, FilterRegular } from "@fluentui/react-icons";
import { useDevToolsStore } from "~/store/useDevToolsStore.js";
import { useState } from "react";
import type { ConsoleEntry } from "~/store/devtools-store.js";

const LEVEL_STYLES: Record<string, { color: string; icon: string }> = {
  info: { color: tokens.colorNeutralForeground2, icon: "ℹ" },
  warn: { color: tokens.colorPaletteMarigoldForeground1, icon: "⚠" },
  error: { color: tokens.colorPaletteRedForeground1, icon: "✗" },
  debug: { color: tokens.colorNeutralForeground4, icon: "⋯" },
};

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    backgroundColor: tokens.colorNeutralBackground3,
  },
  toolbar: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    paddingTop: "6px",
    paddingBottom: "6px",
    paddingLeft: "8px",
    paddingRight: "8px",
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    backgroundColor: tokens.colorNeutralBackground1,
  },
  log: {
    flexGrow: 1,
    overflowY: "auto",
    fontFamily: "Consolas, 'Courier New', monospace",
    fontSize: "12px",
    lineHeight: "20px",
  },
  entry: {
    display: "flex",
    gap: "8px",
    paddingTop: "1px",
    paddingBottom: "1px",
    paddingLeft: "8px",
    paddingRight: "8px",
    borderBottom: `1px solid ${tokens.colorNeutralStroke3}`,
    ":hover": {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  timestamp: {
    color: tokens.colorNeutralForeground4,
    minWidth: "80px",
    flexShrink: 0,
  },
  source: {
    color: tokens.colorPalettePurpleForeground1,
    minWidth: "60px",
    flexShrink: 0,
  },
  message: {
    flexGrow: 1,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  empty: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    color: tokens.colorNeutralForeground4,
  },
});

export function ConsolePanel() {
  const styles = useStyles();
  const { consoleEntries, clearConsole, settings } = useDevToolsStore();
  const [filter, setFilter] = useState("");
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (settings.autoScroll && logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [consoleEntries.length, settings.autoScroll]);

  const filtered = consoleEntries.filter((e) => {
    if (!filter) return true;
    const lf = filter.toLowerCase();
    return (
      e.message.toLowerCase().includes(lf) ||
      e.source.toLowerCase().includes(lf) ||
      e.level.includes(lf)
    );
  });

  return (
    <div className={styles.root}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <FilterRegular />
        <Input
          size="small"
          placeholder="Filter logs..."
          value={filter}
          onChange={(_, d) => setFilter(d.value)}
          style={{ width: "200px" }}
        />
        <Button
          size="small"
          appearance="subtle"
          icon={<DeleteRegular />}
          onClick={clearConsole}
        >
          Clear
        </Button>
        <Text
          style={{
            marginLeft: "auto",
            fontSize: tokens.fontSizeBase100,
            color: tokens.colorNeutralForeground4,
          }}
        >
          {filtered.length} entries
        </Text>
      </div>

      {/* Log */}
      <div className={`${styles.log} devtools-scrollable`} ref={logRef}>
        {filtered.length === 0 ? (
          <div className={styles.empty}>
            <Text size={200}>Console is empty</Text>
          </div>
        ) : (
          filtered.map((entry: ConsoleEntry) => {
            const levelStyle = LEVEL_STYLES[entry.level] || LEVEL_STYLES.info;
            const time = new Date(entry.timestamp).toLocaleTimeString(
              "en-US",
              { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" },
            );

            return (
              <div key={entry.id} className={styles.entry}>
                {settings.showTimestamps && (
                  <span className={styles.timestamp}>{time}</span>
                )}
                <span style={{ minWidth: "16px" }}>{levelStyle.icon}</span>
                <span className={styles.source}>[{entry.source}]</span>
                <span
                  className={styles.message}
                  style={{ color: levelStyle.color }}
                >
                  {entry.message}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
