import { describe, expect, it, vi } from "vitest";
import type { WebChatActivity } from "./types";
import { MockDirectLine } from "./mock-direct-line";

describe("MockDirectLine", () => {
  it("transitions to an online connection state", async () => {
    vi.useFakeTimers();
    const directLine = new MockDirectLine();
    const statuses: number[] = [];
    const subscription = directLine.connectionStatus$.subscribe(status => {
      statuses.push(status);
    });

    await vi.advanceTimersByTimeAsync(100);

    expect(statuses).toContain(2);

    subscription.unsubscribe();
    directLine.end();
    vi.useRealTimers();
  });

  it("emits typing, echo text, and an adaptive card response", async () => {
    vi.useFakeTimers();
    const directLine = new MockDirectLine();
    const activities: WebChatActivity[] = [];
    const subscription = directLine.activity$.subscribe(activity => {
      activities.push(activity);
    });

    directLine
      .postActivity({
        type: "message",
        text: "Show sample card",
        from: {
          id: "user-1",
          role: "user",
        },
      })
      .subscribe();

    await vi.advanceTimersByTimeAsync(1500);

    expect(activities.some(activity => activity.type === "typing")).toBe(true);
    expect(activities.some(activity => activity.type === "message" && activity.text?.includes("I received: Show sample card"))).toBe(true);
    expect(
      activities.some(activity =>
        activity.attachments?.some(attachment => attachment.contentType === "application/vnd.microsoft.card.adaptive"),
      ),
    ).toBe(true);

    subscription.unsubscribe();
    directLine.end();
    vi.useRealTimers();
  });
});
