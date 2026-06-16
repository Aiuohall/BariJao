// Email delivery for OTP codes.
//
// Two delivery methods, in priority order:
//   1) Brevo HTTP API (recommended on Render/most free hosts): set BREVO_API_KEY.
//      Works over HTTPS (port 443), so it is NOT blocked like SMTP is.
//   2) SMTP via nodemailer (e.g. Gmail): set SMTP_USER + SMTP_PASS.
//      NOTE: many free hosts (including Render free) block outbound SMTP ports,
//      which makes this hang/fail. Prefer Brevo there.
//
// If neither is configured, the OTP is just logged to the console (dev fallback).
import nodemailer from "nodemailer";

const BREVO_API_KEY = process.env.BREVO_API_KEY || "";

const SMTP_USER = process.env.SMTP_USER || process.env.GMAIL_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || "";
const SMTP_HOST = process.env.SMTP_HOST || "";
const SMTP_PORT = Number(process.env.SMTP_PORT) || 587;
const SMTP_SECURE = process.env.SMTP_SECURE === "true";

const EMAIL_FROM =
  process.env.EMAIL_FROM || (SMTP_USER ? `BariJao <${SMTP_USER}>` : "BariJao");

// Pull a bare email address out of "Name <a@b.com>" (or accept a bare address).
function parseFromAddress(): { name: string; email: string } {
  const raw = EMAIL_FROM.trim();
  const match = raw.match(/^(.*?)\s*<([^>]+)>$/);
  if (match) return { name: match[1].trim() || "BariJao", email: match[2].trim() };
  return { name: "BariJao", email: raw };
}

const SENDER_EMAIL =
  process.env.BREVO_SENDER || parseFromAddress().email || SMTP_USER;

// Short timeouts so a blocked/slow SMTP connection can never hang the request.
let transporter: nodemailer.Transporter | null = null;
if (SMTP_USER && SMTP_PASS) {
  const timeouts = {
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 10000,
  };
  transporter = SMTP_HOST
    ? nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_SECURE,
        auth: { user: SMTP_USER, pass: SMTP_PASS },
        ...timeouts,
      })
    : nodemailer.createTransport({
        service: "gmail",
        auth: { user: SMTP_USER, pass: SMTP_PASS },
        ...timeouts,
      });
}

export const emailEnabled = !!BREVO_API_KEY || !!transporter;

const subject = "Your BariJao verification code";
const textBody = (otp: string) =>
  `Your BariJao verification code is ${otp}. It expires in 5 minutes.`;
const htmlBody = (otp: string) => `
  <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #eee;border-radius:12px">
    <h2 style="color:#059669;margin:0 0 8px">BariJao</h2>
    <p style="color:#374151">Use this code to verify your account:</p>
    <div style="font-size:32px;font-weight:800;letter-spacing:6px;color:#111827;margin:16px 0">${otp}</div>
    <p style="color:#6b7280;font-size:13px">This code expires in 5 minutes. If you didn't request it, ignore this email.</p>
  </div>`;

async function sendViaBrevo(to: string, otp: string): Promise<boolean> {
  const { name } = parseFromAddress();
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": BREVO_API_KEY,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      sender: { name, email: SENDER_EMAIL },
      to: [{ email: to }],
      subject,
      textContent: textBody(otp),
      htmlContent: htmlBody(otp),
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Brevo ${res.status}: ${detail}`);
  }
  return true;
}

async function sendViaSmtp(to: string, otp: string): Promise<boolean> {
  await transporter!.sendMail({
    from: EMAIL_FROM,
    to,
    subject,
    text: textBody(otp),
    html: htmlBody(otp),
  });
  return true;
}

// Returns a promise, but callers should NOT block their HTTP response on it —
// call it fire-and-forget so a slow email provider never delays the user.
export async function sendOtpEmail(to: string, otp: string): Promise<boolean> {
  // Always log so the code is recoverable from server logs as a last resort.
  console.log(`OTP for ${to}: ${otp}`);

  try {
    if (BREVO_API_KEY) {
      await sendViaBrevo(to, otp);
      console.log(`OTP email sent to ${to} via Brevo`);
      return true;
    }
    if (transporter) {
      await sendViaSmtp(to, otp);
      console.log(`OTP email sent to ${to} via SMTP`);
      return true;
    }
    console.warn(
      "Email not configured (set BREVO_API_KEY, or SMTP_USER + SMTP_PASS). OTP only logged above."
    );
    return false;
  } catch (e: any) {
    console.error(`Failed to send OTP email to ${to}:`, e.message);
    return false;
  }
}
