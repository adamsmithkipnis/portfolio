import { Metadata } from "next";
import { siteConfig } from "@/config/site";
import HomeClient from "./home-client";

export const metadata: Metadata = {
  title: siteConfig.title,
  description: siteConfig.description,
  openGraph: {
    description: siteConfig.description,
    images: [siteConfig.ogImage],
  },
};

// The phone branch lives in `middleware.ts` now — it rewrites `/` to the
// archived site at the edge. Keeping it out of here is what lets this page
// render statically instead of per-request.
export default function Home() {
  return <HomeClient />;
}
