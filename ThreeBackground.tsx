import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import {
  PanelLeft,
  Home,
  Settings,
  Bell,
  Terminal,
  Palette,
  HelpCircle,
  LogOut,
  ChevronRight,
  Check,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme";

export function MenuDropdown() {
  const [open, setOpen] = useState(false);
  const [submenu, setSubmenu] = useState<"theme" | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const [, navigate] = useLocation();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSubmenu(null);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (submenu) setSubmenu(null);
        else setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, submenu]);

  const { signOut } = useAuth();

  const handleLogout = async () => {
    setOpen(false);
    try {
      await signOut();
      navigate("/");
    } catch {
      // ignore
    }
  };

  const go = (path: string) => {
    setOpen(false);
    setSubmenu(null);
    navigate(path);
  };

  const themeLabel =
    theme === "system" ? "Tizim" : theme === "light" ? "Yorug'" : "Qorong'i";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-9 h-9 rounded-lg flex items-center justify-center text-zinc-300 hover:text-white hover:bg-white/10 transition"
        title="Menyu"
        aria-label="Menyuni ochish"
      >
        <PanelLeft className="w-5 h-5" />
      </button>

      {open && (
        <div className="absolute left-0 top-11 w-64 rounded-xl bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/60 shadow-2xl shadow-black/60 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {submenu === "theme" ? (
            <>
              <button
                onClick={() => setSubmenu(null)}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-zinc-400 hover:bg-white/5 transition border-b border-zinc-800"
              >
                <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                Mavzu
              </button>
              <ThemeOption
                label="Yorug'"
                icon={<Sun className="w-4 h-4" />}
                active={theme === "light"}
                onClick={() => {
                  setTheme("light");
                  setSubmenu(null);
                }}
              />
              <ThemeOption
                label="Qorong'i"
                icon={<Moon className="w-4 h-4" />}
                active={theme === "dark"}
                onClick={() => {
                  setTheme("dark");
                  setSubmenu(null);
                }}
              />
              <ThemeOption
                label="Tizim"
                icon={<Monitor className="w-4 h-4" />}
                active={theme === "system"}
                onClick={() => {
                  setTheme("system");
                  setSubmenu(null);
                }}
              />
            </>
          ) : (
            <>
              <MenuItem icon={<Home className="w-4 h-4" />} label="Bosh sahifa" onClick={() => go("/")} />
              <MenuItem icon={<Settings className="w-4 h-4" />} label="Sozlamalar" onClick={() => go("/settings")} />
              <MenuItem icon={<Bell className="w-4 h-4" />} label="Bildirishnomalar" onClick={() => go("/notifications")} />
              <MenuItem icon={<Terminal className="w-4 h-4" />} label="CLUI" onClick={() => go("/clui")} />
              <MenuItem
                icon={<Palette className="w-4 h-4" />}
                label="Mavzu"
                trailing={
                  <span className="flex items-center gap-1 text-zinc-500 text-xs">
                    {themeLabel} <ChevronRight className="w-3 h-3" />
                  </span>
                }
                onClick={() => setSubmenu("theme")}
              />
              <MenuItem
                icon={<HelpCircle className="w-4 h-4" />}
                label="Yordam"
                onClick={() => go("/help")}
              />
              <div className="h-px bg-zinc-800 my-1" />
              <MenuItem
                icon={<LogOut className="w-4 h-4" />}
                label="Chiqish"
                onClick={handleLogout}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}

function MenuItem({
  icon,
  label,
  trailing,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  trailing?: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-zinc-200 hover:bg-white/5 transition text-left"
    >
      <span className="text-zinc-400">{icon}</span>
      <span className="flex-1">{label}</span>
      {trailing}
    </button>
  );
}

function ThemeOption({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-zinc-200 hover:bg-white/5 transition text-left"
    >
      <span className="text-zinc-400">{icon}</span>
      <span className="flex-1">{label}</span>
      {active && <Check className="w-4 h-4 text-purple-400" />}
    </button>
  );
}
