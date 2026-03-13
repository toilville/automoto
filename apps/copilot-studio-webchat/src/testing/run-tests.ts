/**
 * Inspired by the Power CAT Copilot Studio Kit
 * (https://github.com/microsoft/Power-CAT-Copilot-Studio-Kit)
 * Ported to run locally without Power Platform/Dataverse dependencies.
 * Original kit is maintained by the Power Customer Advisory Team at Microsoft.
 */
import { readFile, writeFile } from "fs/promises";
import path from "path";
import { performance } from "perf_hooks";
import { fileURLToPath } from "url";

import {
  DirectLineTestClient,
  type Activity,
} from "./direct-line-client";
import {
  evaluateAttachmentMatch,
  evaluateGenerative,
  evaluateResponseMatch,
  evaluateTopicMatch,
} from "./evaluators";
import type { TestCase } from "../types";

type TestCaseType =
  | "response_match"
  | "attachment_match"
  | "topic_match"
  | "generative"
  | "multi_turn";

type LoadedTestCase = Omit<TestCase, "input" | "type"> & {
  id: string;
  input: string | string[];
  type: TestCaseType;
  expectedResponse?: string;
  expectedTopic?: string;
  rubric?: string;
};

interface TestSetFile {
  name: string;
  description?: string;
  testCases: LoadedTestCase[];
}

interface TokenResponse {
  token?: string;
  expires_in?: number;
  conversationId?: string;
  channelUrlsById?: {
    directline?: string;
  };
}

interface RegionalChannelSettings {
  channelUrlsById?: {
    directline?: string;
  };
}

interface TestResult {
  id: string;
  type: TestCaseType;
  passed: boolean;
  latencyMs: number;
  input: string | string[];
  actualResponse: string;
  details: string;
  attachments: number;
  rubric?: string;
  turns?: Array<{
    input: string;
    response: string;
    attachments: number;
    latencyMs: number;
  }>;
}

interface TestReport {
  generatedAt: string;
  mode: "live" | "mock";
  tokenEndpoint?: string;
  directLineDomain?: string;
  testSet: {
    name: string;
    description?: string;
    path: string;
  };
  summary: {
    total: number;
    passed: number;
    failed: number;
    averageLatencyMs: number;
  };
  results: TestResult[];
}

interface CliOptions {
  testSetPath: string;
  tokenEndpoint?: string;
  mock: boolean;
}

interface ClientSetup {
  client: TestClient;
  directLineDomain: string;
}

interface TestClient {
  startConversation(): Promise<string>;
  sendMessage(conversationId: string, text: string): Promise<void>;
  waitForResponse(conversationId: string, timeoutMs?: number): Promise<Activity[]>;
  endConversation(conversationId: string): Promise<void>;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const APP_ROOT = path.resolve(__dirname, "..", "..");
const DEFAULT_TEST_SET_PATH = path.resolve(APP_ROOT, "test-sets", "sample.json");
const OUTPUT_PATH = path.resolve(APP_ROOT, "test-results.json");
const DEFAULT_DIRECT_LINE_DOMAIN = "https://directline.botframework.com";
const DEFAULT_TIMEOUT_MS = 30000;

class MockDirectLineTestClient implements TestClient {
  private readonly queues = new Map<string, Activity[]>();
  private conversationCounter = 0;

  async startConversation(): Promise<string> {
    const conversationId = `mock-conversation-${++this.conversationCounter}`;
    this.queues.set(conversationId, []);
    return conversationId;
  }

  async sendMessage(conversationId: string, text: string): Promise<void> {
    this.queues.set(conversationId, buildMockActivities(text));
  }

  async waitForResponse(conversationId: string): Promise<Activity[]> {
    await delay(50);
    const activities = this.queues.get(conversationId) ?? [];
    this.queues.set(conversationId, []);
    return activities;
  }

