import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { LogOut, MessageSquare, User as UserIcon } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { smoothScrollToId } from "@/lib/scroll";
import { Logo } from "@/components/Logo";

const SECTIONS = [
  { id: "features", label: "Imkoniyatlar" },
  { id: "how", label: "Qanday ishlaydi" },
  { id: "pricing", label: "Narxlar" },
  { id: "faq", label: "Savollar" },
];

export function Navbar() {
  const { user, loading, signOut } = useAuth();
  const [location, navigate] = useLocation();
  const isHome = location === "/" || location === "";

  const goSection = (id: string) => {
    if (isHome) {
      smoothScrollToId(id);
    } else {
      navigate(`/#${id}`);
      setTimeout(() => smoothScrollToId(id), 50);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch {
      // ignore
    }
    navigate("/");
  };

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed left-0 right-0 top-0 z-40 px-4"
    >
      <div className="mx-auto mt-4 flex max-w-7xl items-center justify-between rounded-2xl glass-strong px-5 py-3">
        <Link href="/" className="flex items-center gap-2.5">
          <motion.div
            whileHover={{ rotate: 8, scale: 1.05 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="drop-shadow-[0_0_18px_rgba(168,85,247,0.45)]"
          >
            <Logo size={36} />
          </motion.div>
          <span className="text-lg font-bold tracking-tight">
            <span className="text-gradient">Base55 AI</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {SECTIONS.map((s) => (
            <button
              type="button"
              key={s.id}
              onClick={() => goSection(s.id)}
              className="rounded-full px-3 py-1.5 text-sm text-zinc-400 hover:text-white transition-colors hover-elevate active-elevate-2"
            >
              {s.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {loading ? (
            <div className="h-9 w-24 animate-pulse rounded-lg bg-white/5" />
          ) : user ? (
            <>
              <button
                type="button"
                onClick={() => navigate("/chat")}
                className="hidden sm:inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm text-zinc-200 hover-elevate active-elevate-2"
              >
                <MessageSquare className="h-4 w-4" />
                Chat
              </button>
              <div className="hidden md:flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 text-sm text-zinc-200">
                <UserIcon className="h-4 w-4 text-violet-300" />
                <span className="max-w-[140px] truncate">
                  {user.email?.split("@")[0]}
                </span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-sm text-zinc-200 hover-elevate active-elevate-2"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Chiqish</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="rounded-full px-4 py-1.5 text-sm text-zinc-200 hover-elevate active-elevate-2"
              >
                Kirish
              </button>
              <button
                type="button"
                onClick={() => navigate("/signup")}
                className="rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-1.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/30 hover:opacity-95"
              >
                Ro'yxatdan o'tish
              </button>
            </>
          )}
        </div>
      </div>
    </motion.header>
  );
}
