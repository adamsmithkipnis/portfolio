import { AppShellPage } from "@/lib/desktop/app-shell-page";
import { redirectIfUnsupportedOnMobile } from "@/lib/desktop/route-guards";

export default async function FigmaPage() {
  await redirectIfUnsupportedOnMobile("figma");

  return <AppShellPage appId="figma" />;
}
