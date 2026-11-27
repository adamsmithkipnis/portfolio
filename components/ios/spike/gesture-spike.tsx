"use client";

/**
 * Phase 0 gesture spike. Throwaway: delete with app/ios-spike and
 * app/api/ios-spike once the gesture table in docs/ios-shell.md is confirmed
 * on real devices.
 *
 * It answers one question: can a page own a home-indicator strip and a status
 * bar strip inside the viewport without the visitor's real OS or browser
 * taking the touch, and does the real back gesture land as a `popstate` we can
 * treat as the simulated back?
 *
 * The run is guided, one step at a time, and records its own outcomes: the
 * tester only supplies the finger. It is deliberately unstyled, using only the
 * existing theme tokens, because the iOS tokens do not exist yet.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  type GestureSample,
  homeGestureProgress,
  isHomeGesturePaused,
  resolveHomeGesture,
  resolvePullDown,
  topEdgeTarget,
} from "@/lib/ios/gestures";
import { pushUrl } from "@/lib/set-url";

type Content = "card" | "iframe" | "scroll" | "text";
type StepKind = "auto" | "question" | "confirm";
type Status = "pending" | "pass" | "fail";

interface StepDef {
  id: string;
  instruction: string;
  content: Content;
  kind: StepKind;
}

const STEPS: readonly StepDef[] = [
  {
    id: "flick",
    instruction: "Put your finger on the dark bar at the bottom of this page and flick up quickly.",
    content: "card",
    kind: "auto",
  },
  {
    id: "pause",
    instruction:
      "Drag up slowly from the dark bar and stop. Keep your finger still until the card says “Let go”, then lift.",
    content: "card",
    kind: "auto",
  },
  {
    id: "browser",
    instruction:
      "During those two swipes, did your browser or phone react on its own? For example: the browser closed, you landed on your real home screen, or the address bar slid.",
    content: "card",
    kind: "question",
  },
  {
    id: "frame-flick",
    instruction: "A website is now showing. Flick up quickly from the dark bar again.",
    content: "iframe",
    kind: "auto",
  },
  {
    id: "frame-pause",
    instruction: "Same website. Drag up slowly from the dark bar, stop until it says “Let go”, then lift.",
    content: "iframe",
    kind: "auto",
  },
  {
    id: "scroll",
    instruction: "Scroll the numbered list. Start with your finger on the list, just above the dark bar.",
    content: "scroll",
    kind: "auto",
  },
  {
    id: "pull-left",
    instruction: "Drag down from the words “Notification Center” at the top left of this page.",
    content: "card",
    kind: "auto",
  },
  {
    id: "pull-right",
    instruction: "Drag down from the words “Control Center” at the top right of this page.",
    content: "card",
    kind: "auto",
  },
  {
    id: "back",
    instruction: "Go back once, the way you normally do on this device: its back swipe or its back button.",
    content: "card",
    kind: "auto",
  },
  {
    id: "zoom",
    instruction: "Double-tap the paragraph below, then try to pinch it larger. Then tap Done.",
    content: "text",
    kind: "confirm",
  },
];

interface StepRecord {
  id: string;
  status: Status;
  /** What each gesture resolved to, in order. */
  attempts: string[];
  /** Times the browser or OS took a touch away from one of our strips. */
  cancels: number;
  /** Times the page was hidden (browser backgrounded) during the step. */
  hidden: number;
  /** Times the viewport changed size (browser toolbar moved) during the step. */
  resizes: number;
  /** The page reloaded during the step (pull-to-refresh). */
  reloaded: boolean;
  detail?: string;
}

interface Setup {
  device?: "phone" | "tablet";
  navigation?: "gestures" | "buttons" | "unsure";
}

type Phase = "setup" | "run" | "done";
type View = "app" | "home" | "switcher";
type SendState = "idle" | "sending" | "sent" | "failed";

const STORAGE_KEY = "ios-spike-run";
const ATTEMPT_LIMIT = 12;

function freshRecords(): StepRecord[] {
  return STEPS.map((step) => ({
    id: step.id,
    status: "pending",
    attempts: [],
    cancels: 0,
    hidden: 0,
    resizes: 0,
    reloaded: false,
  }));
}

function newCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 4 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
}

function readDepth() {
  const match = /^#spike-(\d+)$/.exec(window.location.hash);
  return match ? Number(match[1]) : 0;
}

function clock() {
  return new Date().toISOString().slice(11, 23);
}

const buttonClass = "rounded-md border border-border px-3 py-2 text-sm";
const primaryButtonClass = "rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground";

