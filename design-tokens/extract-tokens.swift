#!/usr/bin/env swift
//
//  extract-tokens.swift
//  Dumps macOS Tahoe system design tokens to JSON by querying AppKit directly.
//
//  Usage:  swift extract-tokens.swift > tokens.json
//
//  Extracted from the running OS, so values are exact for THIS macOS version.
//  Re-run after a macOS update to pick up changes.
//
//  CAVEAT on materials: NSVisualEffectView's backdrop blur is composited by the
//  window server, not drawn by the view, so offscreen capture yields only the
//  material's tint layer. Blur RADIUS is not extractable and must be matched
//  visually. See README.md.
//

import AppKit
import Foundation

// MARK: - Helpers

struct RGBA {
    let r: Int, g: Int, b: Int, a: Double

    init?(_ color: NSColor) {
        guard let s = color.usingColorSpace(.sRGB) else { return nil }
        r = Int(round(s.redComponent * 255))
        g = Int(round(s.greenComponent * 255))
        b = Int(round(s.blueComponent * 255))
        a = (s.alphaComponent * 1000).rounded() / 1000
    }

    var hex: String { String(format: "#%02X%02X%02X", r, g, b) }
    var css: String {
        a < 0.999 ? "rgb(\(r) \(g) \(b) / \(a))" : hex
    }
    var dict: [String: Any] {
        ["hex": hex, "r": r, "g": g, "b": b, "a": a, "css": css]
    }
}

func sample(_ color: NSColor) -> [String: Any] {
    RGBA(color)?.dict ?? ["error": "not convertible to sRGB"]
}

// MARK: - Color set

let semanticColors: [(String, NSColor)] = [
    // Backgrounds
    ("windowBackground",            .windowBackgroundColor),
    ("underPageBackground",         .underPageBackgroundColor),
    ("controlBackground",           .controlBackgroundColor),
    ("textBackground",              .textBackgroundColor),
    ("selectedTextBackground",      .selectedTextBackgroundColor),
    ("unemphasizedSelectedTextBackground", .unemphasizedSelectedTextBackgroundColor),
    ("selectedContentBackground",   .selectedContentBackgroundColor),
    ("unemphasizedSelectedContentBackground", .unemphasizedSelectedContentBackgroundColor),

    // Content / labels
    ("label",                       .labelColor),
    ("secondaryLabel",              .secondaryLabelColor),
    ("tertiaryLabel",               .tertiaryLabelColor),
    ("quaternaryLabel",             .quaternaryLabelColor),
    ("text",                        .textColor),
    ("selectedText",                .selectedTextColor),
    ("placeholderText",             .placeholderTextColor),
    ("headerText",                  .headerTextColor),

    // Controls
    ("control",                     .controlColor),
    ("controlText",                 .controlTextColor),
    ("disabledControlText",         .disabledControlTextColor),
    ("selectedControl",             .selectedControlColor),
    ("selectedControlText",         .selectedControlTextColor),
    ("controlAccent",               .controlAccentColor),
    ("keyboardFocusIndicator",      .keyboardFocusIndicatorColor),

    // Separators / structure
    ("separator",                   .separatorColor),
    ("grid",                        .gridColor),
    ("shadow",                      .shadowColor),

    // Semantic
    ("link",                        .linkColor),
    ("findHighlight",               .findHighlightColor),

    // System palette
    ("systemRed",                   .systemRed),
    ("systemOrange",                .systemOrange),
    ("systemYellow",                .systemYellow),
    ("systemGreen",                 .systemGreen),
    ("systemMint",                  .systemMint),
    ("systemTeal",                  .systemTeal),
    ("systemCyan",                  .systemCyan),
    ("systemBlue",                  .systemBlue),
    ("systemIndigo",                .systemIndigo),
    ("systemPurple",                .systemPurple),
    ("systemPink",                  .systemPink),
    ("systemBrown",                 .systemBrown),
    ("systemGray",                  .systemGray),
]

