-- SQLite schema for BariJao (used by the local/self-contained fallback database).
-- IDs are generated in application code (crypto.randomUUID()), so no DEFAULT is needed.

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    rating REAL DEFAULT 5.0,
    rating_count INTEGER DEFAULT 0,
    is_verified INTEGER DEFAULT 0,
    avatar_url TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tickets (
    id TEXT PRIMARY KEY,
    seller_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    transport_type TEXT NOT NULL,
    operator_name TEXT NOT NULL,
    from_location TEXT NOT NULL,
    to_location TEXT NOT NULL,
    journey_date TEXT NOT NULL,
    seat_number TEXT NOT NULL,
    original_price REAL NOT NULL,
    asking_price REAL NOT NULL,
    ticket_purchase_date TEXT,
    ticket_image TEXT,
    status TEXT DEFAULT 'available',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    ticket_id TEXT REFERENCES tickets(id) ON DELETE CASCADE,
    sender_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    receiver_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    buyer_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    seller_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    ticket_id TEXT REFERENCES tickets(id) ON DELETE CASCADE,
    payment_method TEXT NOT NULL,
    transaction_id TEXT NOT NULL,
    status TEXT DEFAULT 'payment_sent',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admins (
    id TEXT PRIMARY KEY,
    admin_identifier TEXT UNIQUE NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS otp_codes (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    otp_code TEXT NOT NULL,
    otp_type TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ratings (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    reviewer_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
