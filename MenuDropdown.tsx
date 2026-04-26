import { useEffect, useRef, useState } from "react";
import { Copy, Check, FileCode } from "lucide-react";
import type { ParsedFile } from "@/lib/parse-files";

interface Props {
  files: ParsedFile[];
  activeIndex?: number;
  onSelect?: (i: number) => void;
}

export function CodeViewer({ files, activeIndex, onSelect }: Props) {
  const [internal, setInternal] = useState(0);
  const [copied, setCopied] = useState(false);
  const tailRef = useRef<HTMLPreElement>(null);

  const active =
    typeof activeIndex === "number" && activeIndex >= 0 && activeIndex < files.length
      ? activeIndex
      : Math.min(internal, Math.max(0, files.length - 1));

  const setActive = (i: number) => {
    if (onSelect) onSelect(i);
    else setInternal(i);
  };

  // Auto-scroll to bottom while a file is being written so the user sees live writing.
  const file = files[active];
  useEffect(() => {
    if (file && !file.complete) {
      tailRef.current?.scrollTo({
        top: tailRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [file?.content, file?.complete]);

  if (files.length === 0) return null;

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(file.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      <div className="flex items-stretch gap-1 px-2 pt-2 border-b border-zinc-800 bg-zinc-900/50 overflow-x-auto">
        {files.map((f, i) => (
          <button
            key={`${f.path}-${i}`}
            onClick={() => setActive(i)}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-mono rounded-t-lg transition whitespace-nowrap ${
              i === active
                ? "bg-zinc-950 text-white border-t border-x border-zinc-800"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
            }`}
          >
            <FileCode className="w-3.5 h-3.5 text-purple-400" />
            {f.path}
            {!f.complete && (
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
            )}
          </button>
        ))}
        <div className="ml-auto flex items-center pr-2">
          <button
            onClick={onCopy}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition"
            title="Nusxa olish"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                Olindi
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Nusxa
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-[#0a0a0f]">
        <pre
          ref={tailRef}
          className="p-4 text-[13px] leading-relaxed font-mono text-zinc-200 whitespace-pre min-w-full h-full overflow-auto"
        >
          <code>
            {file.content || "// Yozilmoqda..."}
            {!file.complete && (
              <span className="typing-caret" aria-hidden>▍</span>
            )}
          </code>
        </pre>
      </div>
    </div>
  );
}
