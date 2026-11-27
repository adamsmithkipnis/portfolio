//
//  extract-tokens-ios.swift
//  Dumps iOS system design tokens to JSON by querying UIKit directly.
//  The iOS counterpart of extract-tokens.swift.
//
//  UIKit only exists on iOS, so this cannot run as a macOS script. Build it
//  for the simulator and run it inside a booted one:
//
//    xcrun -sdk iphonesimulator swiftc -target arm64-apple-ios26.0-simulator \
//      extract-tokens-ios.swift -o /tmp/extract-tokens-ios
//    xcrun simctl spawn booted /tmp/extract-tokens-ios > tokens.ios.json
//
//  (Intel Macs: use x86_64-apple-ios26.0-simulator.)
//
//  Extracted from the running simulator, so values are exact for THAT iOS
//  version. Re-run after an Xcode update to pick up changes.
//
//  NOT extractable, and hand-seeded in build-tokens.mjs instead: Liquid Glass
//  and blur materials (composited by the render server), corner radii, the
//  Home Screen icon grid, and animation curves.
//

import Foundation
import UIKit

// MARK: - Helpers

struct RGBA {
    let r: Int, g: Int, b: Int, a: Double

    init?(_ color: UIColor) {
        var red: CGFloat = 0, green: CGFloat = 0, blue: CGFloat = 0, alpha: CGFloat = 0
        guard color.getRed(&red, green: &green, blue: &blue, alpha: &alpha) else { return nil }
        // getRed returns extended sRGB; clamp wide-gamut components.
        let clamp = { (v: CGFloat) in Int((min(max(v, 0), 1) * 255).rounded()) }
        r = clamp(red)
        g = clamp(green)
        b = clamp(blue)
        a = (Double(alpha) * 1000).rounded() / 1000
    }

    var hex: String { String(format: "#%02X%02X%02X", r, g, b) }
    var css: String {
        a < 0.999 ? "rgb(\(r) \(g) \(b) / \(a))" : hex
    }
    var dict: [String: Any] {
        ["hex": hex, "r": r, "g": g, "b": b, "a": a, "css": css]
    }
}

func round2(_ v: CGFloat) -> Double { (Double(v) * 100).rounded() / 100 }

// MARK: - Color set

let semanticColors: [(String, UIColor)] = [
    // Labels
    ("label",                             .label),
    ("secondaryLabel",                    .secondaryLabel),
    ("tertiaryLabel",                     .tertiaryLabel),
    ("quaternaryLabel",                   .quaternaryLabel),
    ("placeholderText",                   .placeholderText),
    ("link",                              .link),

    // Separators
    ("separator",                         .separator),
    ("opaqueSeparator",                   .opaqueSeparator),

    // Backgrounds
    ("systemBackground",                  .systemBackground),
    ("secondarySystemBackground",         .secondarySystemBackground),
    ("tertiarySystemBackground",          .tertiarySystemBackground),
    ("systemGroupedBackground",           .systemGroupedBackground),
    ("secondarySystemGroupedBackground",  .secondarySystemGroupedBackground),
    ("tertiarySystemGroupedBackground",   .tertiarySystemGroupedBackground),

    // Fills
    ("systemFill",                        .systemFill),
    ("secondarySystemFill",               .secondarySystemFill),
    ("tertiarySystemFill",                .tertiarySystemFill),
    ("quaternarySystemFill",              .quaternarySystemFill),

    // System palette
    ("systemRed",                         .systemRed),
    ("systemOrange",                      .systemOrange),
    ("systemYellow",                      .systemYellow),
    ("systemGreen",                       .systemGreen),
    ("systemMint",                        .systemMint),
    ("systemTeal",                        .systemTeal),
    ("systemCyan",                        .systemCyan),
    ("systemBlue",                        .systemBlue),
    ("systemIndigo",                      .systemIndigo),
    ("systemPurple",                      .systemPurple),
    ("systemPink",                        .systemPink),
    ("systemBrown",                       .systemBrown),
    ("systemGray",                        .systemGray),
    ("systemGray2",                       .systemGray2),
    ("systemGray3",                       .systemGray3),
    ("systemGray4",                       .systemGray4),
    ("systemGray5",                       .systemGray5),
    ("systemGray6",                       .systemGray6),
]

/// iOS resolves backgrounds differently for content presented above the base
/// level (sheets, popovers) in dark mode, so each scheme is sampled at both.
func colorsFor(_ style: UIUserInterfaceStyle, _ level: UIUserInterfaceLevel) -> [String: Any] {
    let traits = UITraitCollection(traitsFrom: [
        UITraitCollection(userInterfaceStyle: style),
        UITraitCollection(userInterfaceLevel: level),
    ])
    var out: [String: Any] = [:]
    for (name, color) in semanticColors {
        out[name] = RGBA(color.resolvedColor(with: traits))?.dict
            ?? ["error": "not convertible to sRGB"]
    }
    return out
}

// MARK: - Typography

