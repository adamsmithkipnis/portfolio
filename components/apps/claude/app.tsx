"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { WindowControls } from "@/components/window-controls";
import { useWindowNavBehavior } from "@/lib/use-window-nav-behavior";
import { EXAMPLE_CHATS, EXAMPLE_CHATS_READY } from "@/data/claude/example-chats";
import { loadClaudeChats, saveClaudeChats, titleFromFirstMessage } from "@/lib/claude/chat-storage";
import { CLAUDE_STARTERS } from "@/lib/claude/starters";
import { describeStreamError, streamClaudeReply } from "@/lib/claude/stream-client";
import type { ClaudeAction, ClaudeChat, ClaudeMessage } from "@/lib/claude/types";
import { trimConversationHistory } from "@/lib/messages/history-window";
import { loadClaudeView, saveClaudeView } from "@/lib/sidebar-persistence";
import { cn } from "@/lib/utils";
import { ArtifactPane } from "./artifact-pane";
import { Composer } from "./composer";
import { Conversation } from "./conversation";
import { Sidebar } from "./sidebar";
import { ClaudeSpark } from "./spark";

interface AppProps {
  isDesktop: boolean;
  inShell: boolean;
  onOpenApp?: (appId: string, target?: string) => void;
}

const EXAMPLES = EXAMPLE_CHATS_READY ? EXAMPLE_CHATS : [];

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

