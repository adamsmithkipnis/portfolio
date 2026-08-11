// Frontmatter parsing for the content walk. Separate from build-content.mjs so it can
// be unit tested — that script runs main() on import.
//
// A deliberately small YAML subset (see docs/CONTENT-MODEL.md):
//   key: scalar
//   key: [a, b, c]
//   key:
//     - label: x
//       value: y
// Anything richer belongs in the body, not the metadata.

export function parseScalar(raw) {
  const value = raw.trim().replace(/^["'](.*)["']$/s, "$1");
  if (value === "true") return true;
  if (value === "false") return false;
  if (value !== "" && !Number.isNaN(Number(value)) && /^-?\d+(\.\d+)?$/.test(value)) {
    return Number(value);
  }
  return value;
}

export function parseFrontmatter(source) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(source);
  if (!match) return { data: {}, body: source };

  const data = {};
  const lines = match[1].split(/\r?\n/);
  let listKey = null;

  for (const line of lines) {
    if (!line.trim() || line.trim().startsWith("#")) continue;

    // "  - label: x" starts an object in a list; "    value: y" extends the last one
    const listItem = /^\s*-\s+(.*)$/.exec(line);
    if (listItem && listKey) {
      const inner = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(listItem[1]);
      data[listKey].push(inner ? { [inner[1]]: parseScalar(inner[2]) } : parseScalar(listItem[1]));
      continue;
    }

    const indented = /^\s+([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (indented && listKey && data[listKey].length > 0) {
      const last = data[listKey][data[listKey].length - 1];
      if (last && typeof last === "object") {
        last[indented[1]] = parseScalar(indented[2]);
        continue;
      }
    }

    const pair = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (!pair) continue;
    const [, key, rest] = pair;

    if (rest.trim() === "") {
      data[key] = [];
      listKey = key;
      continue;
    }

    listKey = null;
    const inlineList = /^\[(.*)\]$/.exec(rest.trim());
    data[key] = inlineList
      ? inlineList[1].split(",").map((entry) => parseScalar(entry)).filter((entry) => entry !== "")
      : parseScalar(rest);
  }

  return { data, body: source.slice(match[0].length) };
}

/** "01-problem" -> "Problem"; "design-system-foundation" -> "Design System Foundation" */
export function displayName(slug) {
  return slug
    .replace(/^\d+-/, "")
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