export function GestureSpike() {
  const [ready, setReady] = useState(false);
  const [code, setCode] = useState("");
  const [phase, setPhase] = useState<Phase>("setup");
  const [setup, setSetup] = useState<Setup>({});
  const [stepIndex, setStepIndex] = useState(0);
  const [records, setRecords] = useState<StepRecord[]>(freshRecords);
  const [view, setView] = useState<View>("app");
  const [panel, setPanel] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [paused, setPaused] = useState(false);
  const [sendState, setSendState] = useState<SendState>("idle");
  const [copied, setCopied] = useState(false);

  const samples = useRef<GestureSample[]>([]);
  const log = useRef<string[]>([]);
  const maxScale = useRef(1);
  const active = useRef({ phase, stepIndex });

  useEffect(() => {
    active.current = { phase, stepIndex };
  }, [phase, stepIndex]);

  const step = STEPS[stepIndex];
  const record = records[stepIndex];

  const note = useCallback((line: string) => {
    log.current = [`${clock()} ${line}`, ...log.current].slice(0, 25);
  }, []);

  /** Change the record of the step in progress; a no-op outside a run. */
  const update = useCallback((change: (record: StepRecord) => StepRecord) => {
    const { phase: currentPhase, stepIndex: index } = active.current;
    if (currentPhase !== "run") return;
    setRecords((all) => all.map((item, i) => (i === index ? change(item) : item)));
  }, []);

  const attempt = useCallback(
    (label: string, passes: boolean) => {
      note(label);
      update((item) => ({
        ...item,
        attempts: [...item.attempts, label].slice(-ATTEMPT_LIMIT),
        status: passes && item.status === "pending" ? "pass" : item.status,
      }));
    },
    [note, update]
  );

  // Restore a run in progress. Coming back here mid-run means the page was
  // reloaded under the tester's finger, which is itself a result.
  useEffect(() => {
    let restored = false;
    try {
      const raw = window.sessionStorage.getItem(STORAGE_KEY);
      const saved = raw ? JSON.parse(raw) : null;
      if (saved && typeof saved.code === "string" && Array.isArray(saved.records)) {
        restored = true;
        setCode(saved.code);
        setSetup(saved.setup ?? {});
        setPhase(saved.phase);
        setStepIndex(saved.stepIndex);
        setRecords(
          saved.phase === "run"
            ? saved.records.map((item: StepRecord, i: number) =>
                i === saved.stepIndex ? { ...item, reloaded: true } : item
              )
            : saved.records
        );
      }
    } catch {
      // No storage: the run just cannot survive a reload.
    }
    if (!restored) setCode(newCode());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ code, phase, setup, stepIndex, records }));
    } catch {
      // See above.
    }
  }, [ready, code, phase, setup, stepIndex, records]);

  // What the browser does on its own while a step is in progress.
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState !== "hidden") return;
      note("page hidden");
      update((item) => ({ ...item, hidden: item.hidden + 1 }));
    };
    const onResize = () => {
      note(`resize ${window.innerWidth}×${window.innerHeight}`);
      update((item) => ({ ...item, resizes: item.resizes + 1 }));
    };
    const onPopState = () => {
      const depth = readDepth();
      const isBackStep = STEPS[active.current.stepIndex].id === "back";
      attempt(`popstate depth ${depth}`, isBackStep && depth === 1);
    };
    const viewport = window.visualViewport;
    const onViewport = () => {
      maxScale.current = Math.max(maxScale.current, viewport?.scale ?? 1);
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("resize", onResize);
    window.addEventListener("popstate", onPopState);
    viewport?.addEventListener("resize", onViewport);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("popstate", onPopState);
      viewport?.removeEventListener("resize", onViewport);
    };
  }, [attempt, note, update]);

  // The back step needs history to go back through.
  useEffect(() => {
    if (!ready || phase !== "run" || step.id !== "back" || readDepth() !== 0) return;
    pushUrl(`${window.location.pathname}#spike-1`);
    pushUrl(`${window.location.pathname}#spike-2`);
  }, [ready, phase, step.id]);

  // A still finger sends no events, so a pause has to be polled for.
  useEffect(() => {
    if (!dragging) return;
    const timer = window.setInterval(() => {
      setPaused(isHomeGesturePaused(samples.current, performance.now()));
    }, 40);
    return () => window.clearInterval(timer);
  }, [dragging]);

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
    setDragging(false);
    setPaused(false);
    note(`${zone} POINTERCANCEL`);
    update((item) => ({ ...item, cancels: item.cancels + 1 }));
  };

  const endHome = (event: React.PointerEvent) => {
    const wasPaused = isHomeGesturePaused(samples.current, event.timeStamp);
    track(event);
    const raw = resolveHomeGesture(samples.current);
    // Once the card has said "Let go", lifting cannot turn into a flick.
    const result = wasPaused && raw === "home" ? "switcher" : raw;
    const fromBottom = Math.round(window.innerHeight - samples.current[0].y);
    samples.current = [];
    setProgress(0);
    setDragging(false);
    setPaused(false);

    const wanted = step.id.endsWith("flick") ? "home" : step.id.endsWith("pause") ? "switcher" : null;
    attempt(`home bar ${result} (${fromBottom}px up)`, result === wanted);
    if (result === "home") setView("home");
    if (result === "switcher" || result === "tap") setView("switcher");
  };

  const endTop = (event: React.PointerEvent) => {
    track(event);
    const target = topEdgeTarget(samples.current[0].x, window.innerWidth);
    const result = resolvePullDown(samples.current, window.innerHeight);
    samples.current = [];
    const wanted = step.id === "pull-left" ? "notification-center" : step.id === "pull-right" ? "control-center" : null;
    attempt(`status bar ${result} ${target}`, result === "open" && target === wanted);
    if (result !== "cancel") setPanel(target);
  };

  const next = () => {
    setView("app");
    setPanel(null);
    if (stepIndex + 1 >= STEPS.length) {
      setPhase("done");
    } else {
      setStepIndex(stepIndex + 1);
    }
  };

  const finish = (status: Status, detail?: string) => {
    update((item) => ({ ...item, status, detail }));
  };

  const giveUp = () => {
    finish("fail", "tester gave up");
    next();
  };

  const buildReport = useCallback(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    return {
      code,
      setup,
      environment: {
        userAgent: navigator.userAgent,
        standalone,
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        screenHeight: window.screen.height,
        devicePixelRatio: window.devicePixelRatio,
        maxTouchPoints: navigator.maxTouchPoints,
      },
      steps: records,
      log: log.current,
    };
  }, [code, records, setup]);

  const send = useCallback(async () => {
    setSendState("sending");
    try {
      const response = await fetch("/api/ios-spike", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(buildReport()),
      });
      setSendState(response.ok ? "sent" : "failed");
    } catch {
      setSendState("failed");
    }
  }, [buildReport]);

  useEffect(() => {
    if (ready && phase === "done" && sendState === "idle") void send();
  }, [ready, phase, sendState, send]);

  const copyReport = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(buildReport(), null, 2));
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const restart = () => {
    setCode(newCode());
    setRecords(freshRecords());
    setStepIndex(0);
    setSetup({});
    setSendState("idle");
    setCopied(false);
    setPhase("setup");
    log.current = [];
    maxScale.current = 1;
  };

  if (!ready) return null;

  if (phase === "setup") {
    const choice = <K extends keyof Setup>(key: K, value: Setup[K], label: string) => (
      <button
        aria-pressed={setup[key] === value}
        className={`${buttonClass} aria-pressed:bg-primary aria-pressed:text-primary-foreground`}
        onClick={() => setSetup((current) => ({ ...current, [key]: value }))}
      >
        {label}
      </button>
    );
    return (
      <div className="fixed inset-0 flex flex-col gap-6 overflow-y-auto bg-background p-6 text-foreground">
        <h1 className="text-lg font-semibold">Gesture test</h1>
        <p className="text-sm text-muted-foreground">
          Ten short steps, about two minutes. Hold the device upright. The page records what happens; you only follow
          the instruction at the top of each step.
        </p>
        <div className="flex flex-col gap-2">
          <p className="text-sm">This device is a</p>
          <div className="flex gap-2">
            {choice("device", "phone", "Phone")}
            {choice("device", "tablet", "Tablet")}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-sm">To go to its home screen I normally</p>
          <div className="flex flex-wrap gap-2">
            {choice("navigation", "gestures", "Swipe up")}
            {choice("navigation", "buttons", "Tap a button")}
            {choice("navigation", "unsure", "Not sure")}
          </div>
        </div>
        <button
          className={`${primaryButtonClass} disabled:opacity-40`}
          disabled={!setup.device || !setup.navigation}
          onClick={() => setPhase("run")}
        >
          Start
        </button>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="fixed inset-0 flex flex-col gap-4 overflow-y-auto bg-background p-6 text-foreground">
        <h1 className="text-lg font-semibold">Done</h1>
        <p className="text-sm">
          {sendState === "sent"
            ? "Results sent. Tell Claude this code:"
            : sendState === "failed"
              ? "The results could not be sent. Tap Copy results and paste them into the chat instead."
              : "Sending results…"}
        </p>
        <p className="text-4xl font-semibold tracking-widest" data-testid="spike-code">
          {code}
        </p>
        <ul className="text-sm">
          {records.map((item) => (
            <li key={item.id}>
              {item.status === "pass" ? "✓" : "✗"} {item.id}
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-2">
          {sendState === "failed" ? (
            <button className={primaryButtonClass} onClick={() => void send()}>
              Try sending again
            </button>
          ) : null}
          <button className={buttonClass} onClick={copyReport}>
            {copied ? "Copied" : "Copy results"}
          </button>
          <button className={buttonClass} onClick={restart}>
            Run again
          </button>
        </div>
      </div>
    );
  }

  const passed = record.status === "pass";
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

      <div className="flex shrink-0 flex-col gap-2 border-b border-border bg-background p-3">
        <p className="text-xs text-muted-foreground">
          Step {stepIndex + 1} of {STEPS.length}
        </p>
        <p className="text-sm font-medium" data-testid="spike-instruction">
          {step.instruction}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {passed ? (
            <>
              <span className="text-sm" data-testid="spike-recorded">
                ✓ Recorded
              </span>
              <button className={primaryButtonClass} onClick={next}>
                Next
              </button>
            </>
          ) : step.kind === "question" ? (
            <>
              <button
                className={primaryButtonClass}
                onClick={() => {
                  finish("pass", "tester saw nothing");
                  next();
                }}
              >
                No, nothing else happened
              </button>
              <button
                className={buttonClass}
                onClick={() => {
                  finish("fail", "tester saw the browser or OS react");
                  next();
                }}
              >
                Yes, something happened
              </button>
            </>
          ) : step.kind === "confirm" ? (
            <button
              className={primaryButtonClass}
              onClick={() => {
                const zoomed = maxScale.current > 1.01;
                finish(zoomed ? "fail" : "pass", `max scale ${maxScale.current.toFixed(2)}`);
                next();
              }}
            >
              Done
            </button>
          ) : (
            <button className={buttonClass} onClick={giveUp}>
              It isn’t working, skip
            </button>
          )}
        </div>
      </div>

      <div className="relative min-h-0 flex-1">
        {view === "home" ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Home Screen</div>
        ) : (
          <div
            className={`relative flex h-full origin-bottom flex-col overflow-hidden bg-background ${
              paused ? "ring-4 ring-inset ring-primary" : ""
            }`}
            style={{
              transform: `scale(${scale})`,
              transition: progress > 0 ? "none" : "transform 200ms ease-out",
            }}
          >
            {step.content === "iframe" ? (
              <iframe title="Archived site" src="/website" className="min-h-0 w-full flex-1" />
            ) : step.content === "scroll" ? (
              <div
                className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
                data-testid="spike-scroll"
                onScroll={(event) => {
                  if (event.currentTarget.scrollTop > 60 && record.status === "pending") {
                    attempt("list scrolled", true);
                  }
                }}
              >
                {Array.from({ length: 40 }, (_, i) => (
                  <p key={i} className="border-b border-border p-4 text-sm">
                    Row {i + 1}
                  </p>
                ))}
              </div>
            ) : step.content === "text" ? (
              <p className="p-6 text-base">
                This paragraph is here to be double-tapped and pinched. On a real phone, apps do not zoom when you do
                that, so the simulated one should not either.
              </p>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                {view === "switcher" ? "App Switcher" : "An app"}
              </div>
            )}
            {paused ? (
              <div className="pointer-events-none absolute inset-x-0 top-4 flex justify-center">
                <span className={primaryButtonClass}>Let go</span>
              </div>
            ) : null}
          </div>
        )}

        {panel ? (
          <div className="absolute inset-0 flex items-center justify-center bg-background/90 text-sm">
            {panel === "control-center" ? "Control Center" : "Notification Center"}
          </div>
        ) : null}
      </div>

      {/* Simulated home indicator: inside the viewport, above the real one. */}
      <div
        role="button"
        aria-label="Home indicator"
        className="flex h-8 shrink-0 items-center justify-center bg-background"
        style={{ touchAction: "none" }}
        onPointerDown={(event) => {
          begin(event);
          setDragging(true);
        }}
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
