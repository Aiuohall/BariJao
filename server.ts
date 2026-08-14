import express from "express";
console.log("SERVER.TS: File execution started");
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import rateLimit from "express-rate-limit";
import { db as supabase, dbStatus } from "./database.ts";
import { sendOtpEmail, emailProvider, emailConfigProblems, logEmailConfig } from "./mailer.ts";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const app = express();
const PORT = Number(process.env.PORT) || 3000;
console.log(`PORT configuration: process.env.PORT=${process.env.PORT}, using ${PORT}`);

console.log("Server starting at:", new Date().toISOString());
console.log("Environment check:", {
  VITE_SUPABASE_URL: !!process.env.VITE_SUPABASE_URL,
  SUPABASE_URL: !!process.env.SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: !!process.env.VITE_SUPABASE_ANON_KEY,
  SUPABASE_KEY: !!process.env.SUPABASE_KEY,
  GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
  VITE_GOOGLE_AI_API_KEY: !!process.env.VITE_GOOGLE_AI_API_KEY,
  VERCEL: !!process.env.VERCEL,
  NODE_ENV: process.env.NODE_ENV
});

// Gemini Setup
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.VITE_GOOGLE_AI_API_KEY || "" });

// JWT Secret (use dedicated secret if available)
const JWT_SECRET = process.env.JWT_SECRET || process.env.VITE_GOOGLE_AI_API_KEY || "barijao_secret_key_2026";

// How long a verification code stays valid.
const OTP_TTL_MS = 5 * 60 * 1000;

// Report the email setup at boot so "mail is not coming" is diagnosable from
// the top of the server log.
logEmailConfig();

app.use(cors());
app.use(express.json());

// Every endpoint that can trigger an email is throttled per IP, so the resend
// button cannot be turned into a mail bomb.
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many verification requests. Please wait a few minutes and try again." },
});

// ============================================================
// 1. HEALTH CHECK (always returns JSON)
// ============================================================
app.get("/api/health", async (req, res) => {
  console.log("Health check request received at:", new Date().toISOString());
  console.log("Current dbStatus:", JSON.stringify(dbStatus));
  try {
    // Check database connection
    let dbInfo: any = { ...dbStatus };
    try {
      const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
      if (error) {
        dbInfo.error = error.message;
      } else {
        dbInfo.connected = true;
      }
    } catch (dbErr: any) {
      dbInfo.critical_error = dbErr.message;
    }
    
    res.status(200).json({
      status: "ok",
      database: dbInfo,
      email: {
        provider: emailProvider,
        configured: emailProvider !== "none",
        problems: emailConfigProblems(),
      },
      timestamp: new Date().toISOString()
    });
  } catch (e: any) {
    console.error("Critical error in health check handler:", e);
    res.status(200).json({ 
      status: "ok", 
      database: "handler_error", 
      error: e.message, 
      dbStatus,
      timestamp: new Date().toISOString()
    });
  }
});

// Simple test endpoint
app.get("/test", (req, res) => res.send("OK"));

// Serve uploads folder
app.use("/uploads", express.static(uploadDir));

// ============================================================
// 2. MIDDLEWARE & ROUTES (all API routes go here)
// ============================================================

// --- Auth Middleware ---
const authenticate = async (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (e) {
    res.status(401).json({ error: "Invalid token" });
  }
};

const isAdmin = (req: any, res: any, next: any) => {
  if (req.user?.role !== "admin") return res.status(403).json({ error: "Forbidden: Admin access only" });
  next();
};

// --- Multer for Image Uploads ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// ==================== AUTH ROUTES ====================

// Generates a code, replaces any previous code for this address, and *waits* for
// the email provider so the response can tell the truth about delivery.
// Returns the delivery result; the caller decides what to show the user.
async function issueOtp(
  lowerEmail: string,
  otpType: "login" | "registration"
): Promise<{ ok: boolean; error?: string; otp: string }> {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();

  // Invalidate earlier codes so only the newest one works.
  await supabase.from('otp_codes').delete().eq('email', lowerEmail);

  const { error: otpError } = await supabase.from('otp_codes').insert([{
    email: lowerEmail,
    otp_code: otp,
    expires_at: expiresAt,
    otp_type: otpType
  }]);

  if (otpError) {
    console.error("OTP Insert Error:", otpError);
    return { ok: false, error: "Could not create a verification code. Please try again.", otp };
  }

  const result = await sendOtpEmail(lowerEmail, otp);
  return result.ok ? { ok: true, otp } : { ok: false, error: result.error, otp };
}

