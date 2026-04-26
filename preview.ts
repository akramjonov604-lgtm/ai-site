import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import {
  verifyAdminLogin,
  verifySession,
  logoutSession,
  listKeysSafe,
  addKey,
  deleteKey,
  setActiveKey,
  toggleKey,
  getOverview,
  searchUsers,
  clearGeminiCache,
  getAdminEmail,
} from "../lib/admin-store";

const router: IRouter = Router();

function getToken(req: Request): string | null {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith("Bearer ")) return auth.slice(7);
  const headerToken = req.headers["x-admin-token"];
  if (typeof headerToken === "string") return headerToken;
  return null;
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const token = getToken(req);
  if (!verifySession(token)) {
    res.status(401).json({ error: "Avtorizatsiyadan o'tmagan" });
    return;
  }
  next();
}

router.post("/admin/login", (req, res) => {
  const { email, password } = (req.body ?? {}) as { email?: string; password?: string };
  if (!email || !password) {
    res.status(400).json({ error: "Email va parol talab qilinadi" });
    return;
  }
  const token = verifyAdminLogin(email, password);
  if (!token) {
    res.status(401).json({ error: "Email yoki parol noto'g'ri" });
    return;
  }
  res.json({ token, email: getAdminEmail() });
});

router.post("/admin/logout", (req, res) => {
  logoutSession(getToken(req));
  res.json({ ok: true });
});

router.get("/admin/me", (req, res) => {
  const token = getToken(req);
  res.json({ authenticated: verifySession(token), email: getAdminEmail() });
});

router.get("/admin/overview", requireAdmin, (_req, res) => {
  res.json(getOverview());
});

router.get("/admin/users", requireAdmin, (req, res) => {
  const q = typeof req.query.q === "string" ? req.query.q : "";
  const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50));
  res.json({ users: searchUsers(q, limit) });
});

router.get("/admin/keys", requireAdmin, (_req, res) => {
  res.json({ keys: listKeysSafe() });
});

router.post("/admin/keys", requireAdmin, (req, res) => {
  const { label, key } = (req.body ?? {}) as { label?: string; key?: string };
  if (!key || typeof key !== "string" || key.trim().length < 8) {
    res.status(400).json({ error: "Yaroqli kalit kiriting" });
    return;
  }
  const entry = addKey(label ?? "", key);
  const { key: _omit, ...safe } = entry;
  void _omit;
  res.json({ key: safe });
});

router.delete("/admin/keys/:id", requireAdmin, (req, res) => {
  const id = String(req.params.id ?? "");
  const ok = deleteKey(id);
  if (!ok) {
    res.status(404).json({ error: "Kalit topilmadi" });
    return;
  }
  res.json({ ok: true });
});

router.post("/admin/keys/:id/activate", requireAdmin, (req, res) => {
  const id = String(req.params.id ?? "");
  const ok = setActiveKey(id);
  if (!ok) {
    res.status(404).json({ error: "Kalit topilmadi" });
    return;
  }
  res.json({ ok: true });
});

router.post("/admin/keys/:id/toggle", requireAdmin, (req, res) => {
  const id = String(req.params.id ?? "");
  const { active } = (req.body ?? {}) as { active?: boolean };
  const ok = toggleKey(id, Boolean(active));
  if (!ok) {
    res.status(404).json({ error: "Kalit topilmadi" });
    return;
  }
  res.json({ ok: true });
});

router.post("/admin/cache/clear", requireAdmin, (_req, res) => {
  const result = clearGeminiCache();
  res.json(result);
});

export default router;
