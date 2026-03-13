/**
 * AdaptersPanel — Compare all 14 channels side-by-side.
 * Shows adapter metadata and capability matrix.
 */
import {
  makeStyles,
  tokens,
  Text,
  Badge,
  Button,
} from "@fluentui/react-components";
import {
  CheckmarkRegular,
  DismissRegular,
  ArrowSyncRegular,
} from "@fluentui/react-icons";
import { useDevToolsStore } from "~/store/useDevToolsStore.js";
import type { AdapterInfo } from "~/store/devtools-store.js";

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
  grid: {
    flexGrow: 1,
    overflowY: "auto",
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: tokens.fontSizeBase200,
  },
  th: {
    textAlign: "left" as const,
    paddingTop: "8px",
    paddingBottom: "8px",
    paddingLeft: "12px",
    paddingRight: "12px",
    borderBottom: `2px solid ${tokens.colorNeutralStroke1}`,
    backgroundColor: tokens.colorNeutralBackground3,
    fontSize: tokens.fontSizeBase100,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground3,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    position: "sticky" as const,
    top: 0,
    zIndex: 1,
  },
  td: {
    paddingTop: "6px",
    paddingBottom: "6px",
    paddingLeft: "12px",
    paddingRight: "12px",
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  trHover: {
    ":hover": {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  adapterName: {
    fontWeight: tokens.fontWeightSemibold,
  },
  channelType: {
    fontFamily: "monospace",
    fontSize: "11px",
    color: tokens.colorNeutralForeground3,
  },
  empty: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    color: tokens.colorNeutralForeground4,
  },
});

/** Adapter class groupings (from factory.ts) */
const ADAPTER_GROUPS: Record<string, string[]> = {
  WebAdapter: ["web", "msr-home", "agents-sdk", "teams"],
  BotFrameworkAdapter: ["m365-agents", "message-extension", "copilot-studio"],
  GitHubCopilotAdapter: ["github-copilot"],
  MCPAdapter: ["mcp-server"],
  PowerPlatformAdapter: ["power-platform", "copilot-knowledge", "copilot-search"],
  DirectLineAdapter: ["direct-line"],
  CLIAdapter: ["github-cli"],
};

function getAdapterClass(channelType: string): string {
  for (const [cls, channels] of Object.entries(ADAPTER_GROUPS)) {
    if (channels.includes(channelType)) return cls;
  }
  return "Unknown";
}

function BoolIcon({ value }: { value: boolean }) {
  return value ? (
    <CheckmarkRegular
      style={{ color: tokens.colorPaletteGreenForeground1 }}
    />
  ) : (
    <DismissRegular style={{ color: tokens.colorNeutralForeground4 }} />
  );
}

export function AdaptersPanel() {
  const styles = useStyles();
  const { adapters, selectedChannel, setSelectedChannel } =
    useDevToolsStore();

  return (
    <div className={styles.root}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <Text size={200} weight="semibold">
          Channel Adapters
        </Text>
        <Badge size="small" appearance="outline">
          {adapters.length} channels
        </Badge>
        <Text
          size={100}
          style={{
            marginLeft: "auto",
            color: tokens.colorNeutralForeground4,
          }}
        >
          Click a row to select channel
        </Text>
      </div>

      {/* Table */}
      <div className={`${styles.grid} devtools-scrollable`}>
        {adapters.length === 0 ? (
          <div className={styles.empty}>
            <Text size={200}>No adapters loaded</Text>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Channel</th>
                <th className={styles.th}>Adapter Name</th>
                <th className={styles.th}>Adapter Class</th>
                <th className={styles.th}>Streaming</th>
                <th className={styles.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {adapters.map((adapter: AdapterInfo) => (
                <tr
                  key={adapter.type}
                  className={styles.trHover}
                  style={{
                    backgroundColor:
                      adapter.type === selectedChannel
                        ? tokens.colorNeutralBackground1Selected
                        : undefined,
                    cursor: "pointer",
                  }}
                  onClick={() => setSelectedChannel(adapter.type)}
                >
                  <td className={styles.td}>
                    <div>
                      <Text className={styles.channelType}>
                        {adapter.type}
                      </Text>
                    </div>
                  </td>
                  <td className={styles.td}>
                    <Text className={styles.adapterName}>{adapter.name}</Text>
                  </td>
                  <td className={styles.td}>
                    <Badge size="small" appearance="outline">
                      {getAdapterClass(adapter.type)}
                    </Badge>
                  </td>
                  <td className={styles.td}>
                    <BoolIcon value={adapter.supportsStreaming} />
                  </td>
                  <td className={styles.td}>
                    <Badge
                      size="tiny"
                      appearance="filled"
                      color="success"
                    >
                      Ready
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
