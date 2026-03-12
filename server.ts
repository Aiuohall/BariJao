import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import rateLimit from "express-rate-limit";
import fs from "fs";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const app = express();
app.set('trust proxy', 1);
const PORT = 3000;

// Request Logging - VERY EARLY
app.use((req, res, next) => {
  console.log(`[REQUEST] ${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Serve uploads folder
app.use("/uploads", express.static(uploadDir));

// Supabase Setup
const supabaseUrl = process.env.SUPABASE_URL || "https://vuuxvzydekuvlhpfbsxx.supabase.co";
const supabaseKey = process.env.SUPABASE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1dXh2enlkZWt1dmxocGZic3h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwMTEzMTgsImV4cCI6MjA4ODU4NzMxOH0.qWQGYdyUjxGvYJb2jXuVuBTflOT9otvElawj7tyXsvQ";

console.log("Using Supabase URL:", supabaseUrl);

if (!supabaseUrl || !supabaseKey) {
  console.error("SUPABASE_URL or SUPABASE_KEY is missing. Please set them in the environment variables.");
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test Supabase Connection
async function testSupabase() {
  try {
    const { data, error } = await supabase.from("users").select("count", { count: "exact", head: true });
    if (error) {
      console.error("Supabase connection error:", error.message);
      if (error.code === 'PGRST116') {
        console.log("Note: 'users' table might be empty or missing.");
      }
    } else {
      console.log("Supabase connection successful. Found users count:", data);
    }
  } catch (e) {
    console.error("Failed to connect to Supabase:", e);
  }
}
testSupabase();

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";

app.use(cors());
app.use(express.json());

// Request Logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Rate Limiting
const loginLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10,
  validate: { xForwardedForHeader: false },
  handler: (req, res) => {
    res.status(429).json({ error: "Too many login attempts, please try again later." });
  },
});

// Districts Data
const districts = [
  "Bagerhat", "Bandarban", "Barguna", "Barishal", "Bhola", "Bogra", "Brahmanbaria", "Chandpur", "Chapai Nawabganj", "Chattogram", "Chuadanga", "Cumilla", "Cox's Bazar", "Dhaka", "Dinajpur", "Faridpur", "Feni", "Gaibandha", "Gazipur", "Gopalganj", "Habiganj", "Jamalpur", "Jashore", "Jhalokati", "Jhenaidah", "Joypurhat", "Khagrachhari", "Khulna", "Kishoreganj", "Kurigram", "Kushtia", "Lakshmipur", "Lalmonirhat", "Madaripur", "Magura", "Manikganj", "Meherpur", "Moulvibazar", "Munshiganj", "Mymensingh", "Naogaon", "Narail", "Narayanganj", "Narsingdi", "Natore", "Netrokona", "Nilphamari", "Noakhali", "Pabna", "Panchagarh", "Patuakhali", "Pirojpur", "Rajbari", "Rajshahi", "Rangamati", "Rangpur", "Satkhira", "Shariatpur", "Sherpur", "Sirajganj", "Sunamganj", "Sylhet", "Tangail", "Thakurgaon"
];

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ 
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") cb(null, true);
    else cb(new Error("Only JPG and PNG allowed"));
  }
});

// Middleware for Auth
const authenticate = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    res.status(401).json({ error: "Invalid token" });
  }
};

// --- API Routes ---
app.get("/health", (req, res) => {
  console.log("Root health check called");
  res.json({ status: "ok", mode: "root", time: new Date().toISOString() });
});

app.get("/api/health", (req, res) => {
  console.log("API health check called");
  res.json({ status: "ok", mode: "api", time: new Date().toISOString() });
});

// Districts Autocomplete
app.get("/api/districts", (req, res) => {
  const { search } = req.query;
  if (!search) return res.json(districts);
  const query = String(search).toLowerCase();
  const filtered = districts.filter(d => d.toLowerCase().includes(query));
  res.json(filtered);
});

// Auth Routes
app.post("/api/auth/register", async (req, res) => {
  console.log("Register attempt:", req.body.email);
  const { name, email, phone, password } = req.body;
  if (!name || !email || !phone || !password) return res.status(400).json({ error: "Missing fields" });
  
  const password_hash = await bcrypt.hash(password, 10);
  
  const { data, error } = await supabase
    .from("users")
    .insert([{ name, email, phone, password_hash, role: "user", rating: 5 }])
    .select();

  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: "User registered successfully" });
});

app.post("/api/auth/login", loginLimiter, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password required" });
  
  // Default Admin Check
  if (email === "admin@barijao.com" && password === "admin123") {
    const token = jwt.sign({ email, role: "admin" }, JWT_SECRET);
    return res.json({ token, user: { email, role: "admin", name: "Admin" } });
  }

  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .single();

  if (error) {
    console.error("Login DB error:", error);
    return res.status(401).json({ error: "Invalid credentials", details: error.message });
  }
  
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

// Ticket Routes
app.get("/api/tickets", async (req, res) => {
  const { from, to, date, type, minPrice, maxPrice, sort } = req.query;
  
  let query = supabase.from("tickets").select("*, seller:users(name, rating)").eq("status", "available");

  if (from) query = query.ilike("from_location", `%${from}%`);
  if (to) query = query.ilike("to_location", `%${to}%`);
  if (date) query = query.eq("journey_date", date);
  if (type) query = query.eq("transport_type", type);
  if (minPrice) query = query.gte("asking_price", minPrice);
  if (maxPrice) query = query.lte("asking_price", maxPrice);

  if (sort === "price_asc") query = query.order("asking_price", { ascending: true });
  else if (sort === "newest") query = query.order("created_at", { ascending: false });
  else if (sort === "rating") query = query.order("seller(rating)", { ascending: false });

  const { data, error } = await query;
  if (error) return res.status(400).json({ error: error.message });
  res.json(data || []);
});

app.post("/api/tickets", authenticate, upload.single("ticket_image"), async (req: any, res) => {
  const { transport_type, operator_name, from_location, to_location, journey_date, seat_number, original_price, asking_price, ticket_purchase_date } = req.body;
  const ticket_image = req.file ? `/uploads/${req.file.filename}` : null;

  const { data, error } = await supabase
    .from("tickets")
    .insert([{
      seller_id: req.user.id,
      transport_type,
      operator_name,
      from_location,
      to_location,
      journey_date,
      seat_number,
      original_price,
      asking_price,
      ticket_purchase_date,
      ticket_image,
      status: "available"
    }])
    .select();

  if (error) return res.status(400).json({ error: error.message });
  if (!data || data.length === 0) return res.status(500).json({ error: "Failed to create ticket" });
  res.json(data[0]);
});

app.get("/api/tickets/:id", async (req, res) => {
  const { data, error } = await supabase
    .from("tickets")
    .select("*, seller:users(name, rating, phone)")
    .eq("id", req.params.id)
    .single();
  
  if (error) return res.status(404).json({ error: "Ticket not found" });
  
  // Security: Blur sensitive info for public
  const publicTicket = { ...data };
  if (req.headers.authorization) {
    // If logged in, maybe show more, but prompt says hide for public
    // Admin can see all
  }
  
  // Masking sensitive data
  publicTicket.seat_number = "****";
  // In a real app, we'd use a blurred image URL here for public
  
  res.json(publicTicket);
});

// Chat Routes
app.get("/api/messages/:ticketId", authenticate, async (req: any, res) => {
  const { data, error } = await supabase
    .from("messages")
    .select("*, sender:users(name)")
    .eq("ticket_id", req.params.ticketId)
    .or(`sender_id.eq.${req.user.id},receiver_id.eq.${req.user.id}`)
    .order("created_at", { ascending: true });
  
  if (error) return res.status(400).json({ error: error.message });
  res.json(data || []);
});

app.post("/api/messages", authenticate, async (req: any, res) => {
  const { receiver_id, ticket_id, message } = req.body;
  const { data, error } = await supabase
    .from("messages")
    .insert([{ sender_id: req.user.id, receiver_id, ticket_id, message }])
    .select();
  
  if (error) return res.status(400).json({ error: error.message });
  if (!data || data.length === 0) return res.status(500).json({ error: "Failed to send message" });
  res.json(data[0]);
});

// Transaction Routes
app.post("/api/transactions", authenticate, async (req: any, res) => {
  const { ticket_id, seller_id, payment_method, transaction_id } = req.body;
  const { data, error } = await supabase
    .from("transactions")
    .insert([{ 
      buyer_id: req.user.id, 
      seller_id, 
      ticket_id, 
      payment_method, 
      transaction_id, 
      status: "payment_sent" 
    }])
    .select();
  
  if (error) return res.status(400).json({ error: error.message });
  if (!data || data.length === 0) return res.status(500).json({ error: "Failed to create transaction" });
  res.json(data[0]);
});

app.get("/api/user/dashboard", authenticate, async (req: any, res) => {
  const { data: listings, error: lError } = await supabase.from("tickets").select("*").eq("seller_id", req.user.id);
  const { data: purchases, error: pError } = await supabase.from("transactions").select("*, ticket:tickets(*)").eq("buyer_id", req.user.id);
  
  if (lError) return res.status(400).json({ error: lError.message });
  if (pError) return res.status(400).json({ error: pError.message });
  
  res.json({ listings: listings || [], purchases: purchases || [] });
});

// Admin Actions
app.get("/api/admin/users", authenticate, async (req: any, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
  const { data, error } = await supabase.from("users").select("*");
  if (error) return res.status(400).json({ error: error.message });
  res.json(data || []);
});

app.post("/api/admin/tickets/:id/approve", authenticate, async (req: any, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
  const { error } = await supabase.from("tickets").update({ status: "available" }).eq("id", req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

app.delete("/api/admin/tickets/:id", authenticate, async (req: any, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
  const { error } = await supabase.from("tickets").delete().eq("id", req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

// API 404 Handler
app.use("/api/*", (req, res) => {
  console.log(`404 on API: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    error: `API route not found: ${req.method} ${req.originalUrl}`,
    suggestion: "Check if the route is defined in server.ts and if the proxy/rewrite is correct."
  });
});

// Global Error Handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error(err);
  res.status(err.status || 500).json({ 
    error: err.message || "Internal Server Error" 
  });
});

// Vite middleware
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

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
