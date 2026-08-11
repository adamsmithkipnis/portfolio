// Content model types. See docs/CONTENT-MODEL.md.
//
// The filesystem under content/ is the information architecture: a build-time
// walk produces the tree Finder renders, so adding a project is creating a folder.

export interface Outcome {
  label: string;
  value: string;
}

export interface ProjectMeta {
  title: string;
  role: string;
  org: string;
  year: number;
  duration?: string;
  team?: string;
  tags: string[];
  summary: string;
  outcomes?: Outcome[];
  featured?: boolean;
  /** Redacts org name and artifacts in the UI. */
  confidential?: boolean;
}

export type NodeKind = "folder" | "document" | "image" | "pdf";

export interface ContentNode {
  /** Path segment, e.g. "01-problem" */
  slug: string;
  /** Display name with prefix stripped, e.g. "Problem" */
  name: string;
  /** Route path, e.g. "/finder/work/design-system-foundation" */
  path: string;
  kind: NodeKind;
  /** Present on project folders only — drives Get Info. */
  meta?: ProjectMeta;
  children?: ContentNode[];
  /** Bytes; real for assets, derived from word count for MDX. */
  size: number;
  modified: string;
  /** Markdown body for document nodes. Absent on folders and assets. */
  body?: string;
  /** Public URL for image and pdf nodes. */
  assetUrl?: string;
}
