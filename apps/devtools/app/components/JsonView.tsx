/**
 * JsonView — Simple collapsible JSON tree viewer.
 * Built with Fluent UI primitives (no external dependency).
 */
import { useState } from "react";
import { makeStyles, tokens, Text } from "@fluentui/react-components";
import {
  ChevronRightRegular,
  ChevronDownRegular,
} from "@fluentui/react-icons";

const useStyles = makeStyles({
  root: {
    fontFamily: "Consolas, 'Courier New', monospace",
    fontSize: "12px",
    lineHeight: "18px",
  },
  row: {
    display: "flex",
    alignItems: "flex-start",
    gap: "4px",
    cursor: "default",
    ":hover": {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  clickable: {
    cursor: "pointer",
  },
  key: {
    color: tokens.colorPalettePurpleForeground1,
  },
  string: {
    color: tokens.colorPaletteGreenForeground1,
  },
  number: {
    color: tokens.colorPaletteBlueForeground2,
  },
  boolean: {
    color: tokens.colorPaletteMarigoldForeground1,
  },
  null: {
    color: tokens.colorNeutralForeground4,
    fontStyle: "italic",
  },
  bracket: {
    color: tokens.colorNeutralForeground3,
  },
  chevron: {
    width: "14px",
    height: "14px",
    flexShrink: 0,
    marginTop: "2px",
  },
  indent: {
    paddingLeft: "16px",
  },
});

interface JsonNodeProps {
  keyName?: string;
  value: unknown;
  defaultExpanded?: boolean;
}

function JsonNode({ keyName, value, defaultExpanded = true }: JsonNodeProps) {
  const styles = useStyles();
  const [expanded, setExpanded] = useState(defaultExpanded);

  if (value === null || value === undefined) {
    return (
      <div className={styles.row}>
        {keyName && (
          <>
            <span className={styles.key}>"{keyName}"</span>
            <span>: </span>
          </>
        )}
        <span className={styles.null}>{String(value)}</span>
      </div>
    );
  }

  if (typeof value === "string") {
    const truncated = value.length > 200 ? value.slice(0, 200) + "…" : value;
    return (
      <div className={styles.row}>
        {keyName && (
          <>
            <span className={styles.key}>"{keyName}"</span>
            <span>: </span>
          </>
        )}
        <span className={styles.string}>"{truncated}"</span>
      </div>
    );
  }

  if (typeof value === "number") {
    return (
      <div className={styles.row}>
        {keyName && (
          <>
            <span className={styles.key}>"{keyName}"</span>
            <span>: </span>
          </>
        )}
        <span className={styles.number}>{value}</span>
      </div>
    );
  }

  if (typeof value === "boolean") {
    return (
      <div className={styles.row}>
        {keyName && (
          <>
            <span className={styles.key}>"{keyName}"</span>
            <span>: </span>
          </>
        )}
        <span className={styles.boolean}>{String(value)}</span>
      </div>
    );
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return (
        <div className={styles.row}>
          {keyName && (
            <>
              <span className={styles.key}>"{keyName}"</span>
              <span>: </span>
            </>
          )}
          <span className={styles.bracket}>[]</span>
        </div>
      );
    }

    return (
      <div>
        <div
          className={`${styles.row} ${styles.clickable}`}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <ChevronDownRegular className={styles.chevron} />
          ) : (
            <ChevronRightRegular className={styles.chevron} />
          )}
          {keyName && (
            <>
              <span className={styles.key}>"{keyName}"</span>
              <span>: </span>
            </>
          )}
          <span className={styles.bracket}>
            {expanded ? "[" : `[${value.length} items]`}
          </span>
        </div>
        {expanded && (
          <div className={styles.indent}>
            {value.map((item, i) => (
              <JsonNode key={i} keyName={String(i)} value={item} defaultExpanded={false} />
            ))}
            <div className={styles.row}>
              <span className={styles.bracket}>]</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) {
      return (
        <div className={styles.row}>
          {keyName && (
            <>
              <span className={styles.key}>"{keyName}"</span>
              <span>: </span>
            </>
          )}
          <span className={styles.bracket}>{"{}"}</span>
        </div>
      );
    }

    return (
      <div>
        <div
          className={`${styles.row} ${styles.clickable}`}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <ChevronDownRegular className={styles.chevron} />
          ) : (
            <ChevronRightRegular className={styles.chevron} />
          )}
          {keyName && (
            <>
              <span className={styles.key}>"{keyName}"</span>
              <span>: </span>
            </>
          )}
          <span className={styles.bracket}>
            {expanded ? "{" : `{${entries.length} keys}`}
          </span>
        </div>
        {expanded && (
          <div className={styles.indent}>
            {entries.map(([k, v]) => (
              <JsonNode key={k} keyName={k} value={v} defaultExpanded={false} />
            ))}
            <div className={styles.row}>
              <span className={styles.bracket}>{"}"}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={styles.row}>
      <span>{String(value)}</span>
    </div>
  );
}

export interface JsonViewProps {
  data: unknown;
  defaultExpanded?: boolean;
}

export function JsonView({ data, defaultExpanded = true }: JsonViewProps) {
  const styles = useStyles();
  return (
    <div className={styles.root}>
      <JsonNode value={data} defaultExpanded={defaultExpanded} />
    </div>
  );
}
