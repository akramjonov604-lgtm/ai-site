import { useEffect, useState } from "react";
import {
  PanelLeftOpen,
  PanelLeftClose,
  MessageSquarePlus,
  Trash2,
  History,
  Search,
  X,
} from "lucide-react";
import {
  listSessions,
  deleteSession,
  groupByDate,
  refreshSessionsFromBackend,
} from "@/lib/chat-history";

interface Props {
  userId: string | null | undefined;
  currentSessionId: string | null;
  refreshKey: number;
  /** When true (e.g. preview opened), the panel auto-collapses to the rail. */
  compact?: boolean;
  onSelect: (sessionId: string) => void;
  onNew: () => void;
}

export function HistoryPanel({
  userId,
  currentSessionId,
  refreshKey,
  compact = false,
  onSelect,
  onNew,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [sessions, setSessions] = useState(() => listSessions(userId));

  useEffect(() => {
    setSessions(listSessions(userId));
    if (!userId) return;
    let cancelled = false;
    refreshSessionsFromBackend(userId)
      .then((merged) => {
        if (!cancelled) setSessions(merged);
      })
      .catch(() => {
        // ignore — local list is already shown
      });
    return () => {
      cancelled = true;
    };
  }, [userId, refreshKey]);

  // Auto-collapse the expanded panel as soon as the workspace becomes compact
  // (i.e., a preview/project has opened on the right). This keeps the rail
  // visible but slides the wide panel back out of the way with animation.
  useEffect(() => {
    if (compact && open) {
      setOpen(false);
    }
  }, [compact, open]);

  // Close panel on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm("Bu suhbatni o'chirishni xohlaysizmi?")) return;
    deleteSession(userId, id);
    setSessions(listSessions(userId));
    if (currentSessionId === id) {
      onNew();
    }
  };

  const filtered = query.trim()
    ? sessions.filter((s) =>
        s.title.toLowerCase().includes(query.trim().toLowerCase()),
      )
    : sessions;
  const groups = groupByDate(filtered);

  const handleSelect = (sessionId: string) => {
    onSelect(sessionId);
    // Auto-collapse on mobile-ish widths
    if (window.innerWidth < 768) setOpen(false);
  };

  return (
    <>
      {/* Backdrop when expanded (subtle, only on small screens) */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/30 backdrop-blur-[2px] md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      {/* Always-visible thin rail on the LEFT edge */}
      <div
        className="fixed top-12 bottom-0 left-0 z-40 w-12 bg-zinc-950 border-r border-zinc-800 flex flex-col items-center justify-between py-3"
        data-testid="history-rail"
      >
        <div className="flex flex-col items-center gap-2">
          <RailButton
            label="Suhbatlar tarixi"
            active={open}
            onClick={() => setOpen((v) => !v)}
            testid="button-toggle-history"
          >
            <History className="w-4 h-4" />
          </RailButton>
          <RailButton
            label="Yangi suhbat"
            onClick={() => {
              onNew();
              setOpen(false);
            }}
            testid="button-rail-new"
          >
            <MessageSquarePlus className="w-4 h-4" />
          </RailButton>
        </div>

        <div className="flex flex-col items-center gap-2">
          <RailButton
            label={open ? "Panelni yopish" : "Panelni ochish"}
            active={open}
            onClick={() => setOpen((v) => !v)}
            testid="button-rail-toggle"
          >
            {open ? (
              <PanelLeftClose className="w-4 h-4" />
            ) : (
              <PanelLeftOpen className="w-4 h-4" />
            )}
          </RailButton>
        </div>
      </div>

      {/* Sliding panel anchored to the right of the rail */}
      <div
        className={`fixed top-12 bottom-0 left-12 z-30 w-[280px] bg-zinc-950/95 backdrop-blur border-r border-zinc-800 flex flex-col shadow-2xl transition-all duration-200 ease-out ${
          open
            ? "opacity-100 translate-x-0 pointer-events-auto"
            : "opacity-0 -translate-x-2 pointer-events-none"
        }`}
        data-testid="history-panel"
      >
        <div className="px-3 py-2.5 border-b border-zinc-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            <History className="w-4 h-4 text-purple-400" />
            <span>Suhbatlar tarixi</span>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
            title="Yopish"
            aria-label="Yopish"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-2.5 border-b border-zinc-800 space-y-2">
          <button
            type="button"
            onClick={() => {
              onNew();
              setOpen(false);
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-sm font-medium transition shadow"
            data-testid="button-new-chat"
          >
            <MessageSquarePlus className="w-4 h-4" />
            <span>Yangi suhbat</span>
          </button>
          {sessions.length > 4 && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Qidirish..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-purple-500/40"
              />
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 p-2 space-y-4">
          {sessions.length === 0 ? (
            <div className="px-3 py-10 text-center text-zinc-500 text-sm">
              Hali suhbatlar yo'q.
              <br />
              Birinchi suhbatingizni boshlang!
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-3 py-10 text-center text-zinc-500 text-sm">
              Hech narsa topilmadi
            </div>
          ) : (
            groups.map((group) => (
              <div key={group.label} className="space-y-1">
                <div className="px-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  {group.label}
                </div>
                {group.items.map((item) => {
                  const active = item.id === currentSessionId;
                  return (
                    <div
                      key={item.id}
                      className={`group relative rounded-lg px-2 py-2 cursor-pointer transition flex items-center gap-2 ${
                        active
                          ? "bg-purple-500/15 border border-purple-500/30"
                          : "hover:bg-zinc-900 border border-transparent"
                      }`}
                      onClick={() => handleSelect(item.id)}
                      data-testid={`history-item-${item.id}`}
                    >
                      <div className="flex-1 min-w-0">
                        <div
                          className={`text-sm truncate ${
                            active ? "text-white" : "text-zinc-300"
                          }`}
                        >
                          {item.title || "Yangi suhbat"}
                        </div>
                        <div className="text-[10px] text-zinc-500 mt-0.5">
                          {formatTime(item.updatedAt)}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, item.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition"
                        title="O'chirish"
                        aria-label="O'chirish"
                        data-testid={`button-delete-${item.id}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="px-3 py-2 border-t border-zinc-800 text-[10px] text-zinc-600 text-center">
          Suhbatlar brauzeringizda saqlanadi
        </div>
      </div>
    </>
  );
}

function RailButton({
  children,
  label,
  active,
  onClick,
  testid,
}: {
  children: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
  testid?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      data-testid={testid}
      className={`group relative w-9 h-9 rounded-lg flex items-center justify-center transition ${
        active
          ? "bg-purple-500/15 text-purple-300 border border-purple-500/30"
          : "text-zinc-400 hover:text-white hover:bg-zinc-800 border border-transparent"
      }`}
    >
      {children}
      <span className="pointer-events-none absolute left-full ml-2 px-2 py-1 rounded bg-zinc-800 border border-zinc-700 text-zinc-100 text-[11px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-50">
        {label}
      </span>
    </button>
  );
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) {
    return d.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("uz-UZ", {
    day: "2-digit",
    month: "short",
  });
}
