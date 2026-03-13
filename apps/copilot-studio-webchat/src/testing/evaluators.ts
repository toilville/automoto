export function evaluateResponseMatch(
  actual: string,
  expected: string,
): { passed: boolean; details: string } {
  const normalizedActual = actual.trim().toLowerCase();
  const normalizedExpected = expected.trim().toLowerCase();
  const passed = normalizedActual.includes(normalizedExpected);

  return {
    passed,
    details: passed
      ? `Matched expected text \"${expected}\".`
      : `Expected response to contain \"${expected}\" (case-insensitive).`,
  };
}

export function evaluateAttachmentMatch(
  attachments: unknown[],
): { passed: boolean; details: string } {
  const adaptiveCardCount = attachments.filter((attachment) => {
    if (!attachment || typeof attachment !== "object") {
      return false;
    }

    const contentType = (attachment as { contentType?: unknown }).contentType;
    return contentType === "application/vnd.microsoft.card.adaptive";
  }).length;

  return {
    passed: adaptiveCardCount > 0,
    details:
      adaptiveCardCount > 0
        ? `Found ${adaptiveCardCount} adaptive card attachment(s).`
        : "Expected at least one adaptive card attachment in the bot response.",
  };
}

export function evaluateTopicMatch(
  response: string,
  expectedTopic: string,
): { passed: boolean; details: string } {
  const normalizedResponse = normalizeForComparison(response);
  const normalizedTopic = normalizeForComparison(expectedTopic);
  const tokens = Array.from(new Set(splitTopicTokens(expectedTopic)));
  const matchedTokens = tokens.filter((token) => normalizedResponse.includes(token));

  const passed =
    normalizedResponse.includes(normalizedTopic) ||
    matchedTokens.length === tokens.length ||
    (tokens.length <= 2 && matchedTokens.length >= 1);

  return {
    passed,
    details: passed
      ? `Topic heuristic matched ${matchedTokens.length}/${tokens.length} token(s): ${matchedTokens.join(", ") || normalizedTopic}.`
      : `Expected topic hint \"${expectedTopic}\" was not found in the response.`,
  };
}

export function evaluateGenerative(
  response: string,
  rubric?: string,
): { passed: boolean; details: string } {
  const rubricText = rubric ? ` Rubric: ${rubric}` : "";
  const preview = response.trim() || "(no response captured)";

  return {
    passed: true,
    details: `Manual review required.${rubricText} Response: ${preview}`,
  };
}

function normalizeForComparison(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function splitTopicTokens(value: string): string[] {
  return normalizeForComparison(value)
    .split(" ")
    .filter((token) => token.length > 2);
}
