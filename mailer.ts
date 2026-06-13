// Email delivery for OTP codes.
// Configure via env vars. Two modes:
//   1) Gmail (simplest): set SMTP_USER + SMTP_PASS (a Google "App Password").
//   2) Any SMTP host: also set SMTP_HOST (and optionally SMTP_PORT, SMTP_SECURE).
// If nothing is configured, the OTP is logged to the console (dev fallback).
import nodemailer from "nodemailer";

const SMTP_USER = process.env.SMTP_USER || process.env.GMAIL_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || "";
const SMTP_HOST = process.env.SMTP_HOST || "";
const SMTP_PORT = Number(process.env.SMTP_PORT) || 587;
const SMTP_SECURE = process.env.SMTP_SECURE === "true";
const EMAIL_FROM =
  process.env.EMAIL_FROM || (SMTP_USER ? `BariJao <${SMTP_USER}>` : "");

let transporter: nodemailer.Transporter | null = null;

if (SMTP_USER && SMTP_PASS) {
  transporter = SMTP_HOST
    ? nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_SECURE,
        auth: { user: SMTP_USER, pass: SMTP_PASS },
      })
    : nodemailer.createTransport({
        service: "gmail",
        auth: { user: SMTP_USER, pass: SMTP_PASS },
      });
}

export const emailEnabled = !!transporter;

export async function sendOtpEmail(to: string, otp: string): Promise<boolean> {
  // Always log so it's recoverable, but never rely on logs in production.
  console.log(`OTP for ${to}: ${otp}`);

  if (!transporter) {
    console.warn(
      "Email not configured (set SMTP_USER + SMTP_PASS). OTP only logged above."
    );
    return false;
  }

  try {
    await transporter.sendMail({
      from: EMAIL_FROM,
      to,
      subject: "Your BariJao verification code",
      text: `Your BariJao verification code is ${otp}. It expires in 5 minutes.`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #eee;border-radius:12px">
          <h2 style="color:#059669;margin:0 0 8px">BariJao</h2>
          <p style="color:#374151">Use this code to verify your account:</p>
          <div style="font-size:32px;font-weight:800;letter-spacing:6px;color:#111827;margin:16px 0">${otp}</div>
          <p style="color:#6b7280;font-size:13px">This code expires in 5 minutes. If you didn't request it, ignore this email.</p>
        </div>`,
    });
    console.log(`OTP email sent to ${to}`);
    return true;
  } catch (e: any) {
    console.error(`Failed to send OTP email to ${to}:`, e.message);
    return false;
  }
}
