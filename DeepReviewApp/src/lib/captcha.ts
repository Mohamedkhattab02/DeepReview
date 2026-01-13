// src/lib/captcha.ts
"use server";

import crypto from "crypto";

const SECRET = process.env.CAPTCHA_SECRET_KEY || "change-me-in-env";
const TTL_MS = 10 * 60 * 1000; // 10 minutes

function b64url(input: string) {
  return Buffer.from(input).toString("base64url");
}

function sign(data: string) {
  return crypto.createHmac("sha256", SECRET).update(data).digest("base64url");
}

export async function generateCaptcha(): Promise<{ question: string; token: string }> {
  const a = Math.floor(Math.random() * 9) + 1;
  const b = Math.floor(Math.random() * 9) + 1;

  // Keep it simple: + or -
  const ops = ["+", "-"] as const;
  const op = ops[Math.floor(Math.random() * ops.length)];

  const answer = op === "+" ? a + b : a - b;
  const question = `${a} ${op} ${b} = ?`;

  const payloadObj = { answer, ts: Date.now() };
  const payload = b64url(JSON.stringify(payloadObj));
  const sig = sign(payload);

  return { question, token: `${payload}.${sig}` };
}

export async function verifyCaptcha(token: string, userAnswerRaw: string): Promise<boolean> {
  if (!token || !userAnswerRaw) return false;

  const parts = token.split(".");
  if (parts.length !== 2) return false;

  const [payload, sig] = parts;

  // signature check
  const expected = sign(payload);
  const okSig = crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  if (!okSig) return false;

  // parse payload
  let data: { answer: number; ts: number };
  try {
    data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return false;
  }

  // expiry
  if (Date.now() - data.ts > TTL_MS) return false;

  // answer check
  const userAnswer = Number(userAnswerRaw);
  if (!Number.isFinite(userAnswer)) return false;

  return userAnswer === data.answer;
}
