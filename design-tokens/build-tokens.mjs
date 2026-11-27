#!/usr/bin/env node
/**
 * build-tokens.mjs
 *
 * Turns an extracted token file into CSS custom properties and a Tailwind
 * theme extension, one platform at a time:
 *
 *   node build-tokens.mjs          macOS: tokens.json (extract-tokens.swift)
 *                                  -> tokens.css + tailwind.tokens.js
 *   node build-tokens.mjs ios      iOS: tokens.ios.json (extract-tokens-ios.swift)
 *                                  -> tokens.ios.css + tailwind.tokens.ios.js
 *
 * Both platforms use the same variable grammar (--color-*, --text-*-size, ...),
 * so a component reads `var(--color-label)` and gets the value of whichever
 * shell it is rendered in. macOS values sit on :root; iOS values are scoped to
 * [data-shell="ios"], which the iOS shell sets on its root element.
 *
 * Options (for testing):  --in <tokens file>   --out <directory>
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
const option = (name) => {
  const i = args.indexOf(name);
  return i === -1 ? undefined : args[i + 1];
};
const platform = args[0] && !args[0].startsWith("--") ? args[0] : "macos";
if (platform !== "macos" && platform !== "ios") {
  console.error(`unknown platform "${platform}" — expected "macos" or "ios"`);
  process.exit(1);
}

const defaultInput = platform === "ios" ? "tokens.ios.json" : "tokens.json";
const inputPath = option("--in") ?? join(here, defaultInput);
const outDir = option("--out") ?? here;

let tokens;
try {
  tokens = JSON.parse(readFileSync(inputPath, "utf8"));
} catch (error) {
  console.error(`could not read ${inputPath}: ${error.message}`);
  if (platform === "ios") {
    console.error(
      "tokens.ios.json comes from extract-tokens-ios.swift, run in the iOS Simulator. See README.md."
    );
  }
  process.exit(1);
}

const kebab = (s) => s.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();

/**
 * Starting-point blur radii, in px, keyed by macOS material.
 *
 * These are NOT extracted — NSVisualEffectView's backdrop blur is composited
 * by the window server and cannot be read programmatically. They are
 * hand-seeded approximations meant to be tuned visually against a real Tahoe
 * window. See README.md for the calibration procedure.
 */
const BLUR_SEED = {
  titlebar: 30, selection: 20, menu: 50, popover: 50, sidebar: 50,
  headerView: 30, sheet: 50, windowBackground: 30, hudWindow: 50,
  fullScreenUI: 30, toolTip: 50, contentBackground: 30,
  underWindowBackground: 50, underPageBackground: 30,
};

/**
 * iOS values no public API exposes. NOT extracted: hand-seeded starting points
 * to be tuned by eye against a real iPhone, and never to be quoted as measured.
 * Liquid Glass in particular is composited by the render server.
 */
const IOS_SEED = {
  "--ios-glass-blur": "24px",
  "--ios-glass-saturate": "180%",
  "--ios-icon-size": "60px",
  "--ios-icon-radius": "22.5%",
};

/** Controls whose width is fixed by the system rather than by their content. */
const FIXED_WIDTH_CONTROLS = new Set(["switch"]);

/* ------------------------------------------------------------------ CSS -- */

function colorVars(scheme, indent = "  ") {
  const lines = [];
  for (const [name, v] of Object.entries(tokens.colors[scheme] ?? {})) {
    if (Array.isArray(v)) {
      v.forEach((c, i) => lines.push(`${indent}--color-${kebab(name)}-${i}: ${c.css};`));
    } else if (v.css) {
      lines.push(`${indent}--color-${kebab(name)}: ${v.css};`);
    }
  }
  return lines.join("\n");
}

/** Only the colors that differ from `base`, so an elevated scope stays small. */
function colorOverrides(scheme, base, indent = "  ") {
  const lines = [];
  for (const [name, v] of Object.entries(tokens.colors[scheme] ?? {})) {
    if (v.css && v.css !== tokens.colors[base]?.[name]?.css) {
      lines.push(`${indent}--color-${kebab(name)}: ${v.css};`);
    }
  }
  return lines.join("\n");
}

function materialVars(scheme) {
  const lines = [];
  for (const [name, m] of Object.entries(tokens.materials?.[scheme] ?? {})) {
    if (!m?.tint) continue;
    lines.push(`  --material-${kebab(name)}-tint: ${m.tint.css};`);
    lines.push(`  --material-${kebab(name)}-blur: ${BLUR_SEED[name] ?? 30}px;`);
  }
  return lines.join("\n");
}

function typeVars() {
  const lines = [];
  for (const [name, t] of Object.entries(tokens.typography.ramp)) {
    const k = kebab(name);
    lines.push(`  --text-${k}-size: ${t.sizePt}px;`);
    lines.push(`  --text-${k}-line: ${t.lineHeightPt}px;`);
    lines.push(`  --text-${k}-weight: ${t.cssWeight};`);
  }
  lines.push(`  --font-sans: ${tokens.typography.recommendedCSSStack};`);
  lines.push(`  --font-mono: ${tokens.typography.recommendedMonoCSSStack};`);
  return lines.join("\n");
}

