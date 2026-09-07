import {
  getStoredTextEditDocumentPaths,
  getTextEditContent,
  isTextEditPathHidden,
} from "@/lib/file-storage";
import {
  getContentChildren,
  getContentDirectoryPaths,
  isContentPath,
  WORK_DIR,
} from "@/lib/content-files";
import { hasWorkItems } from "@/lib/work-links";

export const HOME_DIR = "/Users/adamsmithkipnis";
export const PROJECTS_DIR = `${HOME_DIR}/Projects`;
export { WORK_DIR };
const TEXT_FILE_EXTENSIONS = new Set(["txt", "md", "markdown", "json", "js", "jsx", "ts", "tsx", "css", "html", "xml", "yaml", "yml"]);

export type DocumentAppId = "textedit" | "preview";
export type LocalSampleFileKind = "text" | "preview";

export interface LocalFinderItem {
  name: string;
  type: "file" | "dir";
  path: string;
}

interface LocalSampleFile {
  assetUrl?: string;
  content?: string;
  directoryPath: string;
  kind: LocalSampleFileKind;
  path: string;
}

interface DocumentAppConfig {
  finderTargetPath: string;
  localFileKind: LocalSampleFileKind;
}

export const DOCUMENT_APP_CONFIGS: Record<DocumentAppId, DocumentAppConfig> = {
  textedit: {
    finderTargetPath: `${HOME_DIR}/Documents`,
    localFileKind: "text",
  },
  preview: {
    finderTargetPath: `${HOME_DIR}/Desktop`,
    localFileKind: "preview",
  },
};

const LOCAL_SAMPLE_FILES: LocalSampleFile[] = [
  {
    content: "hello world!",
    directoryPath: `${HOME_DIR}/Documents`,
    kind: "text",
    path: `${HOME_DIR}/Documents/hello.md`,
  },
  {
    assetUrl: "/documents/Adam%20Smith-Kipnis%20-%20Resume.pdf",
    directoryPath: `${HOME_DIR}/Desktop`,
    kind: "preview",
    path: `${HOME_DIR}/Desktop/Adam Smith-Kipnis - Resume.pdf`,
  },
  {
    assetUrl: "/documents/Windows%2C%20The%20Next%20Killer%20Application%20on%20the%20Internet.pdf",
    directoryPath: `${HOME_DIR}/Downloads`,
    kind: "preview",
    path: `${HOME_DIR}/Downloads/Windows, The Next Killer Application on the Internet.pdf`,
  },
];

/** Static items for a home folder, from the sample files that live in it. */
function sampleItemsIn(directoryPath: string): LocalFinderItem[] {
  return LOCAL_SAMPLE_FILES.filter((file) => file.directoryPath === directoryPath).map((file) => ({
    name: file.path.split("/").pop() ?? file.path,
    type: "file" as const,
    path: file.path,
  }));
}

const LOCAL_SAMPLE_FILE_MAP = Object.fromEntries(
  LOCAL_SAMPLE_FILES.map((file) => [file.path, file])
) as Record<string, LocalSampleFile>;

export const LOCAL_FINDER_FILES: Record<string, LocalFinderItem[]> = {
  [HOME_DIR]: [
    { name: "Desktop", type: "dir", path: `${HOME_DIR}/Desktop` },
    { name: "Documents", type: "dir", path: `${HOME_DIR}/Documents` },
    { name: "Downloads", type: "dir", path: `${HOME_DIR}/Downloads` },
    // The folder is ~/Projects; the label says what it holds. It mirrors
    // GitHub, and "Projects" alone read as a sibling of Work.
    { name: "GitHub Projects", type: "dir", path: `${HOME_DIR}/Projects` },
    // Same gate as the Finder sidebar, so the two can never disagree about
    // whether ~/Work exists.
    ...(hasWorkItems() ? [{ name: "Work", type: "dir" as const, path: WORK_DIR }] : []),
  ],
  [`${HOME_DIR}/Desktop`]: sampleItemsIn(`${HOME_DIR}/Desktop`),
  [`${HOME_DIR}/Documents`]: sampleItemsIn(`${HOME_DIR}/Documents`),
  [`${HOME_DIR}/Downloads`]: sampleItemsIn(`${HOME_DIR}/Downloads`),
};

export function getDocumentAppFinderTarget(appId: DocumentAppId): string {
  return DOCUMENT_APP_CONFIGS[appId].finderTargetPath;
}

export function getLocalTextFileContent(filePath: string): string | null {
  const storedContent = getTextEditContent(filePath);
  if (storedContent !== undefined) return storedContent;
  if (isTextEditPathHidden(filePath)) return null;
  const file = LOCAL_SAMPLE_FILE_MAP[filePath];
  return file?.kind === "text" ? (file.content ?? null) : null;
}

export function getLocalFinderFiles(directoryPath: string): LocalFinderItem[] {
  // Content keeps its authored order — numeric filename prefixes are the reading
  // sequence, so the alphabetical sort below would be wrong here.
  if (isContentPath(directoryPath)) return getContentChildren(directoryPath);

  const staticItems = (LOCAL_FINDER_FILES[directoryPath] ?? []).filter(
    (item) => !isTextEditPathHidden(item.path)
  );
  const storedItems = getStoredTextEditDocumentPaths()
    .filter((path) => path.split("/").slice(0, -1).join("/") === directoryPath)
    .map((path) => ({
      name: path.split("/").pop() ?? path,
      type: "file" as const,
      path,
    }));

  return [...staticItems, ...storedItems]
    .filter((item, index, items) => items.findIndex((candidate) => candidate.path === item.path) === index)
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
}

export function getAllLocalFinderFiles(): Record<string, LocalFinderItem[]> {
  return Object.fromEntries(
    [...Object.keys(LOCAL_FINDER_FILES), ...getContentDirectoryPaths()].map((directoryPath) => [
      directoryPath,
      getLocalFinderFiles(directoryPath),
    ])
  );
}

export function getKnownTextEditDocumentPaths(): string[] {
  const staticTextPaths = LOCAL_SAMPLE_FILES
    .filter((file) => file.kind === "text" && !isTextEditPathHidden(file.path))
    .map((file) => file.path);
  return [...staticTextPaths, ...getStoredTextEditDocumentPaths()];
}

export function getLocalPreviewAssetUrl(filePath: string): string | null {
  const file = LOCAL_SAMPLE_FILE_MAP[filePath];
  return file?.kind === "preview" ? (file.assetUrl ?? null) : null;
}

export function isSupportedDocumentAppPath(appId: DocumentAppId, filePath: string): boolean {
  if (!filePath) return false;
  if (appId === "textedit" && filePath.startsWith(`${PROJECTS_DIR}/`)) return true;

  if (appId === "textedit") {
    if (getStoredTextEditDocumentPaths().includes(filePath)) return true;
    if (isTextEditPathHidden(filePath)) return false;
    const extension = filePath.split(".").pop()?.toLowerCase() ?? "";
    if (filePath.startsWith(`${HOME_DIR}/Documents/`) && TEXT_FILE_EXTENSIONS.has(extension)) {
      return true;
    }
  }

  const file = LOCAL_SAMPLE_FILE_MAP[filePath];
  return file?.kind === DOCUMENT_APP_CONFIGS[appId].localFileKind;
}

export function isSupportedTextEditPath(filePath: string): boolean {
  return isSupportedDocumentAppPath("textedit", filePath);
}
