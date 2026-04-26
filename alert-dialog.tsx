import { useEffect, useMemo, useState } from "react";
import {
  Loader2,
  Globe,
  RefreshCw,
  Smartphone,
  Monitor,
  Code2,
  Eye,
  ArrowLeft,
  ArrowRight,
  Link2,
  Check,
  ExternalLink,
} from "lucide-react";
import type { ParsedFile } from "@/lib/parse-files";
import { buildPreviewHtml } from "@/lib/parse-files";
import { CodeViewer } from "./CodeViewer";

interface Props {
  files: ParsedFile[];
  isGenerating: boolean;
  activeIndex?: number;
  onSelectFile?: (i: number) => void;
}

const BACKEND_EXT = /\.(py|rb|php|java|kt|swift|go|rs|cs|cpp|c|sql|sh|dockerfile)$/i;

export function PreviewPanel({
  files,
  isGenerating,
  activeIndex = 0,
  onSelectFile,
}: Props) {
  const [iframeKey, setIframeKey] = useState(0);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [html, setHtml] = useState<string | null>(null);
  const [externalUrl, setExternalUrl] = useState<string | null>(null);
  const [hostingId, setHostingId] = useState<string | null>(null);
  const [hosting, setHosting] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const allComplete = files.length > 0 && files.every((f) => f.complete);
  const hasHtml = files.some((f) => /\.html?$/i.test(f.path));
  const hasBackend = files.some(
    (f) =>
      BACKEND_EXT.test(f.path) ||
      (/\.(js|ts)$/i.test(f.path) &&
        /(express|require\(|import .+ from)/.test(f.content)),
  );
  const previewIsViable = hasHtml && !hasBackend;
  const previewReady = !isGenerating && allComplete && previewIsViable;

  const [view, setView] = useState<"preview" | "code">(
    previewIsViable ? "preview" : "code",
  );

  useEffect(() => {
    setView(previewIsViable ? "preview" : "code");
  }, [previewIsViable]);

  useEffect(() => {
    if (previewReady) {
      setHtml(buildPreviewHtml(files));
      setHostingId(null);
      setExternalUrl(null);
    }
  }, [previewReady, files]);

  const apiBase = import.meta.env.BASE_URL.replace(/\/$/, "");

  // Lazily upload the rendered HTML to the API server so we can produce a
  // shareable, full-domain URL the user can open in a new tab.
  const ensureHosted = async (): Promise<string | null> => {
    if (!html) return null;
    if (hostingId) {
      return `${window.location.origin}${apiBase}/p/${hostingId}`;
    }
    setHosting(true);
    try {
      const res = await fetch(`${apiBase}/api/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html }),
      });
      if (!res.ok) throw new Error("Hosting failed");
      const json = (await res.json()) as { id: string };
      setHostingId(json.id);
      const full = `${window.location.origin}${apiBase}/p/${json.id}`;
      setExternalUrl(full);
      return full;
    } catch {
      return null;
    } finally {
      setHosting(false);
    }
  };

  const onOpenNewTab = async () => {
    // Open a placeholder window synchronously so popup blockers stay happy.
    const win = window.open("about:blank", "_blank");
    const url = await ensureHosted();
    if (url && win) {
      win.location.href = url;
    } else if (url) {
      window.location.href = url;
    } else if (win) {
      win.close();
    }
  };

  const onCopyLink = async () => {
    const url = (await ensureHosted()) ?? `${window.location.origin}${apiBase}`;
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  const displayUrl = useMemo(() => {
    // Cosmetic, branded URL shown in the chrome bar so the user sees Base55
    // instead of the raw hosting domain. The actual link opens the live URL.
    if (hostingId) {
      return `base55.app/p/${hostingId}`;
    }
    if (previewReady) {
      return "base55.app/p/  —  yangi havola tayyor";
    }
    return "base55.app  —  preview tayyorlanmoqda";
  }, [hostingId, previewReady]);

  return (
    <div className="relative flex flex-col h-full bg-zinc-950">
      {/* Aurora progress strip while AI is writing — runs across the very top */}
      {isGenerating && (
        <div className="ai-progress-track h-[3px] flex-shrink-0 z-10" />
      )}
      {/* Tab bar (preview / code switch) */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-900/50 flex-shrink-0">
        <div className="flex items-center gap-3 text-sm text-zinc-300">
          {hasHtml && previewIsViable ? (
            <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-zinc-800/60 border border-zinc-700/60">
              <button
                onClick={() => setView("preview")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition ${
                  view === "preview"
                    ? "bg-zinc-700 text-white"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                Ko'rinish
              </button>
              <button
                onClick={() => setView("code")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition ${
                  view === "code"
                    ? "bg-zinc-700 text-white"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                Kod
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-purple-400" />
              <span className="font-medium">Loyiha kodlari</span>
              {hasBackend && (
                <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30">
                  full-stack
                </span>
              )}
              <span className="text-xs text-zinc-500 ml-1">
                {files.length} fayl
              </span>
            </div>
          )}
        </div>

        {view === "preview" && previewIsViable && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setDevice("desktop")}
              className={`p-1.5 rounded transition ${
                device === "desktop"
                  ? "bg-zinc-700 text-white"
                  : "text-zinc-400 hover:bg-zinc-800"
              }`}
              title="Desktop"
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDevice("mobile")}
              className={`p-1.5 rounded transition ${
                device === "mobile"
                  ? "bg-zinc-700 text-white"
                  : "text-zinc-400 hover:bg-zinc-800"
              }`}
              title="Mobile"
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Browser chrome bar (only for the live preview) */}
      {view === "preview" && previewIsViable && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-zinc-800 bg-zinc-900/30 flex-shrink-0">
          <button
            disabled
            className="p-1 rounded text-zinc-600 cursor-default"
            title="Orqaga"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button
            disabled
            className="p-1 rounded text-zinc-600 cursor-default"
            title="Oldinga"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIframeKey((k) => k + 1)}
            disabled={!previewReady || !html}
            className="p-1 rounded text-zinc-400 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
            title="Yangilash"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <div className="flex-1 mx-2 flex items-center gap-2 px-3 py-1 rounded-lg bg-zinc-950/80 border border-zinc-800 min-w-0">
            <Link2 className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
            <span className="text-xs text-zinc-300 font-mono truncate">
              {displayUrl}
            </span>
          </div>

          <button
            onClick={onCopyLink}
            disabled={!previewReady || hosting}
            className="p-1.5 rounded text-zinc-400 hover:bg-zinc-800 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition"
            title="Havolani nusxalash"
          >
            {linkCopied ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Link2 className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={onOpenNewTab}
            disabled={!previewReady || hosting}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed transition"
            title="Yangi oynada ochish"
          >
            {hosting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <ExternalLink className="w-3.5 h-3.5" />
            )}
            <span className="hidden md:inline">Yangi oynada</span>
          </button>
        </div>
      )}

      <div className="flex-1 relative overflow-hidden bg-zinc-900/50">
        {/* Soft scan-line over the entire code/preview area while writing */}
        {isGenerating && (
          <div className="absolute inset-0 pointer-events-none z-20">
            <div className="ai-scan-line" />
          </div>
        )}
        {view === "code" || !previewIsViable ? (
          <CodeViewer
            files={files}
            activeIndex={activeIndex}
            onSelect={onSelectFile}
          />
        ) : !previewReady || !html ? (
          <LoadingState files={files} isGenerating={isGenerating} />
        ) : (
          <div className="w-full h-full flex items-center justify-center p-4">
            <div
              className={`bg-white rounded-lg shadow-2xl overflow-hidden transition-all ${
                device === "mobile"
                  ? "w-[390px] h-[700px] max-h-full"
                  : "w-full h-full"
              }`}
            >
              <iframe
                key={iframeKey}
                srcDoc={html}
                className="w-full h-full border-0"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                title="Preview"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingState({
  files,
  isGenerating,
}: {
  files: ParsedFile[];
  isGenerating: boolean;
}) {
  const currentFile = files[files.length - 1];

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center p-8 gap-6">
      <div className="relative">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 flex items-center justify-center">
          <Globe className="w-10 h-10 text-purple-400" />
        </div>
        <div className="absolute -inset-4 bg-purple-500/10 rounded-3xl blur-2xl animate-pulse" />
      </div>

      <div className="text-center">
        <div className="text-white font-medium text-lg mb-1">
          {isGenerating ? "Loyiha yaratilmoqda..." : "Loyiha tayyorlanmoqda..."}
        </div>
        <div className="text-zinc-400 text-sm">
          {currentFile
            ? `${currentFile.path} fayli yozilmoqda`
            : "Fayllar tayyorlanmoqda"}
        </div>
      </div>

      {files.length > 0 && (
        <div className="w-full max-w-md space-y-1.5">
          {files.map((f, i) => (
            <div
              key={`${f.path}-${i}`}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-900/60 border border-zinc-800 text-sm"
            >
              {f.complete ? (
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
              ) : (
                <Loader2 className="w-3 h-3 text-purple-400 animate-spin" />
              )}
              <span className="text-zinc-300 font-mono text-xs flex-1 truncate">
                {f.path}
              </span>
              <span className="text-zinc-500 text-xs">
                {f.complete ? "tayyor" : "yozilmoqda"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
