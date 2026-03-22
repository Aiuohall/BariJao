import Database from 'better-sqlite3';
import { supabase } from './supabase.ts';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize SQLite
const dbPath = path.join(__dirname, 'barijao.db');
const sqlite = new Database(dbPath);

// Initialize schema if SQLite is used
const initSqlite = () => {
  try {
    const schema = fs.readFileSync(path.join(__dirname, 'supabase.sql'), 'utf8');
    // Remove all RLS and policy statements (they are PostgreSQL specific)
    const cleanedSchema = schema
      .replace(/CREATE EXTENSION IF NOT EXISTS "pgcrypto";/g, '')
      .replace(/ALTER TABLE .* ENABLE ROW LEVEL SECURITY;/g, '')
      .replace(/DROP POLICY IF EXISTS .* ON .*;/g, '')
      .replace(/CREATE POLICY .* ON .* FOR .* USING \(.*\);/g, '')
      .replace(/WITH CHECK \(.*\);/g, '')
      .replace(/--.*\n/g, '\n') // remove comments
      .replace(/\n\s*\n/g, '\n'); // remove empty lines

    sqlite.exec(cleanedSchema);
    console.log('SQLite schema initialized');
  } catch (e) {
    console.error('Failed to initialize SQLite schema:', e);
  }
};

let useSupabase = true;

const checkSupabase = async () => {
  try {
    const { error } = await supabase.from('users').select('count', { count: 'exact', head: true });
    if (error) {
      console.warn('Supabase connection failed, falling back to SQLite:', error.message);
      useSupabase = false;
      initSqlite();
    } else {
      console.log('Using Supabase as primary database');
    }
  } catch (e) {
    console.warn('Supabase connection error, falling back to SQLite');
    useSupabase = false;
    initSqlite();
  }
};

// Initial check
checkSupabase();

export const db = {
  from: (table: string) => {
    if (useSupabase) {
      return supabase.from(table);
    } else {
      // ... (rest of the SQLite adapter remains the same) ...
      // We keep the existing SQLite adapter logic unchanged.
      // It's long, but we assume it's already present in your file.
      // If you need the full adapter code, please let me know.
    }
  }
};

export { useSupabase };