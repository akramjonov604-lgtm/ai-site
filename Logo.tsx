import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { ArrowUp, FileCode, Loader2, Square } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ParsedFile } from "@/lib/parse-files";
import { Logo } from "./Logo";

export interface UIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  files: ParsedFile[];
  prose: string;
  done: boolean;
}

interface Props {
  messages: UIMessage[];
  isStreaming: boolean;
  compact: boolean;
  onSend: (text: string) => void;
  onStop?: () => void;
}

export function ChatPanel({ messages, isStreaming, compact, onSend, onStop }: Props) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isStreaming]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const t = input.trim();
    if (!t || isStreaming) return;
    onSend(t);
    setInput("");
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as FormEvent);
    }
  };

  const isEmpty = messages.length === 0;
  const lastMsg = messages[messages.length - 1];

  return (
    <div className="flex flex-col h-full">
      <div ref={scrollRef} className="flex-1 overflow-y-auto min-h-0">
        {isEmpty ? (
          <EmptyState compact={compact} onPick={(t) => setInput(t)} />
        ) : (
          <div className={`${compact ? "px-3 py-3" : "max-w-3xl mx-auto px-4 py-8"} space-y-5`}>
            {messages.map((m) => {
              const isLastAssistant =
                m.role === "assistant" && m.id === lastMsg?.id && isStreaming;
              return (
                <MessageBubble
                  key={m.id}
                  message={m}
                  compact={compact}
                  isStreaming={isLastAssistant}
                />
              );
            })}
            {isStreaming && lastMsg?.role === "user" && (
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg flex-shrink-0 overflow-hidden">
                  <Logo size={28} />
                </div>
                <div className="flex items-center gap-2 text-zinc-400 text-sm pt-1">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>O'ylamoqda</span>
                  <span className="dot-flashing" aria-hidden />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className={`${compact ? "p-2.5 pt-1.5 border-t border-zinc-800/60" : "max-w-3xl mx-auto w-full px-4 pb-6"}`}>
        <form
          onSubmit={handleSubmit}
          className="relative bg-zinc-900 border border-zinc-800 rounded-2xl shadow-lg focus-within:border-purple-500/50 focus-within:ring-2 focus-within:ring-purple-500/20 transition"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            placeholder="Nima qurmoqchisiz?"
            rows={compact ? 2 : 3}
            disabled={isStreaming}
            className="w-full bg-transparent text-white placeholder:text-zinc-500 px-4 py-3 pr-14 resize-none focus:outline-none disabled:opacity-60 text-sm"
          />
          <div className="absolute right-2 bottom-2">
            {isStreaming ? (
              <button
                type="button"
                onClick={onStop}
                className="w-9 h-9 rounded-xl bg-zinc-700 hover:bg-zinc-600 text-white flex items-center justify-center transition"
                title="To'xtatish"
              >
                <Square className="w-4 h-4 fill-current" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

function EmptyState({ compact, onPick }: { compact: boolean; onPick: (t: string) => void }) {
  const examples = [
    "Hisoblagich yarat",
    "To-do ilovasi qil",
    "Python Flask API yarat",
    "Tic-tac-toe o'yini",
  ];

  if (compact) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-full text-center gap-3">
        <Logo size={48} />
        <h2 className="text-white font-semibold">Suhbat boshlang</h2>
        <p className="text-zinc-400 text-sm">
          Nima qurmoqchi ekanligingizni yozing
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 flex flex-col items-center text-center">
      <div className="mb-6">
        <Logo size={72} className="drop-shadow-[0_0_30px_rgba(168,85,247,0.4)]" />
      </div>
      <h1 className="text-4xl font-bold text-white mb-3">
        Bugun nimani quramiz?
      </h1>
      <p className="text-zinc-400 text-lg mb-10">
        Frontend, backend, ma'lumotlar bazasi — istalgan tilda yarataman
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
        {examples.map((ex) => (
          <button
            key={ex}
            onClick={() => onPick(ex)}
            className="text-left px-4 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-xl text-zinc-300 text-sm transition"
          >
            {ex}
          </button>
        ))}
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  compact,
  isStreaming,
}: {
  message: UIMessage;
  compact: boolean;
  isStreaming: boolean;
}) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className={`${compact ? "max-w-full" : "max-w-[80%]"} bg-zinc-800 text-white px-4 py-2.5 rounded-2xl rounded-br-md text-sm whitespace-pre-wrap`}>
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2.5">
      <div className="w-7 h-7 rounded-lg flex-shrink-0 overflow-hidden">
        <Logo size={28} />
      </div>
      <div className="flex-1 min-w-0 space-y-3">
        {message.prose && (
          <div className="text-zinc-200 text-sm leading-relaxed stream-text markdown-body">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => (
                  <p className="my-2 first:mt-0 last:mb-0">{children}</p>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-white">{children}</strong>
                ),
                em: ({ children }) => (
                  <em className="italic text-zinc-100">{children}</em>
                ),
                ul: ({ children }) => (
                  <ul className="my-2 ml-1 space-y-1 list-disc list-inside marker:text-purple-400">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="my-2 ml-1 space-y-1 list-decimal list-inside marker:text-purple-400 marker:font-semibold">
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className="text-zinc-200">{children}</li>
                ),
                h1: ({ children }) => (
                  <h1 className="text-base font-bold text-white mt-3 mb-1.5">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-sm font-bold text-white mt-3 mb-1.5">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-sm font-semibold text-zinc-100 mt-2 mb-1">
                    {children}
                  </h3>
                ),
                a: ({ children, href }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-300 underline decoration-purple-500/40 hover:decoration-purple-300 transition"
                  >
                    {children}
                  </a>
                ),
                code: ({ children, className }) => {
                  const isBlock = (className ?? "").includes("language-");
                  if (isBlock) {
                    return (
                      <code className="block bg-zinc-900/80 border border-zinc-800 rounded-lg p-3 my-2 text-[12px] font-mono text-zinc-100 overflow-x-auto whitespace-pre">
                        {children}
                      </code>
                    );
                  }
                  return (
                    <code className="px-1.5 py-0.5 rounded bg-zinc-800/80 border border-zinc-700/60 text-[12px] font-mono text-purple-200">
                      {children}
                    </code>
                  );
                },
                pre: ({ children }) => <>{children}</>,
                blockquote: ({ children }) => (
                  <blockquote className="border-l-2 border-purple-500/50 pl-3 my-2 text-zinc-300 italic">
                    {children}
                  </blockquote>
                ),
                hr: () => <hr className="my-3 border-zinc-800" />,
                table: ({ children }) => (
                  <div className="overflow-x-auto my-2">
                    <table className="text-xs border-collapse">{children}</table>
                  </div>
                ),
                th: ({ children }) => (
                  <th className="border border-zinc-800 px-2 py-1 bg-zinc-900 text-zinc-100 font-semibold text-left">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="border border-zinc-800 px-2 py-1 text-zinc-200">
                    {children}
                  </td>
                ),
              }}
            >
              {message.prose}
            </ReactMarkdown>
            {isStreaming && message.prose && !message.files.length && (
              <span className="typing-caret" aria-hidden>▍</span>
            )}
          </div>
        )}
        {message.files.length > 0 && (
          <div className="space-y-1.5">
            {message.files.map((f, i) => (
              <div
                key={`${f.path}-${i}`}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm"
              >
                <FileCode className="w-4 h-4 text-purple-400 flex-shrink-0" />
                <span className="text-zinc-300 font-mono text-xs flex-1 truncate">
                  {f.path}
                </span>
                {f.complete ? (
                  <span className="text-emerald-400 text-xs">✓</span>
                ) : (
                  <Loader2 className="w-3 h-3 text-purple-400 animate-spin" />
                )}
              </div>
            ))}
            {isStreaming && (
              <div className="text-xs text-zinc-500 flex items-center gap-1.5 pt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                Kod yozilmoqda...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
