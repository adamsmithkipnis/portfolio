import { getSearchString, type SearchParams } from "@/lib/route-utils";
import { RouteRedirect } from "@/components/route-redirect";
import { redirectIfUnsupportedOnMobile } from "@/lib/desktop/route-guards";

type PageProps = {
  searchParams?: SearchParams;
};

export default async function SpotifyCatchAllPage({ searchParams }: PageProps) {
  await redirectIfUnsupportedOnMobile("spotify");

  return <RouteRedirect basePath="/spotify" search={getSearchString(searchParams)} />;
}
