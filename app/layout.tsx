import { Metadata } from "next";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider } from "@/components/theme-provider";
import { PostHogProvider } from "@/components/posthog-provider";
import {
  analyticsEnabled,
  umamiScriptSrc,
  umamiWebsiteId,
} from "@/lib/analytics";
import { siteConfig } from "@/config/site";
import "./globals.css";
import { SystemSettingsProvider } from "@/lib/system-settings-context";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: siteConfig.title,
  description: siteConfig.description,
  openGraph: {
    title: siteConfig.title,
    description: siteConfig.description,
    siteName: siteConfig.title,
    url: siteConfig.url,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, interactive-widget=resizes-content"
        />
      </head>
      {/*
        Extensions add their own attributes to <body> before React hydrates
        (ColorZilla's cz-shortcut-listen is the common one), and React reports
        the difference as a hydration error in the visitor's console. This
        suppresses that one element's attribute check only; children are still
        compared normally.
      */}
      <body className="h-dvh" suppressHydrationWarning>
        <PostHogProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <SystemSettingsProvider>
              {children}
            </SystemSettingsProvider>
          </ThemeProvider>
        </PostHogProvider>
        <Analytics />
        {/*
          umami. self-hooks history.pushState, so the desktop's client-side
          window/route changes are counted without any wiring on our side.
          absent env var = no script, which is what local dev and forks get.
        */}
        {umamiWebsiteId && analyticsEnabled ? (
          <Script
            defer
            src={umamiScriptSrc}
            data-website-id={umamiWebsiteId}
            strategy="afterInteractive"
          />
        ) : null}
      </body>
    </html>
  );
}
