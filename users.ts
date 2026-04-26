import { Router, type IRouter } from "express";
import { GoogleGenAI } from "@google/genai";
import {
  getActiveKey,
  rotateAfterFailure,
  recordKeyUsage,
  recordMessage,
  getCacheSignal,
} from "../lib/admin-store";

const router: IRouter = Router();

const SYSTEM_PROMPT = `Sen Base55 AI - to'liq imkoniyatli dasturlash yordamchisisan. Foydalanuvchilarga o'zbek tilida yordam ber.

SHAXSIY MAXFIYLIK:
- Sen "Base55 AI"san. Hech qachon o'zingni Google, Gemini, OpenAI, GPT yoki boshqa kompaniyaning modeli deb tanitma.
- Hech qachon "men sun'iy intellekt modelman", "men Google tomonidan tayyorlangan" yoki shu kabi gaplarni AYTMA.
- "Seni kim yaratdi?" deb so'rashsa: "Meni Base55 jamoasi yaratgan, men sizga dasturlash bo'yicha yordam berishga moslangan AI yordamchiman" deb javob ber.
- Texnik tafsilotlar (qaysi model, qaysi API) so'ralsa: "Bu Base55 AI'ning ichki tizimi" deb o'tib ket.

QOIDALAR:
1. Har doim faqat O'ZBEK TILIDA javob ber.
2. Foydalanuvchi sendan biror narsa yaratishni so'raganda - kod yozish kerak.
3. Foydalanuvchi savol bersa yoki shunchaki suhbat qursa - kod yozma, faqat matn bilan javob ber.
4. Sen ISTALGAN dasturlash tilida kod yoza olasan: HTML, CSS, JavaScript, TypeScript, React, Next.js, Vue, Svelte, Python, Django, Flask, FastAPI, Node.js, Express, Nest.js, PHP, Laravel, Java, Spring, C#, .NET, Go, Rust, Ruby, Rails, Kotlin, Swift, C, C++, SQL, Bash, Dockerfile va boshqa 100+ tillar — barchasi sening qo'lingdan keladi.
5. Backend ham, frontend ham, ma'lumotlar bazasi sxemasi ham, mobil ilova ham, CLI utiliti ham yoza olasan. HECH QACHON "men faqat frontend qila olaman" yoki shunga o'xshash so'zlarni AYTMA. Sen to'liq stack dasturchi yordamchisisan.

LOYIHA TURLARI:
A) Faqat FRONTEND so'ralsa (HTML/CSS/JS) — fayllar standalone bo'lishi kerak. Hech qanday backend chaqiruv (fetch('/api/...')) bo'lmasin. Demo ma'lumotlarni JS ichida hard-coded saqla.
B) Faqat BACKEND so'ralsa (masalan, "Python Flask API yarat") — faqat backend fayllarini yoz, HTML qo'shma. Foydalanuvchi kodni nusxa olib, o'z kompyuterida ishga tushiradi.
C) FULL-STACK so'ralsa — backend va frontend fayllarni alohida yoz, lekin frontend fetch chaqiruvlarini try/catch ichida o'rab qo'y va xato bo'lsa demo ma'lumotni ko'rsatsin (chunki preview brauzerda ishlaydi, real backend yo'q).

KOD YOZISH FORMATI:
Kod yozishingiz kerak bo'lganda, avval qisqa o'zbek tilida tushuntirish ber (1-3 jumla), so'ng quyidagi formatda fayllarni yoz. HAR DOIM <file path="..."> teglarini ishlat.

Misollar:

<file path="index.html">
<!DOCTYPE html>
<html>...</html>
</file>

<file path="style.css">
body { ... }
</file>

<file path="app.py">
from flask import Flask
app = Flask(__name__)

@app.route("/")
def index():
    return "Salom dunyo"

if __name__ == "__main__":
    app.run(debug=True)
</file>

<file path="server.js">
const express = require("express");
const app = express();
app.get("/", (req, res) => res.send("Salom"));
app.listen(3000);
</file>

<file path="schema.sql">
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL
);
</file>

<file path="Dockerfile">
FROM node:20-alpine
WORKDIR /app
...
</file>

MUHIM:
- Faqat HTML/CSS/JS bilan ishlovchi loyiha so'ralsa — preview avtomatik ochiladi va ishga tushadi.
- Backend yoki boshqa til so'ralsa — fayllarni shu tarzda yoz, foydalanuvchi ularni ko'rib, nusxa ko'chirib ishlatadi. Ishga tushirish bo'yicha qisqa ko'rsatma ber (masalan "python app.py" yoki "node server.js").
- Kodni har doim TO'LIQ va ISHLAYDIGAN qilib yoz, "..." yoki "qolgan qism shu yerda" deb yozma.
- Bir loyihada bir necha fayl bo'lishi mumkin — har birini alohida <file> blokida yoz.
- Fayl tarkibida hech qachon "</file>" yozma.
- Tashqi kutubxonalar uchun kerakli o'rnatish buyrug'ini (pip install ..., npm install ...) tushuntirishda ayt.
- Dizayn va kod sifati zamonaviy va chiroyli bo'lsin.

Agar foydalanuvchi kodni o'zgartirishni so'rasa - qaytadan to'liq fayllarni yangi versiyada yoz.`;

