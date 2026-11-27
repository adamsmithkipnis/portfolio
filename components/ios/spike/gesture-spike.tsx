"use client";

/**
 * Phase 0 gesture spike. Throwaway: delete with app/ios-spike once the gesture
 * table in docs/ios-shell.md is confirmed on real devices.
 *
 * It answers one question: can a page own a home-indicator strip and a status
 * bar strip inside the viewport without the visitor's real OS or browser
 * taking the touch, and does the real back gesture land as a `popstate` we can
 * treat as the simulated back? It is deliberately unstyled, using only the
 * existing theme tokens, because the iOS tokens do not exist yet.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  type GestureSample,
  homeGestureProgress,
  resolveHomeGesture,
  resolvePullDown,
  topEdgeTarget,
} from "@/lib/ios/gestures";
import { pushUrl } from "@/lib/set-url";

type View = "app" | "home" | "switcher";
type Content = "list" | "iframe";
type Verdict = "pass" | "fail";

const CHECKS = [
  { id: "home-flick", label: "Fast swipe up from the bar at the bottom goes Home" },
  { id: "home-switcher", label: "Slow swipe up and pause opens the Switcher" },
  { id: "home-no-os", label: "Neither swipe closed the browser or moved its toolbar" },
  { id: "home-iframe", label: "Both still work with the framed website showing" },
  { id: "scroll", label: "The list still scrolls normally right above the bar" },
  { id: "top-left", label: "Pull down from the top-left opens Notification Center" },
  { id: "top-right", label: "Pull down from the top-right opens Control Center" },
  { id: "top-no-refresh", label: "Neither pull reloaded the page" },
  { id: "back", label: "The phone's own back swipe steps back one detail level" },
  { id: "no-zoom", label: "Double-tap and pinch do not zoom the page" },
] as const;

function now() {
  return new Date().toISOString().slice(11, 23);
}

function readDepth() {
  const match = /^#detail-(\d+)$/.exec(window.location.hash);
  return match ? Number(match[1]) : 0;
}

export function GestureSpike() {
  const [view, setView] = useState<View>("app");
  const [content, setContent] = useState<Content>("list");
  const [panel, setPanel] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [depth, setDepth] = useState(0);
  const [log, setLog] = useState<string[]>([]);
  const [verdicts, setVerdicts] = useState<Record<string, Verdict>>({});
  const [environment, setEnvironment] = useState<Record<string, string | number | boolean>>({});
  const [copied, setCopied] = useState(false);
  const samples = useRef<GestureSample[]>([]);

  const note = useCallback((line: string) => {
    setLog((lines) => [`${now()} ${line}`, ...lines].slice(0, 60));
  }, []);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    setEnvironment({
      userAgent: navigator.userAgent,
      standalone,
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      visualViewportHeight: window.visualViewport?.height ?? 0,
      screenHeight: window.screen.height,
      devicePixelRatio: window.devicePixelRatio,
    });
    setDepth(readDepth());

    const onPopState = () => {
      setDepth(readDepth());
      note(`popstate → depth ${readDepth()}`);
    };
    const onVisibility = () => note(`visibility → ${document.visibilityState}`);
    const onResize = () => note(`resize → ${window.innerWidth}×${window.innerHeight}`);
    window.addEventListener("popstate", onPopState);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("popstate", onPopState);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", onResize);
    };
  }, [note]);

  const track = (event: React.PointerEvent) => {
    samples.current.push({ x: event.clientX, y: event.clientY, t: event.timeStamp });
  };

  const begin = (event: React.PointerEvent) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    samples.current = [];
    track(event);
  };

  // A pointercancel is the evidence this spike exists to collect: it means the
  // browser or OS took the touch away from the page mid-gesture.
  const cancelled = (zone: string) => {
    samples.current = [];
    setProgress(0);
    note(`${zone}: POINTERCANCEL (browser or OS took the touch)`);
  };

  const endHome = (event: React.PointerEvent) => {
    track(event);
    const result = resolveHomeGesture(samples.current, window.innerHeight);
    const start = samples.current[0];
    note(`home bar: ${result} (started ${Math.round(window.innerHeight - start.y)}px above viewport bottom)`);
    samples.current = [];
    setProgress(0);
    if (result === "home") setView("home");
    if (result === "switcher" || result === "tap") setView("switcher");
  };

  const endTop = (event: React.PointerEvent) => {
    track(event);
    const target = topEdgeTarget(samples.current[0].x, window.innerWidth);
    const result = resolvePullDown(samples.current, window.innerHeight);
    note(`status bar: ${result} → ${target}`);
    samples.current = [];
    if (result !== "cancel") setPanel(target);
  };

  const pushDetail = () => {
    const next = depth + 1;
    pushUrl(`${window.location.pathname}#detail-${next}`);
    setDepth(next);
    note(`pushed depth ${next}`);
  };

  const copyResults = async () => {
    const report = JSON.stringify({ environment, verdicts, log }, null, 2);
    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
    } catch {
      note("clipboard unavailable — screenshot the checklist instead");
    }
  };

  const scale = view === "switcher" ? 0.72 : 1 - progress * 0.5;

  return (
    <div
      data-shell="ios"
      className="fixed inset-0 flex select-none flex-col overflow-hidden bg-muted text-foreground"
      style={{ touchAction: "manipulation", WebkitTouchCallout: "none" }}
    >
      {/* Simulated status bar: the start zone for both pull-down panels. */}
      <div
        className="flex h-11 shrink-0 items-center justify-between border-b border-border bg-background px-4 text-xs"
        style={{ touchAction: "none" }}
        onPointerDown={begin}
        onPointerMove={(event) => event.buttons !== 0 && track(event)}
        onPointerUp={endTop}
        onPointerCancel={() => cancelled("status bar")}
      >
        <span>Notification Center ↓</span>
        <span>↓ Control Center</span>
      </div>

      <div className="relative min-h-0 flex-1">
        {view === "home" ? (
          <div className="flex h-full flex-col items-center justify-center gap-4">
            <p className="text-sm text-muted-foreground">Home Screen</p>
            <button className="rounded-md bg-primary px-4 py-2 text-primary-foreground" onClick={() => setView("app")}>
              Open app
            </button>
          </div>
        ) : (
          <div
            className="flex h-full origin-bottom flex-col overflow-hidden bg-background"
            style={{
              transform: `scale(${scale})`,
              transition: progress > 0 ? "none" : "transform 200ms ease-out",
            }}
            onClick={view === "switcher" ? () => setView("app") : undefined}
          >
            <div className="flex shrink-0 items-center gap-2 border-b border-border p-2 text-xs">
              <button className="rounded-md border border-border px-2 py-1" onClick={() => setContent("list")}>
                List
              </button>
              <button className="rounded-md border border-border px-2 py-1" onClick={() => setContent("iframe")}>
                Website
              </button>
              <button className="rounded-md border border-border px-2 py-1" onClick={pushDetail}>
                Push detail ({depth})
              </button>
              <button className="ml-auto rounded-md border border-border px-2 py-1" onClick={copyResults}>
                {copied ? "Copied" : "Copy results"}
              </button>
            </div>

            {content === "iframe" ? (
              <iframe title="Archived site" src="/website" className="min-h-0 w-full flex-1" />
            ) : (
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 text-sm">
                <ol className="space-y-3">
                  {CHECKS.map((check) => (
                    <li key={check.id} className="flex items-center gap-2">
                      <span className="flex-1">{check.label}</span>
                      {(["pass", "fail"] as const).map((verdict) => (
                        <button
                          key={verdict}
                          aria-pressed={verdicts[check.id] === verdict}
                          className="rounded-md border border-border px-2 py-1 text-xs aria-pressed:bg-primary aria-pressed:text-primary-foreground"
                          onClick={() => setVerdicts((all) => ({ ...all, [check.id]: verdict }))}
                        >
                          {verdict}
                        </button>
                      ))}
                    </li>
                  ))}
                </ol>
                <pre className="mt-4 whitespace-pre-wrap break-words text-xs text-muted-foreground">
                  {JSON.stringify(environment, null, 1)}
                </pre>
                <pre className="mt-4 whitespace-pre-wrap break-words text-xs">{log.join("\n")}</pre>
              </div>
            )}
          </div>
        )}

        {panel ? (
          <button
            className="absolute inset-0 flex items-center justify-center bg-background/90 text-sm"
            onClick={() => setPanel(null)}
          >
            {panel} — tap to dismiss
          </button>
        ) : null}
      </div>

      {/* Simulated home indicator: inside the viewport, above the real one. */}
      <div
        role="button"
        aria-label="Home indicator"
        className="flex h-8 shrink-0 items-center justify-center bg-background"
        style={{ touchAction: "none" }}
        onPointerDown={begin}
        onPointerMove={(event) => {
          if (event.buttons === 0) return;
          track(event);
          setProgress(homeGestureProgress(samples.current, window.innerHeight));
        }}
        onPointerUp={endHome}
        onPointerCancel={() => cancelled("home bar")}
      >
        <div className="h-1.5 w-32 rounded-full bg-foreground" />
      </div>
    </div>
  );
}