// Local-development escape hatch: with no email provider configured there is no
// way to receive a code, which makes the app unusable on a dev machine. In that
// case only, and never in production, the code is returned to the browser so the
// flow can be exercised. Setting BREVO_API_KEY/SMTP_* switches this off.
const DEV_SHOW_OTP = process.env.NODE_ENV !== "production" && emailProvider === "none";
if (DEV_SHOW_OTP) {
  console.warn(
    "EMAIL: dev mode — verification codes will be shown in the browser because no " +
      "email provider is configured. Never run a public deployment like this."
  );
}

// Shared response shape for "we sent (or tried to send) a code".
function otpResponse(
  res: any,
  lowerEmail: string,
  delivery: { ok: boolean; error?: string; otp: string }
) {
  if (delivery.ok) {
    return res.json({
      message: "OTP sent to your email",
      email: lowerEmail,
      requiresOTP: true,
      emailSent: true,
    });
  }
  // The code exists and is valid — only delivery failed. Keep the user on the
  // OTP screen (so an admin-recovered code still works) but say what happened.
  return res.json({
    message: "We could not deliver the verification email.",
    email: lowerEmail,
    requiresOTP: true,
    ...(DEV_SHOW_OTP ? { devOtp: delivery.otp } : {}),
    emailSent: false,
    emailError: delivery.error || "Email delivery failed.",
  });
}

app.post("/api/auth/register", otpLimiter, async (req, res) => {
  const { name, email, phone, password } = req.body;
  if (!name || !email || !phone || !password) return res.status(400).json({ error: "All fields are required" });

  const lowerEmail = String(email).toLowerCase().trim();

  const { data: existingUser } = await supabase.from('users').select('*').eq('email', lowerEmail).single();

  if (existingUser) {
    // A verified account really is a duplicate.
    if (existingUser.is_verified) {
      return res.status(400).json({ error: "Email already registered" });
    }
    // Unverified: the previous attempt never completed (e.g. the email never
    // arrived). Refresh the details and send a new code instead of dead-ending
    // the user on "Email already registered".
    const hashedPassword = await bcrypt.hash(password, 10);
    const { error: updateError } = await supabase.from('users')
      .update({ name, phone, password_hash: hashedPassword })
      .eq('id', existingUser.id);
    if (updateError) return res.status(500).json({ error: updateError.message });

    const delivery = await issueOtp(lowerEmail, 'registration');
    return otpResponse(res, lowerEmail, delivery);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const { error: regError } = await supabase.from('users').insert([{
    name,
    email: lowerEmail,
    phone,
    password_hash: hashedPassword,
    role: "user",
    is_verified: false
  }]).select().single();

  if (regError) return res.status(500).json({ error: regError.message });

  const delivery = await issueOtp(lowerEmail, 'registration');
  otpResponse(res, lowerEmail, delivery);
});

app.post("/api/auth/login", otpLimiter, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password are required" });
  const lowerEmail = String(email).toLowerCase().trim();

  const { data: user, error: userError } = await supabase.from('users').select('*').eq('email', lowerEmail).single();

  if (!user || userError) return res.status(401).json({ error: "Invalid credentials" });

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) return res.status(401).json({ error: "Invalid credentials" });

  const delivery = await issueOtp(lowerEmail, 'login');
  otpResponse(res, lowerEmail, delivery);
});

