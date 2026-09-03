import { getSearchString, type SearchParams } from "@/lib/route-utils";
import { RouteRedirect } from "@/components/route-redirect";
import { redirectIfUnsupportedOnMobile } from "@/lib/desktop/route-guards";

type PageProps = {
  searchParams?: SearchParams;
};

export default async function SafariCatchAllPage({ searchParams }: PageProps) {
  await redirectIfUnsupportedOnMobile("safari");

  return <RouteRedirect basePath="/safari" search={getSearchString(searchParams)} />;
}
