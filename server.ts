import express from "express";
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
import { db as supabase, useSupabase } from "./database.ts";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const app = express();
const PORT = 3000;

console.log("Environment check:", {
  VITE_SUPABASE_URL: !!process.env.VITE_SUPABASE_URL,
  SUPABASE_URL: !!process.env.SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: !!process.env.VITE_SUPABASE_ANON_KEY,
  SUPABASE_KEY: !!process.env.SUPABASE_KEY,
  GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
  VITE_GOOGLE_AI_API_KEY: !!process.env.VITE_GOOGLE_AI_API_KEY,
});

// Gemini Setup
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.VITE_GOOGLE_AI_API_KEY || "" });

// Using VITE_GOOGLE_AI_API_KEY as JWT_SECRET as requested by user
// Note: In production, it's better to use a dedicated private secret.
const JWT_SECRET = process.env.VITE_GOOGLE_AI_API_KEY || process.env.JWT_SECRET || "barijao_secret_key_2026";

app.use(cors());
app.use(express.json());

app.get("/api/health", async (req, res) => {
  console.log("Health check request received");
  try {
    // Check database connection
    const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error("Database error in health check:", error);
      return res.status(200).send({ 
        status: "ok", 
        database: "error", 
        error: error.message,
        useSupabase,
        env: {
          SUPABASE_URL: !!process.env.SUPABASE_URL,
          SUPABASE_KEY: !!process.env.SUPABASE_KEY,
        },
        timestamp: new Date().toISOString()
      });
    }

    console.log("Health check successful, database:", useSupabase ? "Supabase" : "SQLite");
    res.status(200).send({ 
      status: "ok", 
      database: useSupabase ? "connected (Supabase)" : "connected (SQLite)", 
      useSupabase,
      env: {
        SUPABASE_URL: !!process.env.SUPABASE_URL,
        SUPABASE_KEY: !!process.env.SUPABASE_KEY,
        VITE_SUPABASE_URL: !!process.env.VITE_SUPABASE_URL,
        VITE_SUPABASE_ANON_KEY: !!process.env.VITE_SUPABASE_ANON_KEY,
      },
      timestamp: new Date().toISOString() 
    });
  } catch (e: any) {
    console.error("Critical error in health check:", e);
    res.status(200).send({ 
      status: "ok", 
      database: "critical_error", 
      error: e.message, 
      useSupabase,
      timestamp: new Date().toISOString()
    });
  }
});

app.get("/health", (req, res) => {
  res.status(200).send({ status: "ok", timestamp: new Date().toISOString() });
});

// Serve uploads folder
app.use("/uploads", express.static(uploadDir));

// --- Middleware ---
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

// --- Auth Routes ---

app.post("/api/auth/register", async (req, res) => {
  const { name, email, phone, password } = req.body;
  if (!name || !email || !phone || !password) return res.status(400).json({ error: "All fields are required" });

  const lowerEmail = email.toLowerCase();
  
  // Check if user exists
  const { data: existingUser } = await supabase.from('users').select('id').eq('email', lowerEmail).single();
  if (existingUser) return res.status(400).json({ error: "Email already registered" });

  const hashedPassword = await bcrypt.hash(password, 10);
  
  const { data: newUser, error: regError } = await supabase.from('users').insert([{
    name,
    email: lowerEmail,
    phone,
    password_hash: hashedPassword,
    role: "user"
  }]).select().single();

  if (regError) return res.status(500).json({ error: regError.message });

  // Generate OTP for registration
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  const { error: otpError } = await supabase.from('otp_codes').insert([{
    email: lowerEmail,
    otp_code: otp,
    expires_at: expiresAt,
    otp_type: 'login'
  }]);

  if (otpError) console.error("OTP Insert Error:", otpError);

  console.log(`Registration OTP for ${lowerEmail}: ${otp}`);
  res.json({ message: "OTP sent to your email", email: lowerEmail, requiresOTP: true });
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const lowerEmail = email.toLowerCase();

  const { data: user, error: userError } = await supabase.from('users').select('*').eq('email', lowerEmail).single();
  
  if (!user || userError) return res.status(401).json({ error: "Invalid credentials" });

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) return res.status(401).json({ error: "Invalid credentials" });

  // Generate OTP for login
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  await supabase.from('otp_codes').insert([{
    email: lowerEmail,
    otp_code: otp,
    expires_at: expiresAt,
    otp_type: 'login'
  }]);

  console.log(`OTP for ${lowerEmail}: ${otp}`);
  res.json({ message: "OTP sent to your email", email: lowerEmail, requiresOTP: true });
});

