// Email delivery for OTP codes.
//
// Two delivery methods, in priority order:
//   1) Brevo HTTP API (recommended on Render/most free hosts): set BREVO_API_KEY.
//      Works over HTTPS (port 443), so it is NOT blocked like SMTP is.
//   2) SMTP via nodemailer (e.g. Gmail): set SMTP_USER + SMTP_PASS.
//      NOTE: many free hosts (including Render free) block outbound SMTP ports,
//      which makes this hang/fail. Prefer Brevo there.
//
// If neither is configured, the OTP is just logged to the console (dev fallback)
// and sendOtpEmail() reports ok:false so the API can tell the user the truth
// instead of claiming "OTP sent to your email".
import nodemailer from "nodemailer";

const BREVO_API_KEY = (process.env.BREVO_API_KEY || "").trim();

const SMTP_USER = (process.env.SMTP_USER || process.env.GMAIL_USER || "").trim();
// Google shows app passwords as "abcd efgh ijkl mnop". Pasting them with the
// spaces is the single most common cause of "Invalid login" / no mail arriving,
// so strip all whitespace here.
const SMTP_PASS = (process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || "").replace(/\s+/g, "");
const SMTP_HOST = (process.env.SMTP_HOST || "").trim();
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

const SENDER_EMAIL = (
  process.env.BREVO_SENDER || parseFromAddress().email || SMTP_USER
).trim();

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

// Which provider will actually be used, for /api/health and startup logs.
export const emailProvider: "brevo" | "smtp" | "none" = BREVO_API_KEY
  ? "brevo"
  : transporter
  ? "smtp"
  : "none";

// Config problems we can detect without sending anything. Surfaced at startup
// and via /api/health so a broken setup is obvious instead of silent.
export function emailConfigProblems(): string[] {
  const problems: string[] = [];
  if (emailProvider === "none") {
    problems.push(
      "No email provider configured. Set BREVO_API_KEY (recommended), or SMTP_USER + SMTP_PASS."
    );
    return problems;
  }
  if (emailProvider === "brevo" && !/^\S+@\S+\.\S+$/.test(SENDER_EMAIL)) {
    problems.push(
      `Brevo sender address is invalid ("${SENDER_EMAIL}"). Set EMAIL_FROM="BariJao <you@example.com>" ` +
        "or BREVO_SENDER to an address verified in your Brevo account."
    );
  }
  if (emailProvider === "smtp" && !SMTP_HOST && !/@gmail\.com$/i.test(SMTP_USER)) {
    problems.push(
      `SMTP_USER "${SMTP_USER}" is not a Gmail address but SMTP_HOST is not set, so the Gmail ` +
        "service preset will be used and will fail. Set SMTP_HOST/SMTP_PORT for other providers."
    );
  }
  return problems;
}

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

async function sendViaBrevo(to: string, otp: string): Promise<void> {
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
    // Without this, a hung connection would keep the HTTP request open forever.
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Brevo ${res.status}: ${detail}`);
  }
}

async function sendViaSmtp(to: string, otp: string): Promise<void> {
  await transporter!.sendMail({
    from: EMAIL_FROM,
    to,
    subject,
    text: textBody(otp),
    html: htmlBody(otp),
  });
}

export type SendResult = {
  ok: boolean;
  provider: "brevo" | "smtp" | "none";
  error?: string;
};

// Turn provider errors into something a developer can act on from the logs.
function explain(provider: "brevo" | "smtp", message: string): string {
  const m = message.toLowerCase();
  if (provider === "smtp") {
    if (m.includes("invalid login") || m.includes("username and password not accepted")) {
      return `${message} — Gmail rejected the credentials. SMTP_PASS must be a 16-character Google App Password (2-Step Verification required), not your account password.`;
    }
    if (m.includes("timeout") || m.includes("etimedout") || m.includes("econnrefused")) {
      return `${message} — the SMTP port is blocked or unreachable (common on free hosting). Use BREVO_API_KEY instead.`;
    }
  }
  if (provider === "brevo") {
    if (m.includes("401")) {
      return `${message} — BREVO_API_KEY is wrong or revoked.`;
    }
    if (m.includes("sender") || m.includes("400")) {
      return `${message} — the sender address must be verified in Brevo (Senders & IPs). Set EMAIL_FROM/BREVO_SENDER to a verified address.`;
    }
  }
  return message;
}

// Awaited by the auth routes so the API can report whether delivery actually
// worked. Never throws: failures come back as ok:false with a reason.
export async function sendOtpEmail(to: string, otp: string): Promise<SendResult> {
  // Always log so the code is recoverable from server logs as a last resort.
  console.log(`OTP for ${to}: ${otp}`);

  if (emailProvider === "none") {
    console.warn(
      "Email not configured (set BREVO_API_KEY, or SMTP_USER + SMTP_PASS). OTP only logged above."
    );
    return { ok: false, provider: "none", error: "Email delivery is not configured on the server." };
  }

  try {
    if (emailProvider === "brevo") {
      await sendViaBrevo(to, otp);
    } else {
      await sendViaSmtp(to, otp);
    }
    console.log(`OTP email sent to ${to} via ${emailProvider}`);
    return { ok: true, provider: emailProvider };
  } catch (e: any) {
    const detail = explain(emailProvider, e?.message || String(e));
    console.error(`Failed to send OTP email to ${to} via ${emailProvider}:`, detail);
    return { ok: false, provider: emailProvider, error: detail };
  }
}

// Log the effective email configuration once at boot, so "mail is not coming"
// can be diagnosed from the very top of the server logs.
export function logEmailConfig(): void {
  if (emailProvider === "none") {
    console.warn(
      "EMAIL: not configured — OTP codes will only be printed to this log. " +
        "Set BREVO_API_KEY (recommended) or SMTP_USER + SMTP_PASS to send real email."
    );
    return;
  }
  console.log(`EMAIL: using ${emailProvider}, sending from "${EMAIL_FROM}"`);
  for (const problem of emailConfigProblems()) console.warn(`EMAIL WARNING: ${problem}`);
}
