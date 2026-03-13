/**
 * NetworkPanel — Request/response log with timing, status codes,
 * and expandable details.
 */
import { useState } from "react";
import {
  makeStyles,
  tokens,
  Text,
  Badge,
  Button,
} from "@fluentui/react-components";
import { DeleteRegular } from "@fluentui/react-icons";
import { JsonView } from "./JsonView.js";
import { EventBadge } from "./EventBadge.js";
import { useDevToolsStore } from "~/store/useDevToolsStore.js";
import type { RequestLogEntry, DevToolsEvent } from "~/store/devtools-store.js";

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
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
  table: {
    flexGrow: 1,
    overflowY: "auto",
  },
  headerRow: {
    display: "flex",
    gap: "8px",
    paddingTop: "6px",
    paddingBottom: "6px",
    paddingLeft: "8px",
    paddingRight: "8px",
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    backgroundColor: tokens.colorNeutralBackground3,
    position: "sticky" as const,
    top: 0,
    zIndex: 1,
  },
  headerCell: {
    fontSize: tokens.fontSizeBase100,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground3,
    textTransform: "uppercase",
  },
  row: {
    display: "flex",
    gap: "8px",
    paddingTop: "6px",
    paddingBottom: "6px",
    paddingLeft: "8px",
    paddingRight: "8px",
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    cursor: "pointer",
    ":hover": {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  rowSelected: {
    display: "flex",
    gap: "8px",
    paddingTop: "6px",
    paddingBottom: "6px",
    paddingLeft: "8px",
    paddingRight: "8px",
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    cursor: "pointer",
    backgroundColor: tokens.colorNeutralBackground1Selected,
  },
  cell: {
    fontSize: tokens.fontSizeBase200,
    fontFamily: "monospace",
  },
  detail: {
    paddingTop: "8px",
    paddingBottom: "8px",
    paddingLeft: "16px",
    paddingRight: "16px",
    backgroundColor: tokens.colorNeutralBackground3,
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  detailSection: {
    marginBottom: "8px",
  },
  empty: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    color: tokens.colorNeutralForeground4,
  },
  waterfall: {
    height: "6px",
    borderRadius: "3px",
    backgroundColor: tokens.colorPaletteBlueBorderActive,
    minWidth: "4px",
  },
});

function StatusBadge({ status }: { status?: number }) {
  if (!status) return <Badge size="tiny" appearance="outline">...</Badge>;
  const color =
    status < 300 ? "success" : status < 500 ? "warning" : "danger";
  return (
    <Badge size="tiny" appearance="filled" color={color}>
      {status}
    </Badge>
  );
}

export function NetworkPanel() {
  const styles = useStyles();
  const { requests, clearRequests } = useDevToolsStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Compute max duration for waterfall scaling
  const maxDuration = Math.max(
    ...requests.map((r) => r.durationMs || 0),
    100,
  );

  return (
    <div className={styles.root}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <Text size={200} weight="semibold">
          Network
        </Text>
        <Button
          size="small"
          appearance="subtle"
          icon={<DeleteRegular />}
          onClick={clearRequests}
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
          {requests.length} requests
        </Text>
      </div>

      {/* Table */}
      <div className={`${styles.table} devtools-scrollable`}>
        {/* Header */}
        <div className={styles.headerRow}>
          <Text className={styles.headerCell} style={{ width: "50px" }}>
            Status
          </Text>
          <Text className={styles.headerCell} style={{ width: "100px" }}>
            Channel
          </Text>
          <Text className={styles.headerCell} style={{ width: "60px" }}>
            Events
          </Text>
          <Text className={styles.headerCell} style={{ width: "70px" }}>
            Time
          </Text>
          <Text className={styles.headerCell} style={{ flexGrow: 1 }}>
            Waterfall
          </Text>
        </div>

        {requests.length === 0 ? (
          <div className={styles.empty}>
            <Text size={200}>No requests recorded</Text>
          </div>
        ) : (
          requests.map((r: RequestLogEntry) => {
            const isExpanded = expandedId === r.id;

            return (
              <div key={r.id}>
                <div
                  className={isExpanded ? styles.rowSelected : styles.row}
                  onClick={() => setExpandedId(isExpanded ? null : r.id)}
                >
                  <div style={{ width: "50px" }}>
                    <StatusBadge status={r.status} />
                  </div>
                  <Text className={styles.cell} style={{ width: "100px" }}>
                    {r.channel}
                  </Text>
                  <Text className={styles.cell} style={{ width: "60px" }}>
                    {r.events.length}
                  </Text>
                  <Text className={styles.cell} style={{ width: "70px" }}>
                    {r.durationMs ? `${r.durationMs}ms` : "..."}
                  </Text>
                  <div
                    style={{
                      flexGrow: 1,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <div
                      className={styles.waterfall}
                      style={{
                        width: `${Math.max(((r.durationMs || 0) / maxDuration) * 100, 2)}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className={styles.detail}>
                    <div className={styles.detailSection}>
                      <Text size={200} weight="semibold">
                        Request Body
                      </Text>
                      <JsonView data={r.request} defaultExpanded={false} />
                    </div>

                    {r.response && (
                      <div className={styles.detailSection}>
                        <Text size={200} weight="semibold">
                          Response
                        </Text>
                        <JsonView data={r.response} defaultExpanded={false} />
                      </div>
                    )}

                    {r.headers && (
                      <div className={styles.detailSection}>
                        <Text size={200} weight="semibold">
                          Headers
                        </Text>
                        <JsonView data={r.headers} defaultExpanded={false} />
                      </div>
                    )}

                    {r.events.length > 0 && (
                      <div className={styles.detailSection}>
                        <Text size={200} weight="semibold">
                          SSE Events ({r.events.length})
                        </Text>
                        <div style={{ marginTop: "4px" }}>
                          {r.events.slice(0, 50).map((e: DevToolsEvent) => (
                            <div
                              key={e.id}
                              style={{
                                display: "flex",
                                gap: "6px",
                                alignItems: "center",
                                paddingTop: "2px",
                                paddingBottom: "2px",
                              }}
                            >
                              <Text
                                style={{
                                  fontFamily: "monospace",
                                  fontSize: "11px",
                                  color: tokens.colorNeutralForeground4,
                                  minWidth: "50px",
                                }}
                              >
                                +{e.elapsed}ms
                              </Text>
                              <EventBadge
                                type={
                                  (e.event as Record<string, unknown>)
                                    .type as string
                                }
                              />
                            </div>
                          ))}
                          {r.events.length > 50 && (
                            <Text
                              size={100}
                              style={{
                                color: tokens.colorNeutralForeground4,
                              }}
                            >
                              ... and {r.events.length - 50} more
                            </Text>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
