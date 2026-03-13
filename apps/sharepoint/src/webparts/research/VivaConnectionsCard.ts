/**
 * MSR Research — Viva Connections Adaptive Card Extension
 *
 * Renders a dashboard card in Viva Connections that shows research highlights
 * and links to the full MSR chat experience.
 *
 * For full ACE development, use the SPFx Adaptive Card Extension template:
 *   npx @microsoft/generator-sharepoint --component-type extension --extension-type AdaptiveCardExtension
 */

export interface IMsrResearchAceProps {
  dataApiUrl: string;
  maxItems: number;
}

interface IResearchHighlight {
  title: string;
  area: string;
  url: string;
}

export const cardTemplate = {
  type: "AdaptiveCard",
  version: "1.5",
  body: [
    {
      type: "TextBlock",
      text: "Microsoft Research",
      weight: "Bolder",
      size: "Medium",
    },
    {
      type: "TextBlock",
      text: "Latest research highlights",
      isSubtle: true,
      spacing: "None",
    },
    {
      type: "Container",
      id: "highlights-container",
      items: [] as unknown[],
    },
  ],
  actions: [
    {
      type: "Action.OpenUrl",
      title: "Open Research Chat",
      url: "https://home.example.com",
    },
    {
      type: "Action.Submit",
      title: "Refresh",
      data: { action: "refresh" },
    },
  ],
};

export const quickViewTemplate = {
  type: "AdaptiveCard",
  version: "1.5",
  body: [
    {
      type: "TextBlock",
      text: "Research Highlights",
      weight: "Bolder",
      size: "Large",
    },
    {
      type: "TextBlock",
      text: "Ask the MSR Research Assistant about any topic:",
      wrap: true,
    },
    {
      type: "Input.Text",
      id: "searchQuery",
      placeholder: "e.g., machine learning, NLP, quantum computing...",
    },
  ],
  actions: [
    {
      type: "Action.OpenUrl",
      title: "Search in MSR Chat",
      url: "https://home.example.com?query=${searchQuery}",
    },
  ],
};

export default class MsrResearchAce {
  protected properties!: IMsrResearchAceProps;

  public get cardSize(): string {
    return "Medium";
  }

  public get title(): string {
    return "MSR Research";
  }

  public get iconProperty(): string {
    return "Search";
  }

  public async fetchHighlights(): Promise<IResearchHighlight[]> {
    const url =
      this.properties?.dataApiUrl ??
      "https://msr-data-api.azurewebsites.net";
    try {
      const res = await fetch(`${url}/api/research-areas`);
      const data = (await res.json()) as { areas: IResearchHighlight[] };
      return data.areas.slice(0, this.properties?.maxItems ?? 3);
    } catch {
      return [
        {
          title: "Explore Research",
          area: "All Areas",
          url: "https://www.microsoft.com/research",
        },
      ];
    }
  }
}
