import fs from "node:fs";
import path from "node:path";

const DATA_DIR = path.resolve(process.cwd(), ".data", "history");
const MAX_SESSIONS_PER_USER = 200;
const MAX_TITLE_LEN = 60;

export interface HistoryMessage {
  id: string;
  role: string;
  content: string;
  createdAt?: number;
  files?: Array<{ path: string; content: string }>;
  [key: string]: unknown;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: HistoryMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface SessionIndexEntry {
  id: string;
  title: string;
  updatedAt: number;
  createdAt: number;
}

interface UserHistoryFile {
  index: SessionIndexEntry[];
  sessions: Record<string, ChatSession>;
}

function safeUid(uid: string): string {
  // strict whitelist for filesystem safety
  return uid.replace(/[^A-Za-z0-9_-]/g, "_").slice(0, 80);
}

function userFilePath(uid: string): string {
  return path.join(DATA_DIR, `${safeUid(uid)}.json`);
}

function ensureDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readUserFile(uid: string): UserHistoryFile {
  try {
    ensureDir();
    const fp = userFilePath(uid);
    if (!fs.existsSync(fp)) return { index: [], sessions: {} };
    const raw = fs.readFileSync(fp, "utf8");
    const parsed = JSON.parse(raw) as Partial<UserHistoryFile>;
    return {
      index: Array.isArray(parsed.index) ? parsed.index : [],
      sessions:
        parsed.sessions && typeof parsed.sessions === "object"
          ? parsed.sessions
          : {},
    };
  } catch {
    return { index: [], sessions: {} };
  }
}

function writeUserFile(uid: string, file: UserHistoryFile) {
  ensureDir();
  const tmp = userFilePath(uid) + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(file));
  fs.renameSync(tmp, userFilePath(uid));
}

function deriveTitle(messages: HistoryMessage[]): string {
  const firstUser = messages.find((m) => m.role === "user");
  const text = (firstUser?.content ?? "").trim();
  if (!text) return "Yangi suhbat";
  if (text.length <= MAX_TITLE_LEN) return text;
  return text.slice(0, MAX_TITLE_LEN).trim() + "…";
}

export function listHistory(uid: string): SessionIndexEntry[] {
  const file = readUserFile(uid);
  return [...file.index].sort((a, b) => b.updatedAt - a.updatedAt);
}

export function loadHistory(uid: string, sessionId: string): ChatSession | null {
  const file = readUserFile(uid);
  return file.sessions[sessionId] ?? null;
}

export function saveHistory(
  uid: string,
  session: ChatSession,
): SessionIndexEntry | null {
  if (!session?.id || !Array.isArray(session.messages)) return null;
  if (session.messages.length === 0) return null;

  const file = readUserFile(uid);
  const title = deriveTitle(session.messages);
  const now = Date.now();
  const finalSession: ChatSession = {
    id: session.id,
    title,
    messages: session.messages,
    createdAt: session.createdAt || now,
    updatedAt: now,
  };

  file.sessions[finalSession.id] = finalSession;
  const entry: SessionIndexEntry = {
    id: finalSession.id,
    title,
    updatedAt: finalSession.updatedAt,
    createdAt: finalSession.createdAt,
  };
  const idx = file.index.findIndex((e) => e.id === finalSession.id);
  if (idx >= 0) file.index[idx] = entry;
  else file.index.push(entry);

  // cap per-user storage: drop oldest sessions beyond limit
  if (file.index.length > MAX_SESSIONS_PER_USER) {
    file.index.sort((a, b) => b.updatedAt - a.updatedAt);
    const dropped = file.index.splice(MAX_SESSIONS_PER_USER);
    for (const d of dropped) {
      delete file.sessions[d.id];
    }
  }

  writeUserFile(uid, file);
  return entry;
}

export function deleteHistory(uid: string, sessionId: string): boolean {
  const file = readUserFile(uid);
  if (!file.sessions[sessionId]) return false;
  delete file.sessions[sessionId];
  file.index = file.index.filter((e) => e.id !== sessionId);
  writeUserFile(uid, file);
  return true;
}

export function clearHistory(uid: string): number {
  const file = readUserFile(uid);
  const n = file.index.length;
  writeUserFile(uid, { index: [], sessions: {} });
  return n;
}