func colorsFor(_ appearanceName: NSAppearance.Name) -> [String: Any] {
    var out: [String: Any] = [:]
    NSAppearance(named: appearanceName)!.performAsCurrentDrawingAppearance {
        for (name, color) in semanticColors {
            out[name] = sample(color)
        }
        // Alternating row colors (list striping)
        let alts = NSColor.alternatingContentBackgroundColors
        out["alternatingContentBackground"] = alts.compactMap { RGBA($0)?.dict }
    }
    return out
}

// MARK: - Typography

func typography() -> [String: Any] {
    let styles: [(String, NSFont.TextStyle)] = [
        ("largeTitle", .largeTitle), ("title1", .title1), ("title2", .title2),
        ("title3", .title3), ("headline", .headline), ("body", .body),
        ("callout", .callout), ("subheadline", .subheadline),
        ("footnote", .footnote), ("caption1", .caption1), ("caption2", .caption2),
    ]

    var ramp: [String: Any] = [:]
    for (name, style) in styles {
        let f = NSFont.preferredFont(forTextStyle: style)
        let traits = f.fontDescriptor.object(forKey: .traits) as? [NSFontDescriptor.TraitKey: Any]
        let weight = (traits?[.weight] as? NSNumber)?.doubleValue ?? 0

        ramp[name] = [
            "sizePt": f.pointSize,
            "postscriptName": f.fontName,
            // AppKit weight is -1.0...1.0; map to nearest CSS weight
            "appkitWeight": (weight * 100).rounded() / 100,
            "cssWeight": cssWeight(name: f.fontName, traitWeight: weight),
            "leadingPt": (f.leading * 100).rounded() / 100,
            "ascenderPt": (f.ascender * 100).rounded() / 100,
            "descenderPt": (f.descender * 100).rounded() / 100,
            "lineHeightPt": ((f.ascender - f.descender + f.leading) * 100).rounded() / 100,
        ]
    }

    return [
        "ramp": ramp,
        "systemFontSize": NSFont.systemFontSize,
        "smallSystemFontSize": NSFont.smallSystemFontSize,
        "labelFontSize": NSFont.labelFontSize,
        "systemFontFamily": NSFont.systemFont(ofSize: 13).familyName ?? "unknown",
        "monospacedFontFamily": NSFont.monospacedSystemFont(ofSize: 13, weight: .regular).familyName ?? "unknown",
        // Web-safe stack. SF fonts must NOT be embedded — Apple's license
        // forbids web embedding. -apple-system uses the local system font.
        "recommendedCSSStack": "-apple-system, BlinkMacSystemFont, \"SF Pro Text\", \"Inter\", system-ui, sans-serif",
        "recommendedMonoCSSStack": "ui-monospace, \"SF Mono\", Menlo, monospace",
    ]
}

/// Resolve CSS weight. The font descriptor's trait weight is unreliable for
/// preferredFont(forTextStyle:) — e.g. caption2 reports 0.0 while actually
/// resolving to .SFNS-Medium. The PostScript name is authoritative, so prefer
/// it and fall back to the trait value only for unrecognized names.
func cssWeight(name: String, traitWeight: Double) -> Int {
    let suffixes: [(String, Int)] = [
        ("ultralight", 100), ("thin", 200), ("light", 300),
        ("regular", 400), ("medium", 500), ("semibold", 600),
        ("bold", 700), ("heavy", 800), ("black", 900),
    ]
    let lower = name.lowercased()
    // Longest suffix first so "semibold" wins over "bold".
    for (suffix, weight) in suffixes.sorted(by: { $0.0.count > $1.0.count })
    where lower.hasSuffix(suffix) {
        return weight
    }

    switch traitWeight {
    case ..<(-0.7):  return 100
    case ..<(-0.5):  return 200
    case ..<(-0.2):  return 300
    case ..<0.1:     return 400
    case ..<0.25:    return 500
    case ..<0.35:    return 600
    case ..<0.5:     return 700
    case ..<0.6:     return 800
    default:         return 900
    }
}

// MARK: - Control metrics

