/**
 * EventsPanel — Real-time MSRStreamEvent timeline with color-coded badges,
 * expandable JSON payloads, and filtering.
 */
import { useState, useRef, useEffect } from "react";
import {
  makeStyles,
  tokens,
  Text,
  Input,
  Button,
  Dropdown,
  Option,
} from "@fluentui/react-components";
import {
  FilterRegular,
  DeleteRegular,
  ArrowDownRegular,
} from "@fluentui/react-icons";
import { EventBadge } from "./EventBadge.js";
import { JsonView } from "./JsonView.js";
import { useDevToolsStore } from "~/store/useDevToolsStore.js";
import type { DevToolsEvent } from "~/store/devtools-store.js";

const EVENT_TYPES = [
  "text_delta",
  "chunk",
  "card",
  "cards",
  "reference",
  "references",
  "tool_start",
  "tool_end",
  "usage",
  "suggested_actions",
  "done",
  "error",
];

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
    flexWrap: "wrap",
  },
  list: {
    flexGrow: 1,
    overflowY: "auto",
  },
  row: {
    display: "flex",
    alignItems: "flex-start",
    gap: "8px",
    paddingTop: "4px",
    paddingBottom: "4px",
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
    alignItems: "flex-start",
    gap: "8px",
    paddingTop: "4px",
    paddingBottom: "4px",
    paddingLeft: "8px",
    paddingRight: "8px",
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    cursor: "pointer",
    backgroundColor: tokens.colorNeutralBackground1Selected,
  },
  elapsed: {
    fontFamily: "monospace",
    fontSize: "11px",
    color: tokens.colorNeutralForeground4,
    minWidth: "60px",
    textAlign: "right" as const,
  },
  preview: {
    fontSize: "11px",
    color: tokens.colorNeutralForeground2,
    fontFamily: "monospace",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    flexGrow: 1,
    maxWidth: "400px",
  },
  detail: {
    paddingTop: "8px",
    paddingBottom: "8px",
    paddingLeft: "8px",
    paddingRight: "8px",
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    backgroundColor: tokens.colorNeutralBackground3,
  },
  empty: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    color: tokens.colorNeutralForeground4,
  },
  count: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground4,
    marginLeft: "auto",
  },
});

function getEventPreview(event: Record<string, unknown>): string {
  const type = event.type as string;
  switch (type) {
    case "text_delta":
      return `"${((event.delta as string) || "").slice(0, 80)}"`;
    case "chunk":
      return `"${((event.chunk as string) || "").slice(0, 80)}"`;
    case "card":
      return `${(event.card as Record<string, unknown>)?.kind || "card"}: ${(event.card as Record<string, unknown>)?.title || ""}`;
    case "tool_start":
    case "tool_end":
      return event.toolName as string;
    case "error":
      return event.message as string;
    case "done":
      return `reason: ${event.finishReason}`;
    case "usage": {
      const u = event.usage as Record<string, unknown>;
      return `${u?.totalTokens || "?"} tokens`;
    }
    default:
      return JSON.stringify(event).slice(0, 80);
  }
}

export function EventsPanel() {
  const styles = useStyles();
  const {
    events,
    selectedEventId,
    setSelectedEventId,
    clearEvents,
    filters,
    setFilters,
    settings,
  } = useDevToolsStore();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    if (settings.autoScroll && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [events.length, settings.autoScroll]);

  // Filter events
  const filtered = events.filter((e) => {
    const eventType = (e.event as Record<string, unknown>).type as string;
    if (
      filters.eventTypes.length > 0 &&
      !filters.eventTypes.includes(eventType)
    ) {
      return false;
    }
    if (filters.searchQuery) {
      const json = JSON.stringify(e.event).toLowerCase();
      if (!json.includes(filters.searchQuery.toLowerCase())) return false;
    }
    return true;
  });

  return (
    <div className={styles.root}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <FilterRegular />
        <Input
          size="small"
          placeholder="Search events..."
          value={filters.searchQuery}
          onChange={(_, d) => setFilters({ searchQuery: d.value })}
          style={{ width: "160px" }}
        />
        <Dropdown
          size="small"
          placeholder="Filter type..."
          multiselect
          selectedOptions={filters.eventTypes}
          onOptionSelect={(_, d) =>
            setFilters({ eventTypes: d.selectedOptions })
          }
          style={{ minWidth: "140px" }}
        >
          {EVENT_TYPES.map((t) => (
            <Option key={t} value={t}>
              {t}
            </Option>
          ))}
        </Dropdown>
        <Button
          size="small"
          appearance="subtle"
          icon={<DeleteRegular />}
          onClick={clearEvents}
        >
          Clear
        </Button>
        <Text className={styles.count}>{filtered.length} events</Text>
      </div>

      {/* Event list */}
      <div className={`${styles.list} devtools-scrollable`} ref={listRef}>
        {filtered.length === 0 ? (
          <div className={styles.empty}>
            <Text size={200}>
              No events yet. Send a message to see the stream.
            </Text>
          </div>
        ) : (
          filtered.map((e: DevToolsEvent) => {
            const eventType = (e.event as Record<string, unknown>)
              .type as string;
            const isExpanded = expandedId === e.id;

            return (
              <div key={e.id}>
                <div
                  className={
                    selectedEventId === e.id ? styles.rowSelected : styles.row
                  }
                  onClick={() => {
                    setSelectedEventId(e.id);
                    setExpandedId(isExpanded ? null : e.id);
                  }}
                >
                  <Text className={styles.elapsed}>{e.elapsed}ms</Text>
                  <EventBadge type={eventType} />
                  <Text className={styles.preview}>
                    {getEventPreview(e.event as Record<string, unknown>)}
                  </Text>
                </div>
                {isExpanded && (
                  <div className={styles.detail}>
                    <JsonView data={e.event} />
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