func cssWeight(_ font: UIFont) -> Int {
    let suffixes: [(String, Int)] = [
        ("ultralight", 100), ("thin", 200), ("light", 300),
        ("regular", 400), ("medium", 500), ("semibold", 600),
        ("bold", 700), ("heavy", 800), ("black", 900),
    ]
    let lower = font.fontName.lowercased()
    // Longest suffix first so "semibold" wins over "bold".
    for (suffix, weight) in suffixes.sorted(by: { $0.0.count > $1.0.count })
    where lower.hasSuffix(suffix) {
        return weight
    }
    return 400
}

func typography() -> [String: Any] {
    let styles: [(String, UIFont.TextStyle)] = [
        ("largeTitle", .largeTitle), ("title1", .title1), ("title2", .title2),
        ("title3", .title3), ("headline", .headline), ("body", .body),
        ("callout", .callout), ("subheadline", .subheadline),
        ("footnote", .footnote), ("caption1", .caption1), ("caption2", .caption2),
    ]
    // Dynamic Type at its default size, the one the HIG tables are quoted at.
    let traits = UITraitCollection(preferredContentSizeCategory: .large)

    var ramp: [String: Any] = [:]
    for (name, style) in styles {
        let f = UIFont.preferredFont(forTextStyle: style, compatibleWith: traits)
        ramp[name] = [
            "sizePt": round2(f.pointSize),
            "postscriptName": f.fontName,
            "cssWeight": cssWeight(f),
            "leadingPt": round2(f.leading),
            "ascenderPt": round2(f.ascender),
            "descenderPt": round2(f.descender),
            "lineHeightPt": round2(f.lineHeight),
        ]
    }

    return [
        "ramp": ramp,
        "contentSizeCategory": "large",
        "systemFontSize": round2(UIFont.systemFontSize),
        "smallSystemFontSize": round2(UIFont.smallSystemFontSize),
        "labelFontSize": round2(UIFont.labelFontSize),
        "buttonFontSize": round2(UIFont.buttonFontSize),
        "systemFontFamily": UIFont.systemFont(ofSize: 17).familyName,
        // Web-safe stack. SF fonts must NOT be embedded — Apple's license
        // forbids web embedding. -apple-system uses the local system font.
        "recommendedCSSStack": "-apple-system, BlinkMacSystemFont, \"SF Pro Text\", \"Inter\", system-ui, sans-serif",
        "recommendedMonoCSSStack": "ui-monospace, \"SF Mono\", Menlo, monospace",
    ]
}

// MARK: - Control metrics

func height(_ size: CGSize) -> [String: Any] {
    ["heightPt": round2(size.height), "widthPt": round2(size.width)]
}

func controlMetrics() -> [String: Any] {
    var out: [String: Any] = [:]

    var buttons: [String: Any] = [:]
    let sizes: [(String, UIButton.Configuration.Size)] = [
        ("mini", .mini), ("small", .small), ("medium", .medium), ("large", .large),
    ]
    for (name, size) in sizes {
        var config = UIButton.Configuration.filled()
        config.title = "Button"
        config.buttonSize = size
        let button = UIButton(configuration: config)
        buttons[name] = height(button.systemLayoutSizeFitting(UIView.layoutFittingCompressedSize))
    }
    out["button"] = buttons

    out["switch"] = ["regular": height(UISwitch().intrinsicContentSize)]
    out["segmentedControl"] = [
        "regular": height(UISegmentedControl(items: ["One", "Two"]).intrinsicContentSize)
    ]
    out["searchField"] = ["regular": height(UISearchTextField().intrinsicContentSize)]
    out["slider"] = ["regular": height(UISlider().intrinsicContentSize)]
    out["stepper"] = ["regular": height(UIStepper().intrinsicContentSize)]

    // Bars report their standard height through sizeThatFits. These exclude
    // the safe-area inset the bar extends into (status bar, home indicator).
    let fit = CGSize(width: 393, height: 0)
    out["navigationBar"] = ["regular": height(UINavigationBar().sizeThatFits(fit))]
    out["tabBar"] = ["regular": height(UITabBar().sizeThatFits(fit))]
    out["toolbar"] = ["regular": height(UIToolbar().sizeThatFits(fit))]

    return out
}

// MARK: - Assemble

let device = UIDevice.current
let payload: [String: Any] = [
    "_meta": [
        "generatedAt": ISO8601DateFormatter().string(from: Date()),
        "platform": "ios",
        "osVersion": "\(device.systemName) \(device.systemVersion)",
        "device": ProcessInfo.processInfo.environment["SIMULATOR_DEVICE_NAME"] ?? device.model,
        "source": "UIKit runtime query via extract-tokens-ios.swift",
    ],
    "colors": [
        "light": colorsFor(.light, .base),
        "lightElevated": colorsFor(.light, .elevated),
        "dark": colorsFor(.dark, .base),
        "darkElevated": colorsFor(.dark, .elevated),
    ],
    "typography": typography(),
    "controlMetrics": controlMetrics(),
]

let data = try JSONSerialization.data(
    withJSONObject: payload,
    options: [.prettyPrinted, .sortedKeys]
)
FileHandle.standardOutput.write(data)
FileHandle.standardOutput.write("\n".data(using: .utf8)!)