func controlMetrics() -> [String: Any] {
    var out: [String: Any] = [:]
    let sizes: [(String, NSControl.ControlSize)] = [
        ("mini", .mini), ("small", .small), ("regular", .regular), ("large", .large),
    ]

    var buttons: [String: Any] = [:]
    for (name, size) in sizes {
        let b = NSButton(title: "Button", target: nil, action: nil)
        b.bezelStyle = .rounded
        b.controlSize = size
        b.sizeToFit()
        buttons[name] = [
            "heightPt": (b.frame.height * 100).rounded() / 100,
            "fittingWidthPt": (b.fittingSize.width * 100).rounded() / 100,
        ]
    }
    out["pushButton"] = buttons

    var fields: [String: Any] = [:]
    for (name, size) in sizes {
        let t = NSTextField(string: "Text")
        t.controlSize = size
        t.sizeToFit()
        fields[name] = ["heightPt": (t.frame.height * 100).rounded() / 100]
    }
    out["textField"] = fields

    return out
}

// MARK: - Materials (tint layer only — see caveat at top)

func materials() -> [String: Any] {
    let app = NSApplication.shared
    app.setActivationPolicy(.accessory)

    let all: [(String, NSVisualEffectView.Material)] = [
        ("titlebar", .titlebar), ("selection", .selection), ("menu", .menu),
        ("popover", .popover), ("sidebar", .sidebar), ("headerView", .headerView),
        ("sheet", .sheet), ("windowBackground", .windowBackground),
        ("hudWindow", .hudWindow), ("fullScreenUI", .fullScreenUI),
        ("toolTip", .toolTip), ("contentBackground", .contentBackground),
        ("underWindowBackground", .underWindowBackground),
        ("underPageBackground", .underPageBackground),
    ]

    var out: [String: Any] = [:]

    for (appearanceKey, appearanceName) in [("light", NSAppearance.Name.aqua),
                                            ("dark",  NSAppearance.Name.darkAqua)] {
        var perAppearance: [String: Any] = [:]
        NSAppearance(named: appearanceName)!.performAsCurrentDrawingAppearance {
            for (name, material) in all {
                let win = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 120, height: 120),
                                   styleMask: [.borderless], backing: .buffered, defer: false)
                win.appearance = NSAppearance(named: appearanceName)
                let fx = NSVisualEffectView(frame: NSRect(x: 0, y: 0, width: 120, height: 120))
                fx.material = material
                fx.blendingMode = .behindWindow
                fx.state = .active
                fx.appearance = NSAppearance(named: appearanceName)
                win.contentView?.addSubview(fx)

                guard let rep = fx.bitmapImageRepForCachingDisplay(in: fx.bounds) else { continue }
                fx.cacheDisplay(in: fx.bounds, to: rep)
                if let c = rep.colorAt(x: 60, y: 60), let rgba = RGBA(c) {
                    perAppearance[name] = [
                        "tint": rgba.dict,
                        "note": "tint layer only; blur radius not extractable",
                    ]
                }
            }
        }
        out[appearanceKey] = perAppearance
    }

    out["_caveat"] = "NSVisualEffectView backdrop blur is composited by the window "
        + "server and is not captured offscreen. These are the material tint layers. "
        + "Match blur radius visually against a real window — see README.md."
    return out
}

// MARK: - Assemble

let payload: [String: Any] = [
    "_meta": [
        "generatedAt": ISO8601DateFormatter().string(from: Date()),
        "osVersion": ProcessInfo.processInfo.operatingSystemVersionString,
        "source": "AppKit runtime query via extract-tokens.swift",
    ],
    "colors": [
        "light": colorsFor(.aqua),
        "dark":  colorsFor(.darkAqua),
    ],
    "typography": typography(),
    "controlMetrics": controlMetrics(),
    "materials": materials(),
]

let data = try JSONSerialization.data(
    withJSONObject: payload,
    options: [.prettyPrinted, .sortedKeys]
)
FileHandle.standardOutput.write(data)
FileHandle.standardOutput.write("\n".data(using: .utf8)!)
