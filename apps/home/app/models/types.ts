/**
 * Core types for the Homepage Chat thin client.
 * These types define the contract between UI ↔ API proxy ↔ Foundry Agent.
 */

/* ── Chat Messages ────────────────────────────────────────── */

export interface ChatMessage {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  /** Inline explanation of why a recommendation was made. */
  contextualExplanation?: string;
  /** Interactive quick-reply buttons or navigation actions. */
  interactive?: {
    type: "buttons" | "navigation";
    data: QuickReplyAction[];
  };
  /** Structured cards returned from agent tool calls. */
  referencedCards?: CarouselCard[];
  /** RAG grounding source identifiers for citation display. */
  ragSources?: string[];
  /** Token usage from the model response. */
  usage?: TokenUsage;
  /** How the response was generated. */
  responseType?: "agent" | "fast_path" | "error";
  /** Streaming finish reason. */
  finishReason?: string;
  /** Whether the agent refused this request. */
  refusal?: boolean;
  refusalReason?: "content_filter" | "rate_limit" | "error" | "off_topic";
  /** Tool results returned inline by the agent. */
  toolResults?: ToolResult[];
}

export interface TokenUsage {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

export interface ToolResult {
  toolName: string;
  result: unknown;
}

/* ── Quick Reply Actions ──────────────────────────────────── */

export interface QuickReplyAction {
  id: string;
  label: string;
  type: "action" | "link" | "navigation";
  payload?: string;
  url?: string;
}

/* ── Card Types (Discriminated Union) ─────────────────────── */

export type CardKind =
  | "project"
  | "researcher"
  | "blogPost"
  | "article"
  | "publication"
  | "ragDoc"
  | "adaptive";

interface BaseCardData {
  id: string;
  cardKind: CardKind;
  title: string;
  url?: string;
}

export interface ProjectCardData extends BaseCardData {
  cardKind: "project";
  description?: string;
  people?: string[];
  location?: string;
  startTime?: string;
  endTime?: string;
  date?: string;
  tags?: string[];
  topic?: string;
  imageSrc?: string;
}

export interface ResearcherCardData extends BaseCardData {
  cardKind: "researcher";
  name: string;
  role?: string;
  lab?: string;
  researchAreas?: string[];
  avatarUrl?: string;
  bio?: string;
  publicationCount?: number;
}

export interface BlogPostCardData extends BaseCardData {
  cardKind: "blogPost";
  excerpt?: string;
  date?: string;
  imageUrl?: string;
  categories?: string[];
}

export interface ArticleCardData extends BaseCardData {
  cardKind: "article";
  excerpt?: string;
  date?: string;
  imageUrl?: string;
  source?: string;
}

export interface PublicationCardData extends BaseCardData {
  cardKind: "publication";
  authors?: string[];
  abstract?: string;
  date?: string;
  researchAreas?: string[];
  publicationUrl?: string;
}

export interface RagDocCardData extends BaseCardData {
  cardKind: "ragDoc";
  description?: string;
  domain?: string;
  corpus?: string;
}

export interface AdaptiveCardData extends BaseCardData {
  cardKind: "adaptive";
  /** Raw Adaptive Card JSON payload (schema v1.x). */
  body: Record<string, unknown>;
  /** Optional fallback text for non-visual contexts. */
  fallbackText?: string;
}

export type CarouselCard =
  | ProjectCardData
  | ResearcherCardData
  | BlogPostCardData
  | ArticleCardData
  | PublicationCardData
  | RagDocCardData
  | AdaptiveCardData;

/* ── SSE Stream Protocol ──────────────────────────────────── */

/** Chunks sent from server → client over SSE. */
export type StreamEvent =
  | { type: "chunk"; chunk: string; id: string; index: number }
  | { type: "references"; references: string[] }
  | { type: "cards"; cards: CarouselCard[] }
  | { type: "tool_call"; toolName: string; status: "started" | "completed"; result?: unknown }
  | { type: "usage"; usage: TokenUsage }
  | { type: "done"; finishReason: string; fullResponse: string }
  | { type: "error"; message: string; code?: string };

/* ── API Request/Response ─────────────────────────────────── */

export interface ChatRequest {
  message: string;
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>;
  /** Optional fast-path action (explore-research-areas, find-researchers, etc.) */
  action?: { type: "fastPath"; payload?: string };
  pageContext?: PageContext;
  stream?: boolean;
}

export interface PageContext {
  pagePath?: string;
  scope?: string;
  researchArea?: string;
  labId?: string;
  researcherId?: string;
  pageType?: "home" | "research-area" | "researcher" | "publication" | "lab" | "other";
}

/* ── Chat Settings (UI Config) ────────────────────────────── */

export interface ChatSettings {
  enableAI: boolean;
  theme: "light" | "dark";
  chatContrast: "default" | "high";
  chatSpacing: "default" | "relaxed";
  currentPageContext?: PageContext;
}

/* ── Chat UI Text Config ──────────────────────────────────── */

export interface ChatUiText {
  title: string;
  subtitle: string;
  disclaimer: string;
  inputPlaceholder: string;
  loadingText: string;
  stillThinkingText: string;
  welcomeTitle: string;
  welcomeSubtitle: string;
  welcomeCards: WelcomeCard[];
}

export interface WelcomeCard {
  id: string;
  icon: string;
  title: string;
  description: string;
  action: { type: "fastPath"; payload: string };
  order: number;
}
