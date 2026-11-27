import type { Metadata } from "next";
import { GestureSpike } from "@/components/ios/spike/gesture-spike";

// Phase 0 of docs/ios-shell.md. Throwaway, unlinked, and kept out of search.
export const metadata: Metadata = {
  title: "iOS gesture spike",
  robots: { index: false, follow: false },
};

export default function IOSSpikePage() {
  return <GestureSpike />;
}
