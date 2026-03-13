/**
 * ChannelSelector — Sidebar listing all 14 channels with streaming badges.
 */
import {
  makeStyles,
  tokens,
  Text,
  Badge,
  Button,
  Tooltip,
} from "@fluentui/react-components";
import {
  PlugConnectedRegular,
  LiveRegular,
} from "@fluentui/react-icons";
import { useDevToolsStore } from "~/store/useDevToolsStore.js";
import { getDevToolsState } from "~/store/devtools-store.js";
import type { AdapterInfo } from "~/store/devtools-store.js";

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    backgroundColor: tokens.colorNeutralBackground3,
    borderRight: `1px solid ${tokens.colorNeutralStroke1}`,
    overflowY: "auto",
  },
  header: {
    paddingTop: "12px",
    paddingBottom: "12px",
    paddingLeft: "12px",
    paddingRight: "12px",
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  title: {
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground3,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  list: {
    display: "flex",
    flexDirection: "column",
    paddingTop: "4px",
    paddingBottom: "4px",
  },
  item: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    paddingTop: "6px",
    paddingBottom: "6px",
    paddingLeft: "12px",
    paddingRight: "12px",
    cursor: "pointer",
    borderLeft: "3px solid transparent",
    ":hover": {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  itemSelected: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    paddingTop: "6px",
    paddingBottom: "6px",
    paddingLeft: "12px",
    paddingRight: "12px",
    cursor: "pointer",
    backgroundColor: tokens.colorNeutralBackground1Selected,
    borderLeft: `3px solid ${tokens.colorBrandBackground}`,
  },
  channelName: {
    fontSize: tokens.fontSizeBase200,
    flexGrow: 1,
  },
  streamBadge: {
    fontSize: "10px",
  },
  footer: {
    marginTop: "auto",
    paddingTop: "8px",
    paddingBottom: "8px",
    paddingLeft: "12px",
    paddingRight: "12px",
    borderTop: `1px solid ${tokens.colorNeutralStroke1}`,
  },
});

export function ChannelSelector() {
  const styles = useStyles();
  const { selectedChannel, adapters, setSelectedChannel, events, requests } =
    useDevToolsStore();

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <Text className={styles.title}>
          <PlugConnectedRegular /> Channels
        </Text>
      </div>

      <div className={styles.list}>
        {adapters.map((adapter: AdapterInfo) => (
          <div
            key={adapter.type}
            className={
              adapter.type === selectedChannel
                ? styles.itemSelected
                : styles.item
            }
            onClick={() => setSelectedChannel(adapter.type)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ")
                setSelectedChannel(adapter.type);
            }}
          >
            <Text className={styles.channelName}>{adapter.name}</Text>
            {adapter.supportsStreaming && (
              <Tooltip content="Supports streaming" relationship="label">
                <Badge
                  size="tiny"
                  appearance="filled"
                  color="success"
                  className={styles.streamBadge}
                  icon={<LiveRegular />}
                />
              </Tooltip>
            )}
          </div>
        ))}
      </div>

      <div className={styles.footer}>
        <Text
          style={{
            fontSize: tokens.fontSizeBase100,
            color: tokens.colorNeutralForeground4,
          }}
        >
          {events.length} events · {requests.length} requests
        </Text>
        <div style={{ marginTop: "4px" }}>
          <Button
            size="small"
            appearance="subtle"
            onClick={() => {
              const state = getDevToolsState();
              state.clearEvents();
              state.clearRequests();
              state.clearConsole();
            }}
          >
            Clear all
          </Button>
        </div>
      </div>
    </div>
  );
}
