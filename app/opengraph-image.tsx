import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// The portfolio site's own palette (public/archive/smithkipnis/site.css), not
// the macOS tokens: a link preview sells the portfolio, not the wrapper.
const INK = "#253551";
const BAND = "#e0e0db";
const HIGHLIGHT = "#ffcf4a";

function Marked({ children, last }: { children: string; last?: boolean }) {
  return (
    <span
      style={{
        display: "flex",
        backgroundColor: HIGHLIGHT,
        borderRadius: 12,
        padding: "0 14px",
        margin: last ? "0 0 0 4px" : "0 4px",
      }}
    >
      {children}
    </span>
  );
}

/** The site-wide share image: the home page's own headline, in its own inks. */
export default function OpenGraphImage() {
  const line = { display: "flex", alignItems: "center" } as const;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: BAND,
          color: INK,
          padding: "72px 80px",
        }}
      >
        <div style={{ display: "flex", fontSize: 34, fontWeight: 700 }}>{siteConfig.title}</div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 68, lineHeight: 1.22 }}>
          <div style={line}>I build and lead teams that</div>
          <div style={line}>
            turn <Marked>complex technologies</Marked>
          </div>
          <div style={line}>
            into <Marked last>intuitive experiences</Marked>.
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 28 }}>smithkipnis.com</div>
      </div>
    ),
    size
  );
}
