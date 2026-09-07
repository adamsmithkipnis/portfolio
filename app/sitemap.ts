import { createClient } from "@/utils/supabase/server";
import { ARCHIVE_PATHS } from "@/lib/archive-site";
import { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!;
  const supabase = await createClient();

  const { data: notes } = await supabase
    .from("notes")
    .select("slug, created_at")
    .eq("public", true)
    .order("created_at", { ascending: false });

  const notesUrls =
    notes?.map((note) => ({
      url: `${siteUrl}/notes/${note.slug}`,
      lastModified: new Date(note.created_at),
    })) || [];

  // The portfolio proper: the archived site and its case studies. These are
  // the pages a search result or a shared link should land on.
  const archiveUrls = ARCHIVE_PATHS.map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
    priority: path.includes("/casestudies") ? 0.9 : 1,
  }));

  return [
    { url: siteUrl, lastModified: new Date(), priority: 1 },
    ...archiveUrls,
    { url: `${siteUrl}/notes`, lastModified: new Date(), priority: 0.6 },
    ...notesUrls,
  ];
}
