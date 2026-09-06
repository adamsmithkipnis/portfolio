import { getSearchString, type SearchParams } from "@/lib/route-utils";
import { RouteRedirect } from "@/components/route-redirect";

type PageProps = {
  searchParams?: SearchParams;
};

export default function SpotifyCatchAllPage({ searchParams }: PageProps) {
  return <RouteRedirect basePath="/spotify" search={getSearchString(searchParams)} />;
}
