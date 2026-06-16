-- Run this ONCE in Supabase -> SQL Editor for the marketplace feature update.
-- Adds the profile-photo column. Safe to run more than once.

ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
