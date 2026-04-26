import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Send, Loader2, Sparkles } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";

const QUICK_IDEAS = [
  "Pomidor taymeri ilovasi",
  "Sodda kalkulyator",
  "Quyosh tizimi animatsiyasi",
  "Tez-tez beriladigan savollar sahifasi",
  "Rang generatori",
];

export const PENDING_PROMPT_KEY = "base55:pending-prompt";

export function PromptBox() {
  const [prompt, setPrompt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const submit = (override?: string) => {
    const finalPrompt = (override ?? prompt).trim();
    if (!finalPrompt) return;
    setSubmitting(true);
    try {
      sessionStorage.setItem(PENDING_PROMPT_KEY, finalPrompt);
    } catch {
      // ignore
    }
    if (user) {
      navigate("/chat");
    } else {
      navigate("/signup");
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      submit();
    }
  };

  const isMac =
    typeof navigator !== "undefined" && navigator.platform.includes("Mac");

  return (
    <div className="w-full max-w-3xl">
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="relative"
      >
        <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-violet-600/40 via-fuchsia-500/30 to-violet-600/40 opacity-50 blur-2xl" />
        <div className="relative glass-strong rounded-3xl p-1.5">
          <div className="rounded-[22px] bg-[#0c0a14]/85 p-5">
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="G'oyangizni yozing — Base55 AI uni hayotga olib chiqadi..."
              rows={3}
              className="w-full resize-none border-0 bg-transparent text-base text-white placeholder:text-zinc-500 focus:outline-none focus:ring-0"
            />

            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <Sparkles className="h-3.5 w-3.5 text-violet-300" />
                <span>Base55 AI yordamida</span>
              </div>

              <div className="flex items-center gap-3">
                <span className="hidden text-[11px] text-zinc-500 sm:inline">
                  {isMac ? "⌘" : "Ctrl"} + Enter
                </span>
                <motion.button
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => submit()}
                  disabled={submitting || !prompt.trim()}
                  className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-violet-500 via-fuchsia-500 to-purple-600 text-white shadow-lg shadow-violet-500/40 disabled:opacity-50 disabled:cursor-not-allowed pulse-glow"
                  aria-label="Yuborish"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 -translate-x-px" />
                  )}
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.6 }}
        className="mt-6 flex flex-wrap items-center justify-center gap-2"
      >
        {QUICK_IDEAS.map((idea) => (
          <button
            key={idea}
            type="button"
            onClick={() => {
              setPrompt(idea);
              textareaRef.current?.focus();
            }}
            className="rounded-full border border-white/10 bg-white/[0.02] px-4 py-1.5 text-xs text-zinc-400 hover:text-white transition-colors hover-elevate active-elevate-2"
          >
            {idea}
          </button>
        ))}
      </motion.div>
    </div>
  );
}
