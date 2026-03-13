/**
 * ProtocolPanel — Side-by-side view of the request/response transform pipeline.
 * Shows: Raw Request → Canonical MSRAgentRequest → Canonical MSRAgentResponse → Events
 */
import {
  makeStyles,
  tokens,
  Text,
  Badge,
  TabList,
  Tab,
} from "@fluentui/react-components";
import { useState } from "react";
import { JsonView } from "./JsonView.js";
import { useDevToolsStore } from "~/store/useDevToolsStore.js";

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
  columns: {
    display: "flex",
    flexGrow: 1,
    overflow: "hidden",
  },
  column: {
    flexBasis: "50%",
    flexGrow: 1,
    overflowY: "auto",
    paddingTop: "8px",
    paddingBottom: "8px",
    paddingLeft: "8px",
    paddingRight: "8px",
    borderRight: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  columnHeader: {
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground3,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    paddingBottom: "8px",
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    marginBottom: "8px",
  },
  empty: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    color: tokens.colorNeutralForeground4,
  },
  requestList: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    paddingBottom: "8px",
  },
  requestItem: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    paddingTop: "4px",
    paddingBottom: "4px",
    paddingLeft: "6px",
    paddingRight: "6px",
    cursor: "pointer",
    borderRadius: tokens.borderRadiusSmall,
    ":hover": {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  requestItemSelected: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    paddingTop: "4px",
    paddingBottom: "4px",
    paddingLeft: "6px",
    paddingRight: "6px",
    cursor: "pointer",
    borderRadius: tokens.borderRadiusSmall,
    backgroundColor: tokens.colorNeutralBackground1Selected,
  },
});

type ProtocolView = "request" | "response";

export function ProtocolPanel() {
  const styles = useStyles();
  const { requests, selectedRequestId, setSelectedRequestId } =
    useDevToolsStore();
  const [view, setView] = useState<ProtocolView>("request");

  const selectedRequest = requests.find((r) => r.id === selectedRequestId);

  return (
    <div className={styles.root}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <Text size={200} weight="semibold">
          Protocol Inspector
        </Text>
        <TabList
          size="small"
          selectedValue={view}
          onTabSelect={(_, d) => setView(d.value as ProtocolView)}
        >
          <Tab value="request">Request</Tab>
          <Tab value="response">Response</Tab>
        </TabList>
        <Badge size="small" appearance="outline" style={{ marginLeft: "auto" }}>
          {requests.length} requests
        </Badge>
      </div>

      {/* Content */}
      <div className={styles.columns}>
        {/* Left: Request list */}
        <div
          className={`${styles.column} devtools-scrollable`}
          style={{ maxWidth: "280px", flexBasis: "30%" }}
        >
          <div className={styles.columnHeader}>Requests</div>
          {requests.length === 0 ? (
            <Text
              size={200}
              style={{ color: tokens.colorNeutralForeground4 }}
            >
              No requests yet
            </Text>
          ) : (
            <div className={styles.requestList}>
              {requests.map((r) => (
                <div
                  key={r.id}
                  className={
                    r.id === selectedRequestId
                      ? styles.requestItemSelected
                      : styles.requestItem
                  }
                  onClick={() => setSelectedRequestId(r.id)}
                >
                  <Badge
                    size="tiny"
                    appearance="filled"
                    color={
                      !r.status
                        ? "subtle"
                        : r.status < 300
                          ? "success"
                          : r.status < 500
                            ? "warning"
                            : "danger"
                    }
                  >
                    {r.status || "..."}
                  </Badge>
                  <Text
                    size={100}
                    style={{ fontFamily: "monospace", flexGrow: 1 }}
                  >
                    {r.channel}
                  </Text>
                  <Text
                    size={100}
                    style={{ color: tokens.colorNeutralForeground4 }}
                  >
                    {r.durationMs ? `${r.durationMs}ms` : "..."}
                  </Text>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Detail */}
        <div className={`${styles.column} devtools-scrollable`}>
          {!selectedRequest ? (
            <div className={styles.empty}>
              <Text size={200}>Select a request to inspect</Text>
            </div>
          ) : (
            <>
              <div className={styles.columnHeader}>
                {view === "request" ? "Canonical Request" : "Response & Events"}
              </div>
              {view === "request" ? (
                <JsonView data={selectedRequest.request} />
              ) : (
                <>
                  {selectedRequest.response && (
                    <>
                      <Text
                        size={200}
                        weight="semibold"
                        style={{ display: "block", marginBottom: "4px" }}
                      >
                        Response Data
                      </Text>
                      <JsonView data={selectedRequest.response} />
                    </>
                  )}
                  {selectedRequest.headers && (
                    <>
                      <Text
                        size={200}
                        weight="semibold"
                        style={{
                          display: "block",
                          marginTop: "12px",
                          marginBottom: "4px",
                        }}
                      >
                        Response Headers
                      </Text>
                      <JsonView
                        data={selectedRequest.headers}
                        defaultExpanded={false}
                      />
                    </>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
