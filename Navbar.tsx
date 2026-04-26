import { useEffect, useMemo, useRef } from "react";
import { Files, FileCode2, Loader2, Sparkles } from "lucide-react";
import type { ParsedFile } from "@/lib/parse-files";

interface Props {
  files: ParsedFile[];
  isStreaming: boolean;
  activeIndex: number;
  onSelect: (i: number) => void;
}

const langForExt = (path: string): string => {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    html: "HTML", htm: "HTML",
    css: "CSS", scss: "SCSS",
    js: "JavaScript", mjs: "JavaScript", cjs: "JavaScript",
    ts: "TypeScript", tsx: "TSX", jsx: "JSX",
    py: "Python", rb: "Ruby", php: "PHP",
    java: "Java", kt: "Kotlin", swift: "Swift",
    go: "Go", rs: "Rust", c: "C", cpp: "C++", cs: "C#",
    sql: "SQL", json: "JSON", yaml: "YAML", yml: "YAML",
    md: "Markdown", sh: "Bash", dockerfile: "Docker",
    vue: "Vue", svelte: "Svelte",
  };
  return map[ext] || ext.toUpperCase() || "Fayl";
};

export function FilesPanel({ files, isStreaming, activeIndex, onSelect }: Props) {
  const writingIdx = files.findIndex((f) => !f.complete);
  const liveTailRef = useRef<HTMLDivElement>(null);
  const writing = writingIdx >= 0 ? files[writingIdx] : null;

  useEffect(() => {
    liveTailRef.current?.scrollTo({
      top: liveTailRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [writing?.content]);

  const livePreview = writing
    ? writing.content.split("\n").slice(-12).join("\n")
    : "";

  // Generate stable random sparkle positions for the active writing file row.
  const sparkles = useMemo(
    () =>
      Array.from({ length: 6 }).map((_, i) => ({
        key: i,
        left: 40 + Math.random() * 50,
        top: 8 + Math.random() * 24,
        dx: (Math.random() - 0.5) * 30,
        dy: -10 - Math.random() * 20,
        delay: Math.random() * 1.4,
      })),
    [writingIdx],
  );

  return (
    <div className="relative flex flex-col h-full bg-zinc-950 border-l border-zinc-800/70 overflow-hidden">
      {/* Animated progress bar — only while AI is writing */}
      {isStreaming && (
        <div className="ai-progress-track h-[3px] flex-shrink-0" />
      )}

      <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800/70 bg-zinc-900/40">
        <Files className="w-4 h-4 text-purple-400" />
        <span className="text-sm font-semibold text-zinc-200">Fayllar</span>
        {isStreaming && (
          <span className="ai-text-shimmer text-[10px] font-semibold uppercase tracking-wider ml-1">
            yozilmoqda
          </span>
        )}
        <span className="ml-auto text-xs text-zinc-500">
          {files.length} ta
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {files.length === 0 ? (
          <div className="text-center text-zinc-500 text-xs py-8 px-4">
            Hali fayl yo'q. AI yozishni boshlasa, ular shu yerda paydo bo'ladi.
          </div>
        ) : (
          <div className="space-y-1.5">
            {files.map((f, i) => {
              const isActive = i === activeIndex;
              const isWriting = !f.complete;
              return (
                <button
                  key={`${f.path}-${i}`}
                  onClick={() => onSelect(i)}
                  className={`relative w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-sm transition border ${
                    isWriting
                      ? "bg-zinc-900/80 border-purple-500/0 text-white ai-ring-pulse"
                      : isActive
                        ? "bg-purple-500/10 border-purple-500/40 text-white"
                        : "border-transparent text-zinc-300 hover:bg-zinc-900 hover:border-zinc-800"
                  }`}
                >
                  {/* Sparkles only on the file currently being written */}
                  {isWriting &&
                    sparkles.map((s) => (
                      <span
                        key={s.key}
                        className="ai-sparkle"
                        style={
                          {
                            left: `${s.left}%`,
                            top: `${s.top}px`,
                            animationDelay: `${s.delay}s`,
                            ["--dx" as string]: `${s.dx}px`,
                            ["--dy" as string]: `${s.dy}px`,
                          } as React.CSSProperties
                        }
                      />
                    ))}

                  <FileCode2
                    className={`w-4 h-4 flex-shrink-0 ${
                      isWriting
                        ? "text-fuchsia-300"
                        : isActive
                          ? "text-purple-300"
                          : "text-zinc-500"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div
                      className={`font-mono text-xs truncate ${
                        isWriting ? "ai-text-shimmer font-semibold" : ""
                      }`}
                    >
                      {f.path}
                    </div>
                    <div className="text-[10px] text-zinc-500">
                      {langForExt(f.path)} ·{" "}
                      {isWriting
                        ? `${f.content.length} bayt yozilmoqda...`
                        : `${f.content.length} bayt`}
                    </div>
                  </div>
                  {isWriting ? (
                    <div className="relative flex-shrink-0">
                      <Loader2 className="w-3.5 h-3.5 text-fuchsia-300 animate-spin" />
                      <Sparkles className="w-2.5 h-2.5 text-purple-300 absolute -top-1 -right-1 animate-ping" />
                    </div>
                  ) : (
                    <span className="text-emerald-400 text-xs flex-shrink-0">✓</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Live writing tail */}
      {isStreaming && writing && (
        <div className="relative border-t border-zinc-800/70 bg-zinc-900/60 flex-shrink-0 overflow-hidden">
          {/* Aurora bar at the top of this section */}
          <div className="absolute top-0 left-0 right-0 h-[2px] ai-aurora-bar pointer-events-none" />

          <div className="flex items-center gap-2 px-3 pt-2.5 pb-1.5">
            <span className="relative flex w-2 h-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-fuchsia-400 opacity-75 animate-ping" />
              <span className="relative inline-flex w-2 h-2 rounded-full bg-purple-400" />
            </span>
            <span className="ai-text-shimmer text-[11px] font-mono font-semibold truncate">
              {writing.path}
            </span>
            <span className="ml-auto text-[10px] text-fuchsia-300 font-semibold uppercase tracking-wider">
              jonli
            </span>
          </div>

          <div
            ref={liveTailRef}
            className="relative px-3 pb-3 max-h-40 overflow-y-auto"
          >
            <pre className="text-[11px] leading-snug font-mono text-zinc-300 whitespace-pre-wrap break-all">
              {livePreview}
              <span className="typing-caret">▍</span>
            </pre>
            <div className="ai-scan-line" />
          </div>
        </div>
      )}
    </div>
  );
}