// Lets the user ask for a fresh code without re-entering their password, which
// is the normal recovery path when the first email is slow or lands in spam.
app.post("/api/auth/resend-otp", otpLimiter, async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });
  const lowerEmail = String(email).toLowerCase().trim();

  // Only resend to an address that already has a pending code, so this endpoint
  // cannot be used to mail arbitrary strangers.
  const { data: pending } = await supabase
    .from('otp_codes')
    .select('*')
    .eq('email', lowerEmail)
    .limit(1)
    .single();

  if (!pending) return res.status(400).json({ error: "No pending verification for this email. Please sign in again." });

  const delivery = await issueOtp(lowerEmail, pending.otp_type === 'registration' ? 'registration' : 'login');
  otpResponse(res, lowerEmail, delivery);
});

app.post("/api/auth/verify-otp", async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ error: "Email and code are required" });
  const lowerEmail = String(email).toLowerCase().trim();

  const { data: otpData, error: otpError } = await supabase
    .from('otp_codes')
    .select('*')
    .eq('email', lowerEmail)
    .eq('otp_code', String(code).trim())
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!otpData || otpError) return res.status(401).json({ error: "Invalid or expired OTP" });

  await supabase.from('otp_codes').delete().eq('id', otpData.id);

  const { data: user } = await supabase.from('users').select('*').eq('email', lowerEmail).single();
  if (!user) return res.status(404).json({ error: "User not found" });

  // Completing an OTP proves the address works, so the account is now verified.
  if (!user.is_verified) {
    await supabase.from('users').update({ is_verified: true }).eq('id', user.id);
  }

  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone, rating: user.rating, avatar_url: user.avatar_url } });
});

app.post("/api/auth/admin-login", async (req, res) => {
  const { adminId, password } = req.body;
  
  const { data: adminRecord } = await supabase.from('admins').select('*').eq('admin_identifier', adminId).single();
  
  if (adminRecord) {
    const { data: user } = await supabase.from('users').select('*').eq('role', 'admin').limit(1).single();
    
    if (user && await bcrypt.compare(password, user.password_hash)) {
      const token = jwt.sign({ id: user.id, role: "admin" }, JWT_SECRET, { expiresIn: "1d" });
      return res.json({ token, user: { id: user.id, name: user.name, role: "admin" } });
    } else if (!user) {
      return res.status(401).json({ error: "No admin user found in users table." });
    }
  }
  res.status(401).json({ error: "Invalid admin credentials" });
});

// ==================== PROFILE ROUTES ====================

// Never send the bcrypt hash to the client.
function publicUser(user: any) {
  if (!user) return user;
  const { password_hash, ...safe } = user;
  return safe;
}

app.get("/api/profile", authenticate, async (req: any, res) => {
  const { data: user, error } = await supabase.from('users').select('*').eq('id', req.user.id).single();
  if (!user || error) return res.status(404).json({ error: "User not found" });
  res.json(publicUser(user));
});

app.put("/api/profile", authenticate, async (req: any, res) => {
  const { name, phone, avatar_url } = req.body;
  const updates: any = {};
  if (name !== undefined) updates.name = name;
  if (phone !== undefined) updates.phone = phone;
  if (avatar_url !== undefined) updates.avatar_url = avatar_url; // data URL string or null
  const { data: user, error } = await supabase.from('users').update(updates).eq('id', req.user.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(publicUser(user));
});

app.put("/api/profile/password", authenticate, async (req: any, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: "Current and new password are required" });
  const { data: user } = await supabase.from('users').select('*').eq('id', req.user.id).single();
  if (!user) return res.status(404).json({ error: "User not found" });

  if (!await bcrypt.compare(currentPassword, user.password_hash)) {
    return res.status(400).json({ error: "Current password incorrect" });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await supabase.from('users').update({ password_hash: hashedPassword }).eq('id', req.user.id);
  res.json({ message: "Password updated successfully" });
});

// ==================== TICKET MARKETPLACE ====================

// Like `authenticate`, but never rejects — sets req.user if a valid token is present.
const optionalAuth = (req: any, _res: any, next: any) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (token) {
    try { req.user = jwt.verify(token, JWT_SECRET); } catch { /* treat as guest */ }
  }
  next();
};

