import { getDisplayCreatedAt } from "@/lib/notes/display-created-at";
import {
  Note,
  NotesSortDirection,
  NotesSortField,
} from "@/lib/notes/types";

export type GroupedNotes = Record<string, Note[]>;

function getDateCategory(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  if (date >= today) return "today";
  if (date >= yesterday) return "yesterday";
  if (date >= sevenDaysAgo) return "7";
  if (date >= thirtyDaysAgo) return "30";
  return "older";
}

export function groupNotesByCategory(notes: Note[], pinnedNotes: Set<string>) {
  const groupedNotes: GroupedNotes = {
    pinned: [],
  };

  // Calculate date boundaries once before the loop
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  notes.forEach((note) => {
    if (pinnedNotes.has(note.slug)) {
      groupedNotes.pinned.push(note);
      return;
    }

    let category = note.category ?? "older";
    if (!note.public) {
      const createdDate = new Date(note.created_at);

      if (createdDate.toDateString() === today.toDateString()) {
        category = "today";
      } else if (createdDate.toDateString() === yesterday.toDateString()) {
        category = "yesterday";
      } else if (createdDate > sevenDaysAgo) {
        category = "7";
      } else if (createdDate > thirtyDaysAgo) {
        category = "30";
      } else {
        category = "older";
      }
    }

    if (!groupedNotes[category]) {
      groupedNotes[category] = [];
    }
    groupedNotes[category].push(note);
  });

  return groupedNotes;
}

export function sortGroupedNotes(groupedNotes: GroupedNotes) {
  Object.keys(groupedNotes).forEach((category) => {
    groupedNotes[category].sort((a, b) =>
      b.created_at.localeCompare(a.created_at)
    );
  });
}

export function groupNotesByTimestamp(
  notes: Note[],
  pinnedNotes: Set<string>,
  selectTimestamp: (note: Note) => string,
): GroupedNotes {
  const groupedNotes: GroupedNotes = {
    pinned: [],
  };

  notes.forEach((note) => {
    if (pinnedNotes.has(note.slug)) {
      groupedNotes.pinned.push(note);
      return;
    }

    const category = getDateCategory(selectTimestamp(note));
    if (!groupedNotes[category]) {
      groupedNotes[category] = [];
    }
    groupedNotes[category].push(note);
  });

  return groupedNotes;
}

export function sortNotes(
  notes: Note[],
  field: NotesSortField,
  direction: NotesSortDirection,
): Note[] {
  return [...notes].sort((firstNote, secondNote) => {
    let comparison: number;

    if (field === "title") {
      comparison = firstNote.title.localeCompare(secondNote.title, undefined, {
        sensitivity: "base",
      });
      return direction === "newest" ? comparison : -comparison;
    }

    const getTimestamp =
      field === "created"
        ? (note: Note) => note.created_at
        : (note: Note) => getDisplayCreatedAt(note);
    comparison = getTimestamp(firstNote).localeCompare(
      getTimestamp(secondNote),
    );

    if (comparison === 0) {
      comparison = firstNote.title.localeCompare(secondNote.title, undefined, {
        sensitivity: "base",
      });
    }

    return direction === "newest" ? -comparison : comparison;
  });
}

/**
 * The one-line preview under a note's title: the markdown with its syntax
 * removed. Only syntax goes; a hyphen inside a word ("Smith-Kipnis",
 * "AI-native", "0-1") is prose and stays, which the old blanket strip of every
 * `-` and `_` got wrong.
 */
export function getNotePreviewText(content: string): string {
  return content
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\[[ x]\]/g, "")
    // Line-leading syntax: headings, blockquotes, list markers
    .replace(/^[ \t]{0,3}#{1,6}[ \t]+/gm, "")
    .replace(/^[ \t]*>[ \t]?/gm, "")
    .replace(/^[ \t]*(?:[-*+]|\d+\.)[ \t]+/gm, "")
    .replace(/^[ \t]*(?:-{3,}|\*{3,}|_{3,})[ \t]*$/gm, "")
    // Inline syntax: emphasis, strikethrough, code. Underscores only count as
    // emphasis at a word's edge, so snake_case survives.
    .replace(/[*~`]/g, "")
    .replace(/(^|[^\p{L}\p{N}])_+(?=[\p{L}\p{N}])/gu, "$1")
    .replace(/(?<=[\p{L}\p{N}])_+(?=[^\p{L}\p{N}]|$)/gu, "")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
