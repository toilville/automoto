import { BehaviorSubject, Subject, of, type Observable } from "rxjs";
import type { DirectLineLike, WebChatActivity } from "./types";

const CONNECTION_STATUS = {
  Uninitialized: 0,
  Connecting: 1,
  Online: 2,
  ExpiredToken: 3,
  FailedToConnect: 4,
  Ended: 5,
} as const;

const DEFAULT_SUGGESTED_ACTIONS = [
  { type: "imBack", title: "Show sample card", value: "Show sample card" },
  { type: "imBack", title: "How does demo mode work?", value: "How does demo mode work?" },
  { type: "imBack", title: "Restart conversation", value: "Restart conversation" },
];

export class MockDirectLine implements DirectLineLike {
  public readonly activity$: Observable<WebChatActivity>;
  public readonly connectionStatus$: Observable<number>;

  private readonly activitySubject = new Subject<WebChatActivity>();
  private readonly connectionStatusSubject = new BehaviorSubject<number>(CONNECTION_STATUS.Connecting);
  private isEnded = false;
  private messageCount = 0;

  public constructor(private readonly botName = "Automoto Assistant") {
    this.activity$ = this.activitySubject.asObservable();
    this.connectionStatus$ = this.connectionStatusSubject.asObservable();

    setTimeout(() => {
      if (!this.isEnded) {
        this.connectionStatusSubject.next(CONNECTION_STATUS.Online);
      }
    }, 50);
  }

  public postActivity(activity: WebChatActivity) {
    const activityId = createId("activity");

    if (this.isEnded) {
      return of(activityId);
    }

    if (activity.type === "event" && activity.name === "startConversation") {
      this.emitWelcomeSequence();
      return of(activityId);
    }

    if (activity.type === "message") {
      this.messageCount += 1;
      this.emitTyping(180);
      this.emitMessageResponse(activity.text?.trim() || "", this.messageCount);
    }

    return of(activityId);
  }

  public end() {
    if (this.isEnded) {
      return;
    }

    this.isEnded = true;
    this.connectionStatusSubject.next(CONNECTION_STATUS.Ended);
    this.activitySubject.complete();
    this.connectionStatusSubject.complete();
  }

  private emitWelcomeSequence() {
    this.emitTyping(150);
    this.emitActivityAfter(520, {
      type: "message",
      from: createBotIdentity(this.botName),
      text: `Demo mode is active. Configure VITE_TOKEN_ENDPOINT in .env to connect ${this.botName} to a live Copilot Studio agent.`,
      suggestedActions: {
        actions: DEFAULT_SUGGESTED_ACTIONS,
      },
    });

    this.emitActivityAfter(980, {
      type: "message",
      from: createBotIdentity(this.botName),
      attachments: [
        {
          contentType: "application/vnd.microsoft.card.adaptive",
          content: buildAdaptiveCard("Open the widget and try a few messages to see the local mock agent in action."),
        },
      ],
    });
  }

  private emitMessageResponse(input: string, messageIndex: number) {
    const normalizedInput = input || "(empty message)";
    const lowerInput = normalizedInput.toLowerCase();
    const responseText =
      lowerInput.includes("restart")
        ? "Use the restart button in the header to create a brand new Direct Line conversation."
        : lowerInput.includes("demo")
          ? "Demo mode uses a local Direct Line shim, so you can test the widget, suggested actions, typing indicators, and adaptive cards without Power Platform access."
          : `I received: ${normalizedInput}`;

    this.emitActivityAfter(620, {
      type: "message",
      from: createBotIdentity(this.botName),
      text: responseText,
      suggestedActions: {
        actions: DEFAULT_SUGGESTED_ACTIONS,
      },
    });

    if (messageIndex === 1 || /card|sample|adaptive/.test(lowerInput)) {
      this.emitActivityAfter(1040, {
        type: "message",
        from: createBotIdentity(this.botName),
        attachments: [
          {
            contentType: "application/vnd.microsoft.card.adaptive",
            content: buildAdaptiveCard(normalizedInput),
          },
        ],
      });
    }
  }

  private emitTyping(delayMs: number) {
    this.emitActivityAfter(delayMs, {
      type: "typing",
      from: createBotIdentity(this.botName),
    });
  }

  private emitActivityAfter(delayMs: number, activity: WebChatActivity) {
    setTimeout(() => {
      if (!this.isEnded) {
        this.activitySubject.next({
          id: createId("bot"),
          locale: "en-US",
          ...activity,
        });
      }
    }, delayMs);
  }
}

function createBotIdentity(botName: string) {
  return {
    id: "mock-bot",
    name: botName,
    role: "bot",
  } as const;
}

function buildAdaptiveCard(lastMessage: string) {
  return {
    type: "AdaptiveCard",
    version: "1.5",
    body: [
      {
        type: "TextBlock",
        text: "Mock adaptive card",
        wrap: true,
        weight: "Bolder",
        size: "Medium",
      },
      {
        type: "TextBlock",
        text: "This response is rendered locally so you can validate the embedded Web Chat experience before wiring up a live Copilot Studio token endpoint.",
        wrap: true,
      },
      {
        type: "FactSet",
        facts: [
          {
            title: "Last message",
            value: lastMessage,
          },
          {
            title: "Connection",
            value: "Mock Direct Line",
          },
        ],
      },
    ],
    actions: [
      {
        type: "Action.OpenUrl",
        title: "Learn about Copilot Studio",
        url: "https://learn.microsoft.com/microsoft-copilot-studio/",
      },
    ],
  };
}

function createId(prefix: string) {
  const uniquePart = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2, 12);
  return `${prefix}-${uniquePart}`;
}