// Hide sensitive ticket details from guests (not-logged-in viewers) so a listing
// cannot be copied. Any logged-in user (and the owner) sees the full details.
const maskTicketForViewer = (ticket: any, viewerId?: string) => {
  if (!ticket) return ticket;
  if (viewerId) return ticket; // logged in -> full details
  const seller = ticket.seller ? { ...ticket.seller } : ticket.seller;
  if (seller) delete seller.phone;
  return { ...ticket, seller, seat_number: null, ticket_image: null, locked: true };
};

app.get("/api/tickets", optionalAuth, async (req: any, res) => {
  const { from, to, date } = req.query;

  let query = supabase
    .from('tickets')
    .select('*, seller:users(name, rating, rating_count, is_verified, avatar_url)')
    .eq('status', 'available');

  if (from) query = query.ilike('from_location', `%${from}%`);
  if (to) query = query.ilike('to_location', `%${to}%`);
  if (date) query = query.eq('journey_date', date);

  const { data: tickets, error } = await query;

  if (error) return res.status(500).json({ error: error.message });
  res.json((tickets || []).map((t: any) => maskTicketForViewer(t, req.user?.id)));
});

// Single ticket (used by the detail page). Masked for guests.
app.get("/api/tickets/:id", optionalAuth, async (req: any, res) => {
  const { data: ticket, error } = await supabase
    .from('tickets')
    .select('*, seller:users(id, name, phone, rating, rating_count, is_verified, avatar_url)')
    .eq('id', req.params.id)
    .single();

  if (!ticket || error) return res.status(404).json({ error: "Ticket not found" });
  res.json(maskTicketForViewer(ticket, req.user?.id));
});

// Accept the image under any field name (the client sends "ticket_image"),
// so an unexpected field name can never crash the upload with a 500.
app.post("/api/tickets", authenticate, upload.any(), async (req: any, res) => {
  const { transport_type, operator_name, from_location, to_location, journey_date, seat_number, original_price, asking_price, ticket_purchase_date } = req.body;
  const file = req.files && req.files[0];
  const image_url = file ? `/uploads/${file.filename}` : null;

  const { data: existing } = await supabase.from('tickets')
    .select('id')
    .eq('seller_id', req.user.id)
    .eq('journey_date', journey_date)
    .eq('seat_number', seat_number)
    .neq('status', 'expired')
    .maybeSingle();

  if (existing) return res.status(400).json({ error: "This seat is already listed for this journey" });

  const { data: newTicket, error } = await supabase.from('tickets').insert([{
    seller_id: req.user.id,
    transport_type,
    operator_name,
    from_location,
    to_location,
    journey_date,
    seat_number,
    original_price: parseFloat(original_price),
    asking_price: parseFloat(asking_price),
    ticket_purchase_date,
    ticket_image: image_url,
    status: "available"
  }]).select().single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(newTicket);
});