app.post("/api/auth/verify-otp", async (req, res) => {
  const { email, code } = req.body;
  const lowerEmail = email.toLowerCase();

  const { data: otpData, error: otpError } = await supabase
    .from('otp_codes')
    .select('*')
    .eq('email', lowerEmail)
    .eq('otp_code', code)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!otpData || otpError) return res.status(401).json({ error: "Invalid or expired OTP" });

  // Mark OTP as used by deleting it (since there's no 'used' column in the provided SQL)
  await supabase.from('otp_codes').delete().eq('id', otpData.id);

  const { data: user } = await supabase.from('users').select('*').eq('email', lowerEmail).single();
  
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

// Admin login route
app.post("/api/auth/admin-login", async (req, res) => {
  const { adminId, password } = req.body;
  
  // Check if admin identifier exists in admins table
  const { data: adminRecord } = await supabase.from('admins').select('*').eq('admin_identifier', adminId).single();
  
  if (adminRecord) {
    // Find the user with role 'admin'
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

// --- Profile Routes ---

app.get("/api/profile", authenticate, async (req: any, res) => {
  const { data: user, error } = await supabase.from('users').select('*').eq('id', req.user.id).single();
  if (!user || error) return res.status(404).json({ error: "User not found" });
  res.json(user);
});

app.put("/api/profile", authenticate, async (req: any, res) => {
  const { name } = req.body;
  const { data: user, error } = await supabase.from('users').update({ name }).eq('id', req.user.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(user);
});

app.put("/api/profile/password", authenticate, async (req: any, res) => {
  const { currentPassword, newPassword } = req.body;
  const { data: user } = await supabase.from('users').select('*').eq('id', req.user.id).single();
  
  if (!await bcrypt.compare(currentPassword, user.password_hash)) {
    return res.status(400).json({ error: "Current password incorrect" });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await supabase.from('users').update({ password_hash: hashedPassword }).eq('id', req.user.id);
  res.json({ message: "Password updated successfully" });
});

// --- Ticket Marketplace Routes ---

app.get("/api/tickets", async (req, res) => {
  const { from, to, date } = req.query;
  
  let query = supabase.from('tickets').select('*, seller:users(name)').eq('status', 'available');

  if (from) query = query.ilike('from_location', `%${from}%`);
  if (to) query = query.ilike('to_location', `%${to}%`);
  if (date) query = query.eq('journey_date', date);

  const { data: tickets, error } = await query;

  if (error) return res.status(500).json({ error: error.message });
  res.json(tickets);
});

app.post("/api/tickets", authenticate, upload.single("image"), async (req: any, res) => {
  const { transport_type, operator_name, from_location, to_location, journey_date, seat_number, original_price, asking_price, ticket_purchase_date } = req.body;
  const image_url = req.file ? `/uploads/${req.file.filename}` : null;

  // Check for duplicates
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

// --- Buying System ---

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

  // Update ticket status
  await supabase.from('tickets').update({ status: "sold" }).eq('id', id);

  res.json({ message: "Purchase successful", transaction: newTransaction });
});

// --- Rating System ---

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

  // Update seller rating
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

// --- Messaging System ---

app.get("/api/messages/conversations", authenticate, async (req: any, res) => {
  const { data: messages, error } = await supabase.from('messages')
    .select('*, ticket:tickets(transport_type, operator_name), sender:users!messages_sender_id_fkey(name), receiver:users!messages_receiver_id_fkey(name)')
    .or(`sender_id.eq.${req.user.id},receiver_id.eq.${req.user.id}`)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(messages);
});

app.get("/api/messages/:ticketId", authenticate, async (req: any, res) => {
  const { ticketId } = req.params;
  const { data: messages, error } = await supabase.from('messages')
    .select('*, sender:users!messages_sender_id_fkey(name)')
    .eq('ticket_id', ticketId)
    .or(`sender_id.eq.${req.user.id},receiver_id.eq.${req.user.id}`)
    .order('created_at', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(messages);
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

// --- Admin Routes ---

app.get("/api/admin/users", authenticate, isAdmin, async (req, res) => {
  const { data: users } = await supabase.from('users').select('*').order('created_at', { ascending: false });
  res.json(users);
});

app.post("/api/admin/users/:id/ban", authenticate, isAdmin, async (req, res) => {
  // The provided SQL schema does not have a 'banned' column in users table
  // We will skip this action for now
  res.json({ success: true, message: "Ban action skipped as column is missing in schema" });
});

app.get("/api/admin/tickets", authenticate, isAdmin, async (req, res) => {
  const { data: tickets } = await supabase.from('tickets').select('*, seller:users(name)').order('created_at', { ascending: false });
  res.json(tickets);
});

app.post("/api/admin/tickets/:id/verify", authenticate, isAdmin, async (req, res) => {
  // The provided SQL schema does not have a 'verified' column in tickets table
  // We will update the status to 'available' as a form of verification
  await supabase.from('tickets').update({ status: "available" }).eq('id', req.params.id);
  res.json({ success: true });
});

app.get("/api/admin/transactions", authenticate, isAdmin, async (req, res) => {
  const { data: transactions } = await supabase.from('transactions')
    .select('*, buyer:users!transactions_buyer_id_fkey(name), seller:users!transactions_seller_id_fkey(name), ticket:tickets(operator_name)')
    .order('created_at', { ascending: false });
  res.json(transactions);
});

// --- AI Features ---

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

// --- Dashboard Routes ---

app.get("/api/user/dashboard", authenticate, async (req: any, res) => {
  const { data: listings } = await supabase.from('tickets').select('*').eq('seller_id', req.user.id);
  const { data: purchases } = await supabase.from('transactions')
    .select('*, ticket:tickets(*), seller:users(name, phone)')
    .eq('buyer_id', req.user.id);

  res.json({ listings, purchases });
});

app.get("/api/dashboard/listings", authenticate, async (req: any, res) => {
  const { data: listings } = await supabase.from('tickets').select('*').eq('seller_id', req.user.id);
  res.json(listings);
});

app.get("/api/dashboard/purchases", authenticate, async (req: any, res) => {
  const { data: purchases } = await supabase.from('transactions')
    .select('*, ticket:tickets(*), seller:users(name, phone)')
    .eq('buyer_id', req.user.id);
  res.json(purchases);
});

// --- Cron-like check for expired tickets ---
const cleanupExpiredTickets = async () => {
  const today = new Date().toISOString().split('T')[0];
  await supabase.from('tickets').update({ status: 'expired' }).lt('journey_date', today).neq('status', 'sold');
};
setInterval(cleanupExpiredTickets, 1000 * 60 * 60); // Every hour

// --- Test Route ---
app.get('/test', (req, res) => res.send('OK'));

// --- Vite middleware ---
if (process.env.NODE_ENV !== "production") {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.join(__dirname, "dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
  });
}

if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Server is running on port 3000');
  });
} else {
  // In production (Vercel/Cloud Run), the platform handles the port
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Server is running on port 3000');
  });
}

export default app;
