import { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { APPS } from "@/lib/app-config";
import HomeClient from "./home-client";

export const metadata: Metadata = {
  title: siteConfig.title,
  description: siteConfig.description,
  openGraph: {
    description: siteConfig.description,
    images: [siteConfig.ogImage],
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
      <HomeClient />
    </>
  );
}
