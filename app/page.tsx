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

export default function Home() {
  return <HomeClient />;
}
