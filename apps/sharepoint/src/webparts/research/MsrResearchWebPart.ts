/**
 * MSR Research Web Part — Embeds the MSR Research chat in SharePoint.
 *
 * This web part renders an iframe pointing to the MSR Home chat app,
 * passing SharePoint context (site URL, user, page) for contextual responses.
 *
 * For full SPFx development, scaffold with:
 *   npx @microsoft/generator-sharepoint
 * and copy these source files into the generated project.
 */

// SPFx type stubs (real types come from @microsoft/sp-webpart-base)
interface IWebPartContext {
  pageContext: {
    web: { absoluteUrl: string; title: string };
    user: { displayName: string; email: string };
    site: { absoluteUrl: string };
  };
  domElement: HTMLElement;
}

interface IPropertyPaneConfiguration {
  pages: Array<{
    header: { description: string };
    groups: Array<{
      groupName: string;
      groupFields: unknown[];
    }>;
  }>;
}

export interface IMsrResearchWebPartProps {
  chatEndpoint: string;
  agentId: string;
  height: string;
  showHeader: boolean;
}

export default class MsrResearchWebPart {
  public context!: IWebPartContext;
  protected properties!: IMsrResearchWebPartProps;

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: { description: "MSR Research Chat Settings" },
          groups: [
            {
              groupName: "Configuration",
              groupFields: [
                // PropertyPaneTextField("chatEndpoint", { label: "Chat Endpoint URL" }),
                // PropertyPaneTextField("agentId", { label: "Agent ID" }),
                // PropertyPaneDropdown("height", { label: "Height", options: [...] }),
                // PropertyPaneToggle("showHeader", { label: "Show Header" }),
              ],
            },
          ],
        },
      ],
    };
  }

  public render(): void {
    const { chatEndpoint = "https://home.example.com" } =
      this.properties ?? {};
    const { pageContext } = this.context;

    const params = new URLSearchParams({
      embed: "true",
      source: "sharepoint",
      siteUrl: pageContext.web.absoluteUrl,
      siteName: pageContext.web.title,
      userName: pageContext.user.displayName,
      userEmail: pageContext.user.email,
    });

    const height = this.properties?.height ?? "600px";
    const showHeader = this.properties?.showHeader ?? true;

    this.context.domElement.innerHTML = `
      <div style="border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        ${
          showHeader
            ? `
          <div style="background: #742774; color: white; padding: 12px 16px; font-family: 'Segoe UI', sans-serif;">
            <strong>Microsoft Research Assistant</strong>
            <span style="float: right; font-size: 12px; opacity: 0.8;">Powered by Azure AI</span>
          </div>
        `
            : ""
        }
        <iframe
          src="${chatEndpoint}?${params.toString()}"
          style="width: 100%; height: ${height}; border: none;"
          title="MSR Research Chat"
          allow="clipboard-write"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        ></iframe>
      </div>
    `;
  }
}