function metricVars() {
  const lines = [];
  for (const [control, sizes] of Object.entries(tokens.controlMetrics)) {
    for (const [size, m] of Object.entries(sizes)) {
      lines.push(`  --${kebab(control)}-${size}-height: ${m.heightPt}px;`);
      if (FIXED_WIDTH_CONTROLS.has(control) && m.widthPt) {
        lines.push(`  --${kebab(control)}-${size}-width: ${m.widthPt}px;`);
      }
    }
  }
  return lines.join("\n");
}

function macosCss() {
  return `/* AUTO-GENERATED by build-tokens.mjs — do not edit by hand.
 * Source: ${tokens._meta.osVersion} via extract-tokens.swift
 * Generated: ${tokens._meta.generatedAt}
 *
 * Blur radii are hand-seeded approximations, not extracted values.
 * Calibrate them visually — see README.md.
 */

:root {
${typeVars()}

${metricVars()}

  /* light (default) */
${colorVars("light")}

${materialVars("light")}
}

@media (prefers-color-scheme: dark) {
  :root {
${colorVars("dark")}

${materialVars("dark")}
  }
}

/* Explicit overrides win over the media query in both directions. */
:root[data-theme="dark"] {
${colorVars("dark")}

${materialVars("dark")}
}

:root[data-theme="light"] {
${colorVars("light")}

${materialVars("light")}
}

/* Glass surface helper. Pair a material tint with its blur.
 * Usage: <div class="tahoe-glass" style="--m: sidebar"> ... */
.tahoe-glass {
  backdrop-filter: blur(var(--glass-blur, 30px)) saturate(180%);
  -webkit-backdrop-filter: blur(var(--glass-blur, 30px)) saturate(180%);
  background-color: var(--glass-tint, var(--color-window-background));
}
`;
}

/**
 * iOS follows the app's theme class (next-themes sets `.dark` on <html>), not
 * a media query, so the simulated phone and the rest of the site agree.
 * `data-ios-level="elevated"` marks content presented above the base level
 * (sheets, popovers), which iOS gives lighter backgrounds in dark mode.
 */
function iosCss() {
  const seed = Object.entries(IOS_SEED)
    .map(([name, value]) => `  ${name}: ${value};`)
    .join("\n");
  const scope = '[data-shell="ios"]';
  const elevated = '[data-ios-level="elevated"]';

  return `/* AUTO-GENERATED by build-tokens.mjs — do not edit by hand.
 * Source: ${tokens._meta.osVersion} (${tokens._meta.device ?? "unknown device"}) via extract-tokens-ios.swift
 * Generated: ${tokens._meta.generatedAt}
 *
 * The --ios-* values are hand-seeded approximations, not extracted values.
 * Tune them by eye against a real iPhone — see README.md.
 */

${scope} {
${typeVars()}

${metricVars()}

  /* hand-seeded, not extracted */
${seed}

  /* light (default) */
${colorVars("light")}
}

.dark ${scope} {
${colorVars("dark")}
}

${scope} ${elevated} {
${colorOverrides("lightElevated", "light")}
}

.dark ${scope} ${elevated} {
${colorOverrides("darkElevated", "dark")}
}
`;
}

/* ------------------------------------------------------------- Tailwind -- */

const twColors = {};
for (const name of Object.keys(tokens.colors.light)) {
  if (Array.isArray(tokens.colors.light[name])) continue;
  twColors[kebab(name)] = `var(--color-${kebab(name)})`;
}

const twFontSize = {};
for (const [name, t] of Object.entries(tokens.typography.ramp)) {
  twFontSize[kebab(name)] = [
    `var(--text-${kebab(name)}-size)`,
    {
      lineHeight: `var(--text-${kebab(name)}-line)`,
      fontWeight: `var(--text-${kebab(name)}-weight)`,
    },
  ];
}

const twHeight = {};
for (const [control, sizes] of Object.entries(tokens.controlMetrics)) {
  for (const size of Object.keys(sizes)) {
    twHeight[`${kebab(control)}-${size}`] =
      `var(--${kebab(control)}-${size}-height)`;
  }
}

const cssFile = platform === "ios" ? "tokens.ios.css" : "tokens.css";
const twFile = platform === "ios" ? "tailwind.tokens.ios.js" : "tailwind.tokens.js";
const importName = platform === "ios" ? "ios" : "tahoe";

const tw = `// AUTO-GENERATED by build-tokens.mjs — do not edit by hand.
// Source: ${tokens._meta.osVersion}
//
// Usage in tailwind.config.ts:
//   import ${importName} from "./design-tokens/${twFile}";
//   export default { theme: { extend: ${importName} } };

export default ${JSON.stringify(
  {
    colors: twColors,
    fontSize: twFontSize,
    height: twHeight,
    fontFamily: {
      sans: ["var(--font-sans)"],
      mono: ["var(--font-mono)"],
    },
  },
  null,
  2
)};
`;

writeFileSync(join(outDir, cssFile), platform === "ios" ? iosCss() : macosCss());
writeFileSync(join(outDir, twFile), tw);

const nColors = Object.keys(twColors).length;
const nMaterials = Object.keys(tokens.materials?.light ?? {}).length;
console.log(
  `✓ ${cssFile} + ${twFile}\n` +
    `  ${nColors} colors × ${Object.keys(tokens.colors).length} schemes · ${nMaterials} materials · ` +
    `${Object.keys(tokens.typography.ramp).length} type styles`
);
