import { getSearchString, type SearchParams } from "@/lib/route-utils";
import { RouteRedirect } from "@/components/route-redirect";
import { redirectIfUnsupportedOnMobile } from "@/lib/desktop/route-guards";

type PageProps = {
  searchParams?: SearchParams;
};

export default async function FigmaCatchAllPage({ searchParams }: PageProps) {
  await redirectIfUnsupportedOnMobile("figma");

  return <RouteRedirect basePath="/figma" search={getSearchString(searchParams)} />;
}
