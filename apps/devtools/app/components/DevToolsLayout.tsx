/**
 * DevToolsLayout — Main three-panel layout:
 *   LEFT: Channel selector sidebar
 *   TOP-RIGHT: Chat pane
 *   BOTTOM-RIGHT: Tabbed devtools panels (Events, Protocol, Network, Console, Adapters)
 *
 * Uses CSS Grid for the split-pane layout (no external dependency).
 */
import { makeStyles, tokens, TabList, Tab, Text } from "@fluentui/react-components";
import {
  TimelineRegular,
  BranchRegular,
  GlobeRegular,
  WindowConsoleRegular,
  PlugConnectedRegular,
} from "@fluentui/react-icons";
import { ChannelSelector } from "./ChannelSelector.js";
import { ChatPane } from "./ChatPane.js";
import { EventsPanel } from "./EventsPanel.js";
import { ProtocolPanel } from "./ProtocolPanel.js";
import { NetworkPanel } from "./NetworkPanel.js";
import { ConsolePanel } from "./ConsolePanel.js";
import { AdaptersPanel } from "./AdaptersPanel.js";
import { useDevToolsStore } from "~/store/useDevToolsStore.js";
import type { DevToolsTab } from "~/store/devtools-store.js";

const useStyles = makeStyles({
  root: {
    display: "grid",
    gridTemplateColumns: "var(--devtools-sidebar-width, 220px) 1fr",
    gridTemplateRows: "1fr",
    height: "100vh",
    width: "100vw",
    overflow: "hidden",
  },
  sidebar: {
    gridRow: "1",
    gridColumn: "1",
    overflow: "hidden",
  },
  main: {
    gridRow: "1",
    gridColumn: "2",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  chatArea: {
    flexBasis: "45%",
    flexShrink: 0,
    minHeight: "200px",
    overflow: "hidden",
    borderBottom: `2px solid ${tokens.colorNeutralStroke1}`,
  },
  devtoolsArea: {
    flexGrow: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  tabBar: {
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    backgroundColor: tokens.colorNeutralBackground1,
    paddingLeft: "8px",
  },
  tabContent: {
    flexGrow: 1,
    overflow: "hidden",
  },
});

const TAB_CONFIG: Array<{ value: DevToolsTab; label: string; icon: JSX.Element }> = [
  { value: "events", label: "Events", icon: <TimelineRegular /> },
  { value: "protocol", label: "Protocol", icon: <BranchRegular /> },
  { value: "network", label: "Network", icon: <GlobeRegular /> },
  { value: "console", label: "Console", icon: <WindowConsoleRegular /> },
  { value: "adapters", label: "Adapters", icon: <PlugConnectedRegular /> },
];

function ActivePanel({ tab }: { tab: DevToolsTab }) {
  switch (tab) {
    case "events":
      return <EventsPanel />;
    case "protocol":
      return <ProtocolPanel />;
    case "network":
      return <NetworkPanel />;
    case "console":
      return <ConsolePanel />;
    case "adapters":
      return <AdaptersPanel />;
  }
}

export function DevToolsLayout() {
  const styles = useStyles();
  const { activeTab, setActiveTab, events } = useDevToolsStore();

  return (
    <div className={styles.root}>
      {/* Sidebar */}
      <div className={styles.sidebar}>
        <ChannelSelector />
      </div>

      {/* Main area */}
      <div className={styles.main}>
        {/* Chat pane (top) */}
        <div className={styles.chatArea}>
          <ChatPane />
        </div>

        {/* DevTools panels (bottom) */}
        <div className={styles.devtoolsArea}>
          <div className={styles.tabBar}>
            <TabList
              size="small"
              selectedValue={activeTab}
              onTabSelect={(_, d) => setActiveTab(d.value as DevToolsTab)}
            >
              {TAB_CONFIG.map((tab) => (
                <Tab key={tab.value} value={tab.value} icon={tab.icon}>
                  {tab.label}
                  {tab.value === "events" && events.length > 0 && (
                    <Text
                      size={100}
                      style={{
                        marginLeft: "4px",
                        color: tokens.colorNeutralForeground4,
                      }}
                    >
                      ({events.length})
                    </Text>
                  )}
                </Tab>
              ))}
            </TabList>
          </div>
          <div className={styles.tabContent}>
            <ActivePanel tab={activeTab} />
          </div>
        </div>
      </div>
    </div>
  );
}
