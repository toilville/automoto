/**
 * Adaptive Card templates for MSR content types.
 *
 * These templates produce Adaptive Card JSON (schema v1.5) that the M365
 * platform renders natively in Teams, Outlook, and Copilot conversations.
 * They mirror the card types defined in @msr/chat-ui but in JSON format
 * for the Bot Framework CardFactory.
 */

export interface ResearcherCardInput {
  name: string;
  role?: string;
  lab?: string;
  researchAreas?: string[];
  bio?: string;
  avatarUrl?: string;
}

export function createResearcherCard(input: ResearcherCardInput): Record<string, unknown> {
  return {
    type: "AdaptiveCard",
    $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
    version: "1.5",
    body: [
      {
        type: "ColumnSet",
        columns: [
          ...(input.avatarUrl
            ? [{
                type: "Column",
                width: "auto",
                items: [{
                  type: "Image",
                  url: input.avatarUrl,
                  size: "Small",
                  style: "Person",
                }],
              }]
            : []),
          {
            type: "Column",
            width: "stretch",
            items: [
              {
                type: "TextBlock",
                text: input.name,
                weight: "Bolder",
                size: "Medium",
                wrap: true,
              },
              {
                type: "TextBlock",
                text: [input.role, input.lab].filter(Boolean).join(" · "),
                size: "Small",
                isSubtle: true,
                wrap: true,
                spacing: "None",
              },
            ],
          },
        ],
      },
      ...(input.bio
        ? [{
            type: "TextBlock",
            text: input.bio,
            wrap: true,
            size: "Small",
            spacing: "Medium",
          }]
        : []),
      ...(input.researchAreas && input.researchAreas.length > 0
        ? [{
            type: "TextBlock",
            text: `**Areas:** ${input.researchAreas.join(", ")}`,
            wrap: true,
            size: "Small",
            spacing: "Small",
          }]
        : []),
    ],
    actions: [
      {
        type: "Action.Submit",
        title: "Learn More",
        data: { action: "view_researcher", name: input.name },
      },
    ],
  };
}

export interface PublicationCardInput {
  title: string;
  authors?: string[];
  abstract?: string;
  date?: string;
  url?: string;
}

export function createPublicationCard(input: PublicationCardInput): Record<string, unknown> {
  return {
    type: "AdaptiveCard",
    $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
    version: "1.5",
    body: [
      {
        type: "TextBlock",
        text: input.title,
        weight: "Bolder",
        size: "Medium",
        wrap: true,
      },
      ...(input.authors && input.authors.length > 0
        ? [{
            type: "TextBlock",
            text: input.authors.join(", "),
            size: "Small",
            isSubtle: true,
            wrap: true,
            spacing: "None",
          }]
        : []),
      ...(input.date
        ? [{
            type: "TextBlock",
            text: input.date,
            size: "Small",
            isSubtle: true,
            spacing: "None",
          }]
        : []),
      ...(input.abstract
        ? [{
            type: "TextBlock",
            text: input.abstract,
            wrap: true,
            size: "Small",
            spacing: "Medium",
            maxLines: 3,
          }]
        : []),
    ],
    actions: [
      ...(input.url
        ? [{
            type: "Action.OpenUrl",
            title: "View Publication",
            url: input.url,
          }]
        : []),
      {
        type: "Action.Submit",
        title: "Related Papers",
        data: { action: "related_papers", title: input.title },
      },
    ],
  };
}

export interface ProjectCardInput {
  title: string;
  description?: string;
  people?: string[];
  tags?: string[];
  url?: string;
}

export function createProjectCard(input: ProjectCardInput): Record<string, unknown> {
  return {
    type: "AdaptiveCard",
    $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
    version: "1.5",
    body: [
      {
        type: "TextBlock",
        text: input.title,
        weight: "Bolder",
        size: "Medium",
        wrap: true,
      },
      ...(input.description
        ? [{
            type: "TextBlock",
            text: input.description,
            wrap: true,
            size: "Small",
            spacing: "Small",
            maxLines: 3,
          }]
        : []),
      ...(input.people && input.people.length > 0
        ? [{
            type: "TextBlock",
            text: `**People:** ${input.people.slice(0, 5).join(", ")}`,
            wrap: true,
            size: "Small",
            spacing: "Small",
          }]
        : []),
      ...(input.tags && input.tags.length > 0
        ? [{
            type: "TextBlock",
            text: `**Tags:** ${input.tags.join(", ")}`,
            wrap: true,
            size: "Small",
            spacing: "Small",
          }]
        : []),
    ],
    actions: [
      ...(input.url
        ? [{
            type: "Action.OpenUrl",
            title: "View Project",
            url: input.url,
          }]
        : []),
    ],
  };
}
