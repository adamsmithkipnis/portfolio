import { AppShellPage } from "@/lib/desktop/app-shell-page";
import { redirectIfUnsupportedOnMobile } from "@/lib/desktop/route-guards";

export default async function SpotifyPage() {
  await redirectIfUnsupportedOnMobile("spotify");

  return <AppShellPage appId="spotify" />;
}
