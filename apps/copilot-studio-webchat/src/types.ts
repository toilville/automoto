import type { Observable } from "rxjs";
import type { WebChatStyleOptions } from "./style-options";

export interface WebChatTheme {
  id: string;
  name: string;
  description: string;
  styleOptions: WebChatStyleOptions;
}

export interface TestCase {
  id: string;
  input: string;
  expectedResponse?: string;
  expectedTopic?: string;
  type: "response_match" | "topic_match" | "attachment_match" | "generative";
  rubric?: string;
}

export interface TestSet {
  name: string;
  description: string;
  testCases: TestCase[];
}

export interface TestResult {
  testCaseId: string;
  passed: boolean;
  actualResponse: string;
  latencyMs: number;
  details: string;
}

export interface ChatParticipant {
  id: string;
  name?: string;
  role?: "bot" | "user" | string;
}

export interface SuggestedAction {
  type: string;
  title: string;
  value?: string;
}

export interface WebChatAttachment {
  contentType: string;
  content?: unknown;
  contentUrl?: string;
  name?: string;
}

export interface WebChatActivity {
  id?: string;
  type: "message" | "typing" | "event" | string;
  text?: string;
  name?: string;
  locale?: string;
  localTimezone?: string;
  value?: unknown;
  from?: ChatParticipant;
  channelData?: Record<string, unknown>;
  suggestedActions?: {
    actions: SuggestedAction[];
  };
  attachments?: WebChatAttachment[];
  attachmentLayout?: "carousel" | "list";
}

export interface DirectLineLike {
  activity$: Observable<WebChatActivity>;
  connectionStatus$: Observable<number>;
  postActivity(activity: WebChatActivity): Observable<string>;
  end?: () => void;
}
