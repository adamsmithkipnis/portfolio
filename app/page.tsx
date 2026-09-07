import { Metadata } from "next";
import { redirect } from "next/navigation";
import { siteConfig } from "@/config/site";
import { isMobileRequest } from "@/lib/is-mobile-request";
import HomeClient from "./home-client";

export const metadata: Metadata = {
  title: siteConfig.title,
  description: siteConfig.description,
  openGraph: {
    description: siteConfig.description,
    images: [siteConfig.ogImage],
  },
};

export default async function Home() {
  // A phone gets the portfolio itself. The simulated desktop is built for a
  // desktop, and on a phone its Safari chrome only costs screen; anyone who
  // wants the shell can still open /safari, /finder, or any app route.
  if (await isMobileRequest()) {
    redirect("/website");
  }
  return <HomeClient />;
}
