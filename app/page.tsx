import { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { APPS } from "@/lib/app-config";
import { WORK_LINKS } from "@/lib/work-links";
import HomeClient from "./home-client";

export const metadata: Metadata = {
  title: siteConfig.title,
  description: siteConfig.description,
  alternates: { canonical: "/" },
  openGraph: {
    description: siteConfig.description,
  },
};

/**
 * The icons the dock draws on a first visit, Trash included — it has no app
 * behind it. Read from the registry so adding an app to the dock preloads its
 * icon too, rather than leaving a list here to drift.
 */
const DOCK_ICONS = [
  ...APPS.filter((app) => app.showOnDockByDefault !== false && !app.drawsOwnDockIcon).map(
    (app) => app.icon
  ),
  "/trash.png",
].filter((icon, i, all) => Boolean(icon) && all.indexOf(icon) === i);

// The phone branch lives in `middleware.ts` now — it rewrites `/` to the
// archived site at the edge. Keeping it out of here is what lets this page
// render statically instead of per-request.
export default function Home() {
  return (
    <>
      {/*
        The dock is client-rendered, so until React has run there is nothing in
        the document pointing at an icon — and with the shell painting nothing
        large, a 48px dock icon is what Chrome picks as the largest contentful
        paint. That cost 771ms of pure resource load delay: the request could
        not start until hydration built the img. These preloads are in the
        initial HTML, so the preload scanner finds them on the first pass.
        rel="preload" is honoured outside <head>, which matters because React 18
        will not hoist a link out of a page component.

        They live here rather than in the root layout because middleware sends
        phones to the archived site, so only a desktop visitor ever renders this
        page — nothing on a phone pays for a dock it will not be shown.
      */}
      {DOCK_ICONS.map((icon) => (
        <link key={icon} rel="preload" as="image" type="image/png" href={icon} />
      ))}
      {/*
        The desktop is client-rendered and the portfolio sits in a frame inside
        it, so the server-rendered document used to say nothing about who this
        is or where the work lives. This is that, for crawlers, link unfurlers
        and screen readers: the same name, description and case studies the
        visible site shows. The first link appears on keyboard focus, as a way
        past the desktop; the rest stay out of the tab order.
      */}
      <header className="sr-only focus-within:not-sr-only focus-within:fixed focus-within:left-3 focus-within:top-9 focus-within:z-[100] focus-within:rounded-md focus-within:bg-background focus-within:px-3 focus-within:py-2 focus-within:text-sm focus-within:text-foreground focus-within:shadow-lg">
        <h1>{siteConfig.title}</h1>
        <p>{siteConfig.description}</p>
        <nav aria-label="Portfolio">
          <a href="/website">Skip to the portfolio site</a>
          <ul>
            {WORK_LINKS.map((link) => (
              <li key={link.slug}>
                <a href={link.archivePath} tabIndex={-1}>
                  {link.title}
                </a>
                {link.summary ? <p>{link.summary}</p> : null}
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <HomeClient />
    </>
  );
}
