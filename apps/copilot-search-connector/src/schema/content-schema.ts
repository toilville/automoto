/**
 * Graph Connector schema definitions for Automoto content types.
 *
 * Defines the external connection schema that tells Microsoft Search / Copilot
 * how to interpret and display Automoto content items. Maps to the card types
 * defined in @automoto/chat-ui (publications, researchers, projects, etc.).
 *
 * Reference: https://learn.microsoft.com/graph/connecting-external-content-manage-schema
 */

/** Schema property definition for the Graph connector. */
interface SchemaProperty {
  name: string;
  type: "String" | "DateTime" | "Boolean" | "Int64" | "Double" | "StringCollection";
  isSearchable?: boolean;
  isRetrievable?: boolean;
  isQueryable?: boolean;
  isRefinable?: boolean;
  labels?: string[];
  aliases?: string[];
}

/**
 * The unified schema for all Automoto content types.
 * Each item has a `contentType` property to distinguish between types.
 */
export const AUTOMOTO_CONTENT_SCHEMA: SchemaProperty[] = [
  // Common fields
  {
    name: "contentType",
    type: "String",
    isSearchable: false,
    isRetrievable: true,
    isQueryable: true,
    isRefinable: true,
  },
  {
    name: "title",
    type: "String",
    isSearchable: true,
    isRetrievable: true,
    isQueryable: true,
    labels: ["title"],
  },
  {
    name: "description",
    type: "String",
    isSearchable: true,
    isRetrievable: true,
  },
  {
    name: "url",
    type: "String",
    isRetrievable: true,
    labels: ["url"],
  },
  {
    name: "lastModifiedDateTime",
    type: "DateTime",
    isRetrievable: true,
    isQueryable: true,
    isRefinable: true,
    labels: ["lastModifiedDateTime"],
  },
  {
    name: "createdBy",
    type: "String",
    isSearchable: true,
    isRetrievable: true,
    labels: ["createdBy"],
  },

  // Publication-specific
  {
    name: "authors",
    type: "StringCollection",
    isSearchable: true,
    isRetrievable: true,
  },
  {
    name: "abstract",
    type: "String",
    isSearchable: true,
    isRetrievable: true,
  },
  {
    name: "publicationDate",
    type: "DateTime",
    isRetrievable: true,
    isQueryable: true,
    isRefinable: true,
  },

  // Researcher-specific
  {
    name: "researcherName",
    type: "String",
    isSearchable: true,
    isRetrievable: true,
  },
  {
    name: "role",
    type: "String",
    isRetrievable: true,
    isRefinable: true,
  },
  {
    name: "lab",
    type: "String",
    isSearchable: true,
    isRetrievable: true,
    isRefinable: true,
  },
  {
    name: "researchAreas",
    type: "StringCollection",
    isSearchable: true,
    isRetrievable: true,
    isRefinable: true,
  },

  // Project-specific
  {
    name: "projectStatus",
    type: "String",
    isRetrievable: true,
    isRefinable: true,
  },
  {
    name: "tags",
    type: "StringCollection",
    isSearchable: true,
    isRetrievable: true,
    isRefinable: true,
  },
];

/** Connection configuration for the Graph external connection. */
export function getConnectionConfig() {
  return {
    id: process.env.CONNECTION_ID ?? "researchContent",
    name: process.env.CONNECTION_NAME ?? "Research Content",
    description:
      process.env.CONNECTION_DESCRIPTION ??
      "Research publications, researchers, projects, and news",
  };
}