app.put("/api/tickets/:id", authenticate, async (req: any, res) => {
  const { id } = req.params;
  const { asking_price, status } = req.body;

  const { data: ticket } = await supabase.from('tickets').select('*').eq('id', id).single();
  if (!ticket) return res.status(404).json({ error: "Ticket not found" });
  
  if (ticket.seller_id !== req.user.id && req.user.role !== "admin") {
    return res.status(403).json({ error: "Unauthorized" });
  }

  const updates: any = {};
  if (asking_price !== undefined) updates.asking_price = parseFloat(asking_price);
  if (status !== undefined) updates.status = status;

  const { data: updatedTicket, error } = await supabase.from('tickets').update(updates).eq('id', id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(updatedTicket);
});

app.delete("/api/tickets/:id", authenticate, async (req: any, res) => {
  const { id } = req.params;
  const { data: ticket } = await supabase.from('tickets').select('seller_id').eq('id', id).single();
  if (!ticket) return res.status(404).json({ error: "Ticket not found" });

  if (ticket.seller_id !== req.user.id && req.user.role !== "admin") {
    return res.status(403).json({ error: "Unauthorized" });
  }

  const { error } = await supabase.from('tickets').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// ==================== BUYING SYSTEM ====================
app.post("/api/tickets/:id/buy", authenticate, async (req: any, res) => {
  const { id } = req.params;
  const { payment_method, transaction_reference } = req.body;

  const { data: ticket } = await supabase.from('tickets').select('*').eq('id', id).single();
  if (!ticket || ticket.status !== "available") {
    return res.status(400).json({ error: "Ticket is no longer available" });
  }

  if (ticket.seller_id === req.user.id) {
    return res.status(400).json({ error: "You cannot buy your own ticket" });
  }

  const { data: newTransaction, error: transError } = await supabase.from('transactions').insert([{
    buyer_id: req.user.id,
    seller_id: ticket.seller_id,
    ticket_id: ticket.id,
    payment_method,
    transaction_id: transaction_reference,
    status: "payment_sent"
  }]).select().single();

  if (transError) return res.status(500).json({ error: transError.message });

  await supabase.from('tickets').update({ status: "sold" }).eq('id', id);

  res.json({ message: "Purchase successful", transaction: newTransaction });
});

// ==================== RATING SYSTEM ====================
app.post("/api/ratings", authenticate, async (req: any, res) => {
  const { ticket_id, rating, review } = req.body;

  const { data: ticket } = await supabase.from('tickets').select('seller_id').eq('id', ticket_id).single();
  if (!ticket) return res.status(404).json({ error: "Ticket not found" });

  const { error } = await supabase.from('ratings').insert([{
    user_id: ticket.seller_id,
    reviewer_id: req.user.id,
    rating: parseInt(rating),
    review
  }]);

  if (error) return res.status(500).json({ error: error.message });

  // Update seller rating and count
  const { data: allRatings } = await supabase.from('ratings').select('rating').eq('user_id', ticket.seller_id);
  if (allRatings && allRatings.length > 0) {
    const avg = allRatings.reduce((acc, r) => acc + r.rating, 0) / allRatings.length;
    await supabase.from('users').update({ 
      rating: avg,
      rating_count: allRatings.length 
    }).eq('id', ticket.seller_id);
  }

  res.json({ success: true });
});

// ==================== MESSAGING ====================
app.get("/api/messages/conversations", authenticate, async (req: any, res) => {
  const { data: messages, error } = await supabase.from('messages')
    .select('*, ticket:tickets(transport_type, operator_name, from_location, to_location, seller_id), sender:users!messages_sender_id_fkey(name, avatar_url), receiver:users!messages_receiver_id_fkey(name, avatar_url)')
    .or(`sender_id.eq.${req.user.id},receiver_id.eq.${req.user.id}`)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(messages);
});

app.get("/api/messages/:ticketId", authenticate, async (req: any, res) => {
  const { ticketId } = req.params;
  const withUser = req.query.with as string | undefined;
  const { data: messages, error } = await supabase.from('messages')
    .select('*, sender:users!messages_sender_id_fkey(name, avatar_url)')
    .eq('ticket_id', ticketId)
    .or(`sender_id.eq.${req.user.id},receiver_id.eq.${req.user.id}`)
    .order('created_at', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  let result = messages || [];
  // Keep only the thread with one specific counterparty (separate chat per user).
  if (withUser) {
    result = result.filter((m: any) =>
      (m.sender_id === req.user.id && m.receiver_id === withUser) ||
      (m.sender_id === withUser && m.receiver_id === req.user.id)
    );
  }
  res.json(result);
});

app.post("/api/messages", authenticate, async (req: any, res) => {
  const { ticket_id, receiver_id, message } = req.body;

  const { error } = await supabase.from('messages').insert([{
    ticket_id,
    sender_id: req.user.id,
    receiver_id,
    message
  }]);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// ==================== ADMIN ROUTES ====================
app.get("/api/admin/users", authenticate, isAdmin, async (req, res) => {
  const { data: users } = await supabase.from('users').select('*').order('created_at', { ascending: false });
  res.json(users);
});

app.post("/api/admin/users/:id/ban", authenticate, isAdmin, async (req, res) => {
  res.json({ success: true, message: "Ban action skipped as column is missing in schema" });
});

app.get("/api/admin/tickets", authenticate, isAdmin, async (req, res) => {
  const { data: tickets } = await supabase.from('tickets').select('*, seller:users(name)').order('created_at', { ascending: false });
  res.json(tickets);
});

app.post("/api/admin/tickets/:id/verify", authenticate, isAdmin, async (req, res) => {
  await supabase.from('tickets').update({ status: "available" }).eq('id', req.params.id);
  res.json({ success: true });
});

app.get("/api/admin/transactions", authenticate, isAdmin, async (req, res) => {
  const { data: transactions } = await supabase.from('transactions')
    .select('*, buyer:users!transactions_buyer_id_fkey(name), seller:users!transactions_seller_id_fkey(name), ticket:tickets(operator_name)')
    .order('created_at', { ascending: false });
  res.json(transactions);
});

// ==================== AI FEATURES ====================
app.post("/api/ai/generate-description", authenticate, async (req, res) => {
  const { ticketDetails } = req.body;
  try {
    const result = await genAI.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a compelling and trustworthy ticket selling description for a ${ticketDetails.transport_type} ticket from ${ticketDetails.from_location} to ${ticketDetails.to_location} on ${ticketDetails.journey_date}. Operator: ${ticketDetails.operator_name}. Seat: ${ticketDetails.seat_number}. Mention that the price is ${ticketDetails.asking_price} BDT. Keep it professional and helpful for the BariJao marketplace.`,
    });
    res.json({ description: result.text });
  } catch (e) {
    res.status(500).json({ error: "AI Generation failed" });
  }
});

// ==================== DASHBOARD ROUTES ====================
app.get("/api/user/dashboard", authenticate, async (req: any, res) => {
  const { data: listings } = await supabase.from('tickets').select('*').eq('seller_id', req.user.id);
  const { data: purchases } = await supabase.from('transactions')
    .select('*, ticket:tickets(*), seller:users!transactions_seller_id_fkey(name, phone)')
    .eq('buyer_id', req.user.id);

  res.json({ listings, purchases });
});

app.get("/api/dashboard/listings", authenticate, async (req: any, res) => {
  const { data: listings } = await supabase.from('tickets').select('*').eq('seller_id', req.user.id);
  res.json(listings);
});

app.get("/api/dashboard/purchases", authenticate, async (req: any, res) => {
  const { data: purchases } = await supabase.from('transactions')
    .select('*, ticket:tickets(*), seller:users!transactions_seller_id_fkey(name, phone)')
    .eq('buyer_id', req.user.id);
  res.json(purchases);
});

// ==================== EXPIRED TICKETS CLEANUP ====================
const cleanupExpiredTickets = async () => {
  const today = new Date().toISOString().split('T')[0];
  await supabase.from('tickets').update({ status: 'expired' }).lt('journey_date', today).neq('status', 'sold');
};
setInterval(cleanupExpiredTickets, 1000 * 60 * 60);

// ==================== KEEP-ALIVE (prevent free-tier cold starts) ====================
// Render's free tier sleeps the service after ~15 min without inbound traffic,
// which makes the next request fail ("Failed to fetch"). Pinging our own public
// URL every 13 min counts as inbound traffic and keeps the instance warm.
const SELF_URL = process.env.RENDER_EXTERNAL_URL || process.env.APP_URL;
if (process.env.NODE_ENV === "production" && SELF_URL) {
  setInterval(async () => {
    try {
      await fetch(`${SELF_URL}/api/health`);
    } catch (e: any) {
      console.warn("Keep-alive ping failed:", e.message);
    }
  }, 1000 * 60 * 13);
  console.log(`Keep-alive enabled, pinging ${SELF_URL}/api/health every 13 min`);
}

// ==================== GLOBAL ERROR HANDLER ====================
app.use((err: any, req: any, res: any, next: any) => {
  console.error("Global Error Handler:", err);
  res.status(500).json({ error: err.message || "Internal Server Error", message: err.message });
});

// ==================== START SERVER (unless on Vercel) ====================
async function startServer() {
  if (process.env.NODE_ENV !== "production" && process.env.VERCEL !== "1") {
    try {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
      console.log("Vite middleware integrated.");
    } catch (error) {
      console.error("Failed to create Vite server:", error);
    }
  } else if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  if (process.env.VERCEL !== "1") {
    console.log(`Attempting to start server on port ${PORT}...`);
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  }
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
});

export default app;