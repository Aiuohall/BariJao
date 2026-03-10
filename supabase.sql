-- SQL Schema for BariJao Supabase Project

-- ================================================
-- 1. Setup Extensions & Tables
-- ================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    rating DECIMAL DEFAULT 5.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tickets Table
CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID REFERENCES users(id) ON DELETE CASCADE,
    transport_type TEXT NOT NULL,
    operator_name TEXT NOT NULL,
    from_location TEXT NOT NULL,
    to_location TEXT NOT NULL,
    journey_date DATE NOT NULL,
    seat_number TEXT NOT NULL,
    original_price DECIMAL NOT NULL,
    asking_price DECIMAL NOT NULL,
    ticket_purchase_date DATE NOT NULL,
    ticket_image TEXT,
    status TEXT DEFAULT 'available',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages Table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    seller_id UUID REFERENCES users(id) ON DELETE CASCADE,
    ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
    payment_method TEXT NOT NULL,
    transaction_id TEXT NOT NULL,
    status TEXT DEFAULT 'payment_sent',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- 2. Enable Security (RLS)
-- ================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Users Policies
DROP POLICY IF EXISTS "Allow public registration" ON users;
CREATE POLICY "Allow public registration" ON users FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public read access" ON users;
CREATE POLICY "Allow public read access" ON users FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow users to update own record" ON users;
CREATE POLICY "Allow users to update own record" ON users FOR UPDATE USING (true);

-- Tickets Policies
DROP POLICY IF EXISTS "Allow public read access for tickets" ON tickets;
CREATE POLICY "Allow public read access for tickets" ON tickets FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow all for tickets" ON tickets;
CREATE POLICY "Allow all for tickets" ON tickets FOR ALL USING (true) WITH CHECK (true);

-- Messages Policies
DROP POLICY IF EXISTS "Allow all for messages" ON messages;
CREATE POLICY "Allow all for messages" ON messages FOR ALL USING (true) WITH CHECK (true);

-- Transactions Policies
DROP POLICY IF EXISTS "Allow all for transactions" ON transactions;
CREATE POLICY "Allow all for transactions" ON transactions FOR ALL USING (true) WITH CHECK (true);
