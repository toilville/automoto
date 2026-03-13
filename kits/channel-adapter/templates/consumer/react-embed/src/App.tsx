/**
 * MSR Agent Chat — React Embed Example
 *
 * Demonstrates embedding the MSR Agent chat UI into a React application
 * using the vendored @automoto/chat-ui and @automoto/data-client packages.
 *
 * This is the consumer pattern — you don't implement a new channel,
 * you embed an EXISTING channel's UI into your app.
 */
import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import { ChatContainer } from "@automoto/chat-ui";

// TODO: Configure these for your deployment
const CONFIG = {
  /** Your MSR Agent gateway or channel endpoint URL */
  endpoint: import.meta.env.VITE_MSR_ENDPOINT ?? "http://localhost:4000",

  /** Channel type to connect through */
  channel: "web" as const,

  /** Optional: scope to filter responses (e.g., event name, topic area) */
  scope: import.meta.env.VITE_MSR_SCOPE,
};

/**
 * Main App — wraps the chat UI in a Fluent UI provider.
 *
 * Customize the wrapper (container sizing, theme, positioning) to fit your layout.
 */
export default function App() {
  return (
    <FluentProvider theme={webLightTheme}>
      <div
        style={{
          width: "100%",
          maxWidth: 720,
          height: "80vh",
          margin: "2rem auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <h2>MSR Agent Chat</h2>
        <div style={{ flex: 1 }}>
          <ChatContainer
            endpoint={CONFIG.endpoint}
            channel={CONFIG.channel}
            scope={CONFIG.scope}
          />
        </div>
      </div>
    </FluentProvider>
  );
}