function greeting(now = new Date()): string {
  const hour = now.getHours();
  if (hour < 5) return "Up late?";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function App({ isDesktop, inShell, onOpenApp }: AppProps) {
  const isMobile = !isDesktop;
  const nav = useWindowNavBehavior({ isDesktop, isMobile });

  const [chats, setChats] = useState<ClaudeChat[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [artifactId, setArtifactId] = useState<string | null>(null);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "chat">("chat");
  const abortRef = useRef<AbortController | null>(null);

  // Load durable chats and the tab's view state once, on the client.
  useEffect(() => {
    const stored = loadClaudeChats();
    const view = loadClaudeView();
    setChats(stored);
    const knownIds = new Set([...stored, ...EXAMPLES].map((c) => c.id));
    if (view.chatId && knownIds.has(view.chatId)) setActiveChatId(view.chatId);
    if (view.artifactId) setArtifactId(view.artifactId);
    setHydrated(true);
    return () => abortRef.current?.abort();
  }, []);

  useEffect(() => {
    if (hydrated) saveClaudeView({ chatId: activeChatId, artifactId });
  }, [hydrated, activeChatId, artifactId]);

  // Persist whenever no reply is mid-stream, so storage never holds half a reply.
  useEffect(() => {
    if (hydrated && !streamingMessageId) saveClaudeChats(chats);
  }, [hydrated, chats, streamingMessageId]);

  const example = useMemo(() => EXAMPLES.find((c) => c.id === activeChatId) ?? null, [activeChatId]);
  const activeChat = example ?? chats.find((c) => c.id === activeChatId) ?? null;

  const artifact = useMemo(() => {
    if (!artifactId || !activeChat) return null;
    for (const message of activeChat.messages) {
      const found = message.actions?.find(
        (a): a is Extract<ClaudeAction, { type: "artifact" }> => a.type === "artifact" && a.id === artifactId
      );
      if (found) return found;
    }
    return null;
  }, [activeChat, artifactId]);

  const runAction = useCallback(
    (action: ClaudeAction) => {
      if (action.type === "artifact") {
        setArtifactId(action.id);
        return;
      }
      const target = action.type === "open_case_study" ? action.archivePath : action.path;
      onOpenApp?.("safari", target);
    },
    [onOpenApp]
  );

  const updateMessage = useCallback(
    (chatId: string, messageId: string, update: (m: ClaudeMessage) => ClaudeMessage) => {
      setChats((prev) =>
        prev.map((chat) =>
          chat.id !== chatId
            ? chat
            : {
                ...chat,
                updatedAt: Date.now(),
                messages: chat.messages.map((m) => (m.id === messageId ? update(m) : m)),
              }
        )
      );
    },
    []
  );

  const send = useCallback(
    async (text: string) => {
      if (streamingMessageId) return;
      const now = Date.now();
      const userMessage: ClaudeMessage = { id: newId(), role: "user", content: text, createdAt: now };
      const reply: ClaudeMessage = { id: newId(), role: "assistant", content: "", createdAt: now };

      const existing = example ? null : chats.find((c) => c.id === activeChatId) ?? null;
      const chatId = existing?.id ?? newId();
      const history = [...(existing?.messages ?? []), userMessage];

      setChats((prev) =>
        existing
          ? prev.map((c) =>
              c.id === chatId ? { ...c, updatedAt: now, messages: [...c.messages, userMessage, reply] } : c
            )
          : [
              {
                id: chatId,
                title: titleFromFirstMessage(text),
                createdAt: now,
                updatedAt: now,
                messages: [userMessage, reply],
              },
              ...prev,
            ]
      );
      setActiveChatId(chatId);
      setArtifactId(null);
      setMobileView("chat");
      setStreamingMessageId(reply.id);

      const controller = new AbortController();
      abortRef.current = controller;

      // Failed replies stay on screen but are not sent back as context.
      const sendable = trimConversationHistory(
        history.filter((m) => !m.error && m.content.trim().length > 0)
      ).map(({ role, content }) => ({ role, content }));

      let failed = false;
      let gotContent = false;
      await streamClaudeReply(
        sendable,
        {
          onText: (delta) => {
            gotContent = true;
            updateMessage(chatId, reply.id, (m) => ({ ...m, content: m.content + delta }));
          },
          onAction: (action) => {
            gotContent = true;
            updateMessage(chatId, reply.id, (m) => ({ ...m, actions: [...(m.actions ?? []), action] }));
            runAction(action);
          },
          onError: (reason, retryAfterSeconds) => {
            failed = true;
            const note = describeStreamError(reason, retryAfterSeconds);
            updateMessage(chatId, reply.id, (m) => ({
              ...m,
              error: true,
              content: m.content ? `${m.content}\n\n_${note}_` : note,
            }));
          },
        },
        controller.signal
      );

      if (!failed && !gotContent && !controller.signal.aborted) {
        updateMessage(chatId, reply.id, (m) => ({
          ...m,
          error: true,
          content: describeStreamError("empty_reply"),
        }));
      }
      if (abortRef.current === controller) abortRef.current = null;
      setStreamingMessageId(null);
    },
    [activeChatId, chats, example, runAction, streamingMessageId, updateMessage]
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const startNewChat = useCallback(() => {
    if (streamingMessageId) abortRef.current?.abort();
    setActiveChatId(null);
    setArtifactId(null);
    setMobileView("chat");
  }, [streamingMessageId]);

  const selectChat = useCallback(
    (id: string) => {
      if (streamingMessageId) abortRef.current?.abort();
      setActiveChatId(id);
      setArtifactId(null);
      setMobileView("chat");
    },
    [streamingMessageId]
  );

  const deleteChat = useCallback(
    (id: string) => {
      if (id === activeChatId) {
        if (streamingMessageId) abortRef.current?.abort();
        setActiveChatId(null);
        setArtifactId(null);
      }
      setChats((prev) => prev.filter((c) => c.id !== id));
    },
    [activeChatId, streamingMessageId]
  );

  const windowControls = isDesktop ? (
    <div onMouseDown={(e) => e.stopPropagation()}>
      <WindowControls
        inShell={nav.inShell}
        showWhenNotInShell={!isMobile}
        className="p-2 -ml-2"
        onClose={nav.onClose}
        onMinimize={nav.onMinimize}
        onToggleMaximize={nav.onToggleMaximize}
        isMaximized={nav.isMaximized}
        closeLabel={nav.closeLabel}
      />
    </div>
  ) : null;

  const sidebar = (
    <Sidebar
      isMobile={isMobile}
      examples={EXAMPLES}
      chats={chats}
      activeChatId={activeChatId}
      onSelect={selectChat}
      onNewChat={startNewChat}
      onDelete={deleteChat}
      header={windowControls}
      onHeaderMouseDown={nav.onDragStart}
    />
  );

  const isStreaming = streamingMessageId !== null;

  const main = (
    <section className="relative flex min-h-0 min-w-0 flex-1 flex-col bg-[var(--claude-base)]">
      <header
        className="flex h-[44px] shrink-0 items-center gap-2 px-4 select-none"
        onMouseDown={nav.onDragStart}
        data-window-drag-handle={nav.onDragStart ? "true" : undefined}
      >
        {isMobile && (
          <button
            type="button"
            onClick={() => setMobileView("list")}
            className="-ml-1 flex items-center gap-0.5 text-[var(--claude-text)]"
          >
            <ChevronLeft size={24} />
            <span className="sr-only">Chats</span>
          </button>
        )}
        {/* With a document open the sidebar folds away, as in Claude's own
            client, so the window controls move up here. */}
        {isDesktop && artifact && <div className="shrink-0">{windowControls}</div>}
        <h1 className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--claude-text)]">
          {activeChat?.title ?? ""}
        </h1>
      </header>

      {activeChat ? (
        <>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <Conversation
              messages={activeChat.messages}
              streamingMessageId={streamingMessageId}
              onRunAction={runAction}
            />
          </div>
          <div className="mx-auto w-full max-w-[720px] px-5 pb-3">
            {example ? (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--claude-border)] px-4 py-3 text-sm text-[var(--claude-text-subdued)]">
                <span>An example from Adam&apos;s own work with Claude.</span>
                <button
                  type="button"
                  onClick={startNewChat}
                  className="shrink-0 font-medium text-[var(--claude-text)] underline underline-offset-2"
                >
                  Start a new chat
                </button>
              </div>
            ) : (
              <Composer onSend={send} onStop={stop} isStreaming={isStreaming} placeholder="Reply to Claude" />
            )}
            <Disclosure />
          </div>
        </>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-5 pb-10">
          <div className="w-full max-w-[640px]">
            <h2 className="mb-6 flex items-center justify-center gap-3 text-center font-serif text-[32px] leading-tight text-[var(--claude-text)]">
              <ClaudeSpark className="h-8 w-8 shrink-0" />
              {hydrated ? greeting() : "Hello"}
            </h2>
            <Composer onSend={send} onStop={stop} isStreaming={isStreaming} autoFocus={isDesktop} />
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {CLAUDE_STARTERS.map((starter) => (
                <button
                  key={starter.label}
                  type="button"
                  onClick={() => send(starter.prompt)}
                  className="rounded-lg border border-[var(--claude-border)] px-3 py-1.5 text-sm text-[var(--claude-text-subdued)] can-hover:hover:bg-[var(--claude-hover)] can-hover:hover:text-[var(--claude-text)]"
                >
                  {starter.label}
                </button>
              ))}
            </div>
            <Disclosure />
          </div>
        </div>
      )}

      {isMobile && artifact && (
        <ArtifactPane artifact={artifact} onClose={() => setArtifactId(null)} isMobile />
      )}
    </section>
  );

  if (isMobile) {
    return (
      <div className="relative flex h-full w-full flex-col overflow-hidden bg-[var(--claude-base)]">
        {mobileView === "list" ? sidebar : main}
      </div>
    );
  }

  return (
    <div className={cn("flex h-full w-full", !inShell && "rounded-lg")}>
      {!artifact && sidebar}
      {main}
      {artifact && <ArtifactPane artifact={artifact} onClose={() => setArtifactId(null)} isMobile={false} />}
    </div>
  );
}

function Disclosure() {
  return (
    <p className="mt-2 text-center text-xs text-[var(--claude-text-subdued)]">
      A simulated Claude app. Answers come from Adam&apos;s portfolio and can be wrong.
    </p>
  );
}