  async endConversation(conversationId: string): Promise<void> {
    this.queues.delete(conversationId);
  }
}

async function main(): Promise<void> {
  const options = parseCliArgs(process.argv.slice(2));
  const testSet = await loadTestSet(options.testSetPath);
  const setup = options.mock
    ? { client: new MockDirectLineTestClient(), directLineDomain: "mock://local" }
    : await createLiveClient(options.tokenEndpoint);
  const { client, directLineDomain } = setup;

  const results: TestResult[] = [];

  console.log(`\nRunning test set: ${testSet.name}`);
  if (testSet.description) {
    console.log(testSet.description);
  }
  console.log(`Cases: ${testSet.testCases.length}\n`);

  for (const testCase of testSet.testCases) {
    const result = await runTestCase(client, testCase);
    results.push(result);
    console.log(
      `${result.passed ? "PASS" : "FAIL"} ${result.id} (${result.type}) — ${result.latencyMs} ms`,
    );
  }

  const passed = results.filter((result) => result.passed).length;
  const failed = results.length - passed;
  const averageLatencyMs =
    results.length > 0
      ? Math.round(
          results.reduce((sum, result) => sum + result.latencyMs, 0) /
            results.length,
        )
      : 0;

  console.table(
    results.map((result) => ({
      id: result.id,
      type: result.type,
      status: result.passed ? "PASS" : "FAIL",
      latencyMs: result.latencyMs,
      attachments: result.attachments,
      details: truncate(result.details, 88),
    })),
  );

  const report: TestReport = {
    generatedAt: new Date().toISOString(),
    mode: options.mock ? "mock" : "live",
    tokenEndpoint: options.tokenEndpoint,
    directLineDomain,
    testSet: {
      name: testSet.name,
      description: testSet.description,
      path: options.testSetPath,
    },
    summary: {
      total: results.length,
      passed,
      failed,
      averageLatencyMs,
    },
    results,
  };

  await writeFile(OUTPUT_PATH, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  console.log(`\nSummary: ${passed}/${results.length} passed, ${failed} failed.`);
  console.log(`Average latency: ${averageLatencyMs} ms`);
  console.log(`Results written to ${OUTPUT_PATH}`);

  if (failed > 0) {
    process.exitCode = 1;
  }
}

async function runTestCase(
  client: TestClient,
  testCase: LoadedTestCase,
): Promise<TestResult> {
  if (testCase.type === "multi_turn") {
    return runMultiTurnTestCase(client, testCase);
  }

  const input = typeof testCase.input === "string" ? testCase.input : testCase.input.join(" ");
  const conversationId = await client.startConversation();

  try {
    const turn = await runConversationTurn(client, conversationId, input);
    const evaluation = evaluateTestCase(testCase, turn.searchText, turn.attachments);

    return {
      id: testCase.id,
      type: testCase.type,
      passed: evaluation.passed,
      latencyMs: turn.latencyMs,
      input: testCase.input,
      actualResponse: turn.displayText,
      details: evaluation.details,
      attachments: turn.attachments.length,
      rubric: testCase.rubric,
    };
  } catch (error) {
    return {
      id: testCase.id,
      type: testCase.type,
      passed: false,
      latencyMs: 0,
      input: testCase.input,
      actualResponse: "",
      details: error instanceof Error ? error.message : "Unknown test runner error.",
      attachments: 0,
      rubric: testCase.rubric,
    };
  } finally {
    await client.endConversation(conversationId);
  }
}

async function runMultiTurnTestCase(
  client: TestClient,
  testCase: LoadedTestCase,
): Promise<TestResult> {
  if (!Array.isArray(testCase.input) || testCase.input.length === 0) {
    return {
      id: testCase.id,
      type: testCase.type,
      passed: false,
      latencyMs: 0,
      input: testCase.input,
      actualResponse: "",
      details: "Multi-turn tests require a non-empty array of input messages.",
      attachments: 0,
      rubric: testCase.rubric,
    };
  }

  const conversationId = await client.startConversation();
  const turns: TestResult["turns"] = [];
  const combinedDisplay: string[] = [];
  const combinedSearch: string[] = [];
  const allAttachments: unknown[] = [];
  let totalLatency = 0;

  try {
    for (const input of testCase.input) {
      const turn = await runConversationTurn(client, conversationId, input);
      totalLatency += turn.latencyMs;
      combinedDisplay.push(turn.displayText);
      combinedSearch.push(turn.searchText);
      allAttachments.push(...turn.attachments);
      turns?.push({
        input,
        response: turn.displayText,
        attachments: turn.attachments.length,
        latencyMs: turn.latencyMs,
      });
    }

    const combinedResponse = combinedDisplay.join("\n---\n");
    const combinedSearchText = combinedSearch.join(" ");
    const evaluation = evaluateMultiTurnCase(testCase, combinedSearchText, allAttachments, turns ?? []);

    return {
      id: testCase.id,
      type: testCase.type,
      passed: evaluation.passed,
      latencyMs: totalLatency,
      input: testCase.input,
      actualResponse: combinedResponse,
      details: evaluation.details,
      attachments: allAttachments.length,
      rubric: testCase.rubric,
      turns,
    };
  } catch (error) {
    return {
      id: testCase.id,
      type: testCase.type,
      passed: false,
      latencyMs: totalLatency,
      input: testCase.input,
      actualResponse: combinedDisplay.join("\n---\n"),
      details: error instanceof Error ? error.message : "Unknown multi-turn error.",
      attachments: allAttachments.length,
      rubric: testCase.rubric,
      turns,
    };
  } finally {
    await client.endConversation(conversationId);
  }
}

async function runConversationTurn(
  client: TestClient,
  conversationId: string,
  input: string,
): Promise<{
  displayText: string;
  searchText: string;
  attachments: unknown[];
  latencyMs: number;
}> {
  const startedAt = performance.now();
  await client.sendMessage(conversationId, input);
  const activities = await client.waitForResponse(conversationId, DEFAULT_TIMEOUT_MS);
  const latencyMs = Math.round(performance.now() - startedAt);
  const summary = summarizeActivities(activities);

  if (!summary.displayText && summary.attachments.length === 0) {
    throw new Error(`No bot response received within ${DEFAULT_TIMEOUT_MS}ms.`);
  }

  return {
    displayText: summary.displayText,
    searchText: summary.searchText || summary.displayText,
    attachments: summary.attachments,
    latencyMs,
  };
}

function evaluateTestCase(
  testCase: LoadedTestCase,
  searchText: string,
  attachments: unknown[],
): { passed: boolean; details: string } {
  switch (testCase.type) {
    case "response_match":
      return evaluateResponseMatch(searchText, testCase.expectedResponse ?? "");
    case "attachment_match":
      return evaluateAttachmentMatch(attachments);
    case "topic_match":
      return evaluateTopicMatch(searchText, testCase.expectedTopic ?? "");
    case "generative":
      return evaluateGenerative(searchText, testCase.rubric);
    default:
      return {
        passed: false,
        details: `Unsupported test type: ${testCase.type}`,
      };
  }
}

function evaluateMultiTurnCase(
  testCase: LoadedTestCase,
  searchText: string,
  attachments: unknown[],
  turns: NonNullable<TestResult["turns"]>,
): { passed: boolean; details: string } {
  const baseEvaluation =
    testCase.expectedResponse != null
      ? evaluateResponseMatch(searchText, testCase.expectedResponse)
      : testCase.expectedTopic != null
        ? evaluateTopicMatch(searchText, testCase.expectedTopic)
        : attachments.length > 0
          ? evaluateAttachmentMatch(attachments)
          : {
              passed: turns.every(
                (turn) => turn.response.trim().length > 0 || turn.attachments > 0,
              ),
              details: "Each turn returned a response or attachment.",
            };

  return {
    passed: baseEvaluation.passed,
    details: `${baseEvaluation.details} Completed ${turns.length} conversational turn(s).`,
  };
}

async function loadTestSet(testSetPath: string): Promise<TestSetFile> {
  const fileContents = await readFile(testSetPath, "utf8");
  return JSON.parse(fileContents) as TestSetFile;
}

function parseCliArgs(args: string[]): CliOptions {
  let tokenEndpoint = process.env.TOKEN_ENDPOINT;
  let mock = false;
  let testSetPath: string | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    switch (arg) {
      case "--token-endpoint":
        tokenEndpoint = args[index + 1];
        index += 1;
        break;
      case "--mock":
        mock = true;
        break;
      case "--help":
      case "-h":
        printUsage();
        process.exit(0);
        break;
      default:
        if (!arg.startsWith("--") && !testSetPath) {
          testSetPath = arg;
        }
        break;
    }
  }

  if (!mock && !tokenEndpoint) {
    mock = true;
    console.warn("No token endpoint supplied; defaulting to mock mode.");
  }

  return {
    testSetPath: testSetPath
      ? resolveInputPath(testSetPath)
      : DEFAULT_TEST_SET_PATH,
    tokenEndpoint,
    mock,
  };
}

async function createLiveClient(tokenEndpoint?: string): Promise<ClientSetup> {
  if (!tokenEndpoint) {
    throw new Error("A token endpoint is required when mock mode is disabled.");
  }

  const [tokenResponse, regionalSettings] = await Promise.all([
    fetchToken(tokenEndpoint),
    fetchRegionalChannelSettings(tokenEndpoint),
  ]);

  if (!tokenResponse.token) {
    throw new Error("Token endpoint response did not include a Direct Line token.");
  }

  const directLineDomain =
    normalizeDirectLineDomain(
      regionalSettings?.channelUrlsById?.directline ??
        tokenResponse.channelUrlsById?.directline,
    ) ?? DEFAULT_DIRECT_LINE_DOMAIN;

  return {
    client: new DirectLineTestClient(tokenResponse.token, directLineDomain),
    directLineDomain,
  };
}

async function fetchToken(tokenEndpoint: string): Promise<TokenResponse> {
  const getResponse = await fetch(tokenEndpoint, {
    headers: { Accept: "application/json" },
  });

  if (getResponse.ok) {
    return parseJsonResponse<TokenResponse>(getResponse, tokenEndpoint);
  }

  if (![404, 405, 501].includes(getResponse.status)) {
    const errorText = await getResponse.text();
    throw new Error(
      `Token endpoint request failed (${getResponse.status} ${getResponse.statusText}): ${errorText.slice(0, 200)}`,
    );
  }

  const postResponse = await fetch(tokenEndpoint, {
    method: "POST",
    headers: { Accept: "application/json" },
  });

  if (!postResponse.ok) {
    const errorText = await postResponse.text();
    throw new Error(
      `Token endpoint POST failed (${postResponse.status} ${postResponse.statusText}): ${errorText.slice(0, 200)}`,
    );
  }

  return parseJsonResponse<TokenResponse>(postResponse, tokenEndpoint);
}

async function fetchRegionalChannelSettings(
  tokenEndpoint: string,
): Promise<RegionalChannelSettings | undefined> {
  const regionalSettingsUrl = buildRegionalChannelSettingsUrl(tokenEndpoint);
  if (!regionalSettingsUrl) {
    return undefined;
  }

  try {
    const response = await fetch(regionalSettingsUrl, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      return undefined;
    }

    return parseJsonResponse<RegionalChannelSettings>(
      response,
      regionalSettingsUrl,
    );
  } catch {
    return undefined;
  }
}

function buildRegionalChannelSettingsUrl(
  tokenEndpoint: string,
): string | undefined {
  const url = new URL(tokenEndpoint);
  const apiVersion =
    url.searchParams.get("api-version") ?? "2022-03-01-preview";

  if (!url.pathname.toLowerCase().includes("/powervirtualagents/")) {
    return undefined;
  }

  return `${url.origin}/powervirtualagents/regionalchannelsettings?api-version=${encodeURIComponent(apiVersion)}`;
}

async function parseJsonResponse<T>(
  response: Response,
  source: string,
): Promise<T> {
  const text = await response.text();

  if (!text) {
    return {} as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch (error) {
    throw new Error(
      `Failed to parse JSON from ${source}: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

function summarizeActivities(activities: Activity[]): {
  displayText: string;
  searchText: string;
  attachments: unknown[];
} {
  const displayParts = activities
    .map((activity) => activity.text?.trim())
    .filter((value): value is string => Boolean(value));
  const attachments = activities.flatMap((activity) => activity.attachments ?? []);
  const searchParts = activities.flatMap((activity) => collectSearchableText(activity));

  return {
    displayText: displayParts.join("\n"),
    searchText: Array.from(new Set(searchParts)).join(" ").trim(),
    attachments,
  };
}

function collectSearchableText(activity: Activity): string[] {
  const values = [
    activity.text,
    activity.name,
    ...collectNestedStrings(activity.attachments),
    ...collectNestedStrings(activity.channelData),
    ...collectNestedStrings(activity.value),
  ];

  return values.filter((value): value is string => Boolean(value?.trim()));
}

function collectNestedStrings(value: unknown, bucket: string[] = []): string[] {
  if (typeof value === "string") {
    bucket.push(value);
    return bucket;
  }

  if (!value || typeof value !== "object") {
    return bucket;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectNestedStrings(item, bucket);
    }
    return bucket;
  }

  for (const nestedValue of Object.values(value)) {
    collectNestedStrings(nestedValue, bucket);
  }

  return bucket;
}

function normalizeDirectLineDomain(domain?: string): string | undefined {
  if (!domain) {
    return undefined;
  }

  return domain
    .replace(/\/v3\/directline\/?$/i, "")
    .replace(/\/+$/, "");
}

function resolveInputPath(inputPath: string): string {
  return path.isAbsolute(inputPath)
    ? inputPath
    : path.resolve(process.cwd(), inputPath);
}

function truncate(value: string, maxLength: number): string {
  return value.length <= maxLength ? value : `${value.slice(0, maxLength - 3)}...`;
}

function printUsage(): void {
  console.log(`Usage: tsx src/testing/run-tests.ts [test-set.json] [--token-endpoint <url>] [--mock]`);
}

function buildMockActivities(input: string): Activity[] {
  const lowerInput = input.trim().toLowerCase();

  if (/\b(hello|hi)\b/.test(lowerInput)) {
    return [
      createMockMessage(
        "Welcome! This is the local mock Direct Line agent for Copilot Studio webchat testing.",
      ),
    ];
  }

  if (lowerInput.includes("machine learning") || lowerInput.includes("research")) {
    return [
      {
        ...createMockMessage(
          "I found a few research results related to machine learning.",
        ),
        attachments: [
          {
            contentType: "application/vnd.microsoft.card.adaptive",
            content: {
              type: "AdaptiveCard",
              version: "1.5",
              body: [
                {
                  type: "TextBlock",
                  weight: "Bolder",
                  text: "Machine Learning Research Results",
                },
              ],
            },
          },
        ],
      },
    ];
  }

  if (lowerInput.includes("natural language processing")) {
    return [
      createMockMessage(
        "The FindResearcher topic can help you locate people who work on natural language processing.",
      ),
    ];
  }

  if (lowerInput.includes("transformer")) {
    return [
      createMockMessage(
        "Transformer models rely on attention mechanisms, especially self-attention, and often use an encoder-decoder architecture for sequence tasks.",
      ),
    ];
  }

  return [createMockMessage(`Mock response: ${input}`)];
}

function createMockMessage(text: string): Activity {
  return {
    type: "message",
    text,
    from: {
      id: "mock-bot",
      name: "Mock Copilot Studio Agent",
      role: "bot",
    },
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  void main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
