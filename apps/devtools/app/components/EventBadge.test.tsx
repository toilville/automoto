import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { FluentProvider, webDarkTheme } from "@fluentui/react-components";
import { EventBadge } from "./EventBadge.js";

function renderBadge(type: string) {
  return render(
    <FluentProvider theme={webDarkTheme}>
      <EventBadge type={type} />
    </FluentProvider>,
  );
}

describe("EventBadge", () => {
  it('renders "TEXT" for chunk events', () => {
    const { getByText } = renderBadge("chunk");
    expect(getByText("TEXT")).toBeTruthy();
  });

  it('renders "TEXT" for text_delta events', () => {
    const { container } = renderBadge("text_delta");
    expect(container.textContent).toContain("TEXT");
  });

  it('renders "ERROR" for error events', () => {
    const { getByText } = renderBadge("error");
    expect(getByText("ERROR")).toBeTruthy();
  });

  it('renders "CARD" for card events', () => {
    const { getByText } = renderBadge("card");
    expect(getByText("CARD")).toBeTruthy();
  });

  it('renders "DONE" for done events', () => {
    const { getByText } = renderBadge("done");
    expect(getByText("DONE")).toBeTruthy();
  });

  it('renders "USAGE" for usage events', () => {
    const { getByText } = renderBadge("usage");
    expect(getByText("USAGE")).toBeTruthy();
  });

  it("falls back to uppercased type for unknown events", () => {
    const { getByText } = renderBadge("custom_event");
    expect(getByText("CUSTOM_EVENT")).toBeTruthy();
  });
});