// Cached SDK clients per key, recreated when admin clears cache.
let cachedClients = new Map<string, GoogleGenAI>();
let cachedSignal = -1;

function getClient(apiKey: string): GoogleGenAI {
  const sig = getCacheSignal();
  if (sig !== cachedSignal) {
    cachedClients = new Map();
    cachedSignal = sig;
  }
  let client = cachedClients.get(apiKey);
  if (!client) {
    client = new GoogleGenAI({ apiKey });
    cachedClients.set(apiKey, client);
  }
  return client;
}

router.post("/chat", async (req, res) => {
  const messages = req.body?.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "messages talab qilinadi" });
    return;
  }

  const userInfo = (req.body?.user ?? {}) as {
    uid?: string;
    email?: string;
    displayName?: string;
  };

  const ip =
    (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ||
    req.socket.remoteAddress ||
    null;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders?.();

  const send = (data: unknown) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  const lastUserMsg =
    [...(messages as Array<{ role: string; content: string }>)]
      .reverse()
      .find((m) => m.role === "user")?.content ?? "";
  const promptTokensApprox = Math.ceil(lastUserMsg.length / 4);
  let outputTokensApprox = 0;
  let hadError = false;

  try {
    const contents = (messages as Array<{ role: string; content: string }>).map(
      (m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }),
    );

    const models = [
      "gemini-2.5-flash-lite",
      "gemini-2.0-flash",
      "gemini-2.5-flash",
    ];

    const BUSY_MESSAGE =
      "Hozircha barcha agentlar band. Iltimos, biroz vaqtdan keyin qayta urinib ko'ring.";

    let active = getActiveKey();
    if (!active) {
      hadError = true;
      send({ type: "error", error: BUSY_MESSAGE });
      return;
    }

    let attempts = 0;
    const maxKeyAttempts = 5;
    let streamed = false;
    let lastErr: unknown = null;

    keyLoop: while (active && attempts < maxKeyAttempts) {
      attempts += 1;
      const ai = getClient(active.key);
      let keyError = false;

      for (const model of models) {
        try {
          const stream = await ai.models.generateContentStream({
            model,
            contents,
            config: {
              systemInstruction: SYSTEM_PROMPT,
              temperature: 0.7,
            },
          });

          for await (const chunk of stream) {
            const text = chunk.text;
            if (text) {
              streamed = true;
              outputTokensApprox += Math.ceil(text.length / 4);
              send({ type: "text", text });
            }
          }
          send({ type: "done" });
          recordKeyUsage(active.id, false);
          lastErr = null;
          break keyLoop;
        } catch (err: unknown) {
          lastErr = err;
          const msg = err instanceof Error ? err.message : "";
          const isQuota = /429|quota|rate|exceed|RESOURCE_EXHAUSTED/i.test(msg);
          const isInvalid = /API key|invalid|unauthorized|permission/i.test(msg) && !isQuota;
          req.log.warn({ err, model, keyId: active.id }, "Gemini model failed");

          if (streamed) {
            // Already streamed something to client; can't retry safely.
            recordKeyUsage(active.id, true);
            break keyLoop;
          }

          if (isQuota || isInvalid) {
            keyError = true;
            recordKeyUsage(active.id, true);
            const next = rotateAfterFailure(active.id, isInvalid ? "invalid" : "quota");
            // Silently rotate — don't surface internal key details to end users.
            active = next;
            break; // break model loop to use next key
          }
          // Non-quota error in current model — just try next model with same key
        }
      }

      if (!keyError) break;
    }

    if (lastErr && !streamed) {
      hadError = true;
      req.log.error({ err: lastErr }, "Gemini chat error");
      send({ type: "error", error: BUSY_MESSAGE });
    }
  } catch (err: unknown) {
    hadError = true;
    req.log.error({ err }, "Gemini chat error (outer)");
    send({
      type: "error",
      error:
        "Hozircha barcha agentlar band. Iltimos, biroz vaqtdan keyin qayta urinib ko'ring.",
    });
  } finally {
    recordMessage({
      uid: userInfo.uid,
      email: userInfo.email,
      displayName: userInfo.displayName,
      ip,
      tokensApprox: promptTokensApprox + outputTokensApprox,
      error: hadError,
    });
    res.end();
  }
});

export default router;
