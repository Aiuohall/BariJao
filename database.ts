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
  const schema = fs.readFileSync(path.join(__dirname, 'supabase.sql'), 'utf8');
  // Supabase SQL might have some syntax not compatible with SQLite (like UUID, gen_random_uuid, etc.)
  // We'll do some basic replacements for SQLite compatibility
  const sqliteSchema = schema
    .replace(/UUID PRIMARY KEY DEFAULT gen_random_uuid\(\)/g, 'TEXT PRIMARY KEY')
    .replace(/UUID REFERENCES/g, 'TEXT REFERENCES')
    .replace(/TIMESTAMP WITH TIME ZONE DEFAULT NOW\(\)/g, 'DATETIME DEFAULT CURRENT_TIMESTAMP')
    .replace(/DATE NOT NULL/g, 'TEXT NOT NULL')
    .replace(/DECIMAL/g, 'REAL')
    .replace(/CREATE EXTENSION IF NOT EXISTS "pgcrypto";/g, '')
    .replace(/ALTER TABLE .* ENABLE ROW LEVEL SECURITY;/g, '')
    .replace(/DROP POLICY IF EXISTS .* ON .*;/g, '')
    .replace(/CREATE POLICY .* ON .* FOR .* USING \(.*\);/g, '')
    .replace(/BOOLEAN DEFAULT false/g, 'INTEGER DEFAULT 0')
    .replace(/BOOLEAN DEFAULT true/g, 'INTEGER DEFAULT 1')
    .replace(/CHECK \(status IN \('pending', 'available', 'sold'\)\)/g, ''); // SQLite check constraints are different but we can skip for now

  try {
    sqlite.exec(sqliteSchema);
    console.log('SQLite schema initialized');
  } catch (e) {
    console.error('Failed to initialize SQLite schema:', e);
  }
};

// Check if Supabase is working
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
      // Mock Supabase-like interface for SQLite
      const builder = {
        _query: `SELECT * FROM ${table}`,
        _params: [] as any[],
        _single: false,
        _limit: null as number | null,
        _order: null as string | null,
        _filters: [] as string[],

        select: function(query = '*', options: any = {}) {
          if (options.count === 'exact') {
            this._query = `SELECT count(*) as count FROM ${table}`;
          } else if (query.includes('seller:users')) {
            // Join mock for tickets and users
            this._query = `SELECT tickets.*, users.name as seller_name, users.rating as seller_rating, users.rating_count as seller_rating_count FROM tickets JOIN users ON tickets.seller_id = users.id`;
          } else if (query.includes('ticket:tickets')) {
            // Join mock for messages, tickets, and users
            this._query = `SELECT messages.*, tickets.transport_type as ticket_transport_type, tickets.operator_name as ticket_operator_name, sender.name as sender_name, receiver.name as receiver_name FROM messages JOIN tickets ON messages.ticket_id = tickets.id JOIN users as sender ON messages.sender_id = sender.id JOIN users as receiver ON messages.receiver_id = receiver.id`;
          } else if (query.includes('buyer:users')) {
            // Join mock for transactions, buyers, sellers, and tickets
            this._query = `SELECT transactions.*, buyer.name as buyer_name, seller.name as seller_name, tickets.operator_name as ticket_operator_name FROM transactions JOIN users as buyer ON transactions.buyer_id = buyer.id JOIN users as seller ON transactions.seller_id = seller.id JOIN tickets ON transactions.ticket_id = tickets.id`;
          } else if (query !== '*') {
            this._query = `SELECT ${query} FROM ${table}`;
          }
          return this;
        },

        eq: function(column: string, value: any) {
          this._filters.push(`${column} = ?`);
          this._params.push(value);
          return this;
        },

        neq: function(column: string, value: any) {
          this._filters.push(`${column} != ?`);
          this._params.push(value);
          return this;
        },

        gt: function(column: string, value: any) {
          this._filters.push(`${column} > ?`);
          this._params.push(value);
          return this;
        },

        lt: function(column: string, value: any) {
          this._filters.push(`${column} < ?`);
          this._params.push(value);
          return this;
        },

        ilike: function(column: string, value: string) {
          this._filters.push(`${column} LIKE ?`);
          this._params.push(value.replace(/%/g, '%')); // SQLite LIKE is case-insensitive by default in many configs, or we can use LOWER
          return this;
        },

        or: function(query: string) {
          // Very basic OR mock: sender_id.eq.1,receiver_id.eq.1 -> (sender_id = 1 OR receiver_id = 1)
          const parts = query.split(',');
          const orFilters = parts.map(p => {
            const [col, op, val] = p.split('.');
            this._params.push(val);
            return `${col} = ?`;
          });
          this._filters.push(`(${orFilters.join(' OR ')})`);
          return this;
        },

        maybeSingle: function() {
          this._single = true;
          this._limit = 1;
          return this;
        },

        single: function() {
          this._single = true;
          this._limit = 1;
          return this;
        },

        limit: function(n: number) {
          this._limit = n;
          return this;
        },

        order: function(column: string, options: any = {}) {
          this._order = `ORDER BY ${column} ${options.ascending === false ? 'DESC' : 'ASC'}`;
          return this;
        },

        update: function(updates: any) {
          const keys = Object.keys(updates);
          const values = Object.values(updates).map(v => {
            if (typeof v === 'boolean') return v ? 1 : 0;
            return v;
          });
          this._query = `UPDATE ${table} SET ${keys.map(k => `${k} = ?`).join(',')}`;
          this._params.unshift(...values); // Updates come before filters in the query
          return this;
        },

        delete: function() {
          this._query = `DELETE FROM ${table}`;
          return this;
        },

        then: async function(resolve: any, reject: any) {
          let finalQuery = this._query;
          if (this._filters.length > 0) {
            finalQuery += ` WHERE ${this._filters.join(' AND ')}`;
          }
          if (this._order) {
            finalQuery += ` ${this._order}`;
          }
          if (this._limit) {
            finalQuery += ` LIMIT ${this._limit}`;
          }

          try {
            const stmt = sqlite.prepare(finalQuery);
            let data: any;
            if (this._single) {
              data = stmt.get(...this._params);
            } else {
              data = stmt.all(...this._params);
            }
            
            // Handle count result
            if (this._query.includes('count(*)')) {
              const count = data ? (data.count || 0) : 0;
              return resolve({ data: null, count, error: null });
            }

            // Handle joined data nesting (e.g., seller_name -> seller: { name: ... })
            if (Array.isArray(data)) {
              data = data.map(item => {
                const newItem: any = { ...item };
                Object.keys(item).forEach(key => {
                  if (key.startsWith('seller_')) {
                    const subKey = key.replace('seller_', '');
                    if (!newItem.seller) newItem.seller = {};
                    newItem.seller[subKey] = item[key];
                    delete newItem[key];
                  } else if (key.startsWith('ticket_')) {
                    const subKey = key.replace('ticket_', '');
                    if (!newItem.ticket) newItem.ticket = {};
                    newItem.ticket[subKey] = item[key];
                    delete newItem[key];
                  } else if (key.startsWith('sender_')) {
                    const subKey = key.replace('sender_', '');
                    if (!newItem.sender) newItem.sender = {};
                    newItem.sender[subKey] = item[key];
                    delete newItem[key];
                  } else if (key.startsWith('receiver_')) {
                    const subKey = key.replace('receiver_', '');
                    if (!newItem.receiver) newItem.receiver = {};
                    newItem.receiver[subKey] = item[key];
                    delete newItem[key];
                  } else if (key.startsWith('buyer_')) {
                    const subKey = key.replace('buyer_', '');
                    if (!newItem.buyer) newItem.buyer = {};
                    newItem.buyer[subKey] = item[key];
                    delete newItem[key];
                  }
                });
                return newItem;
              });
            }

            return resolve({ data, error: null });
          } catch (e: any) {
            console.error('SQLite query error:', e, 'Query:', finalQuery);
            return resolve({ data: null, error: e });
          }
        },

        insert: function(data: any[]) {
          const processedData = data.map(d => {
            const newItem = { ...d };
            if (!newItem.id) newItem.id = crypto.randomUUID();
            Object.keys(newItem).forEach(key => {
              if (typeof newItem[key] === 'boolean') newItem[key] = newItem[key] ? 1 : 0;
            });
            return newItem;
          });
          const keys = Object.keys(processedData[0]);
          const values = processedData.map(d => Object.values(d));
          const placeholders = keys.map(() => '?').join(',');
          const stmt = sqlite.prepare(`INSERT INTO ${table} (${keys.join(',')}) VALUES (${placeholders})`);
          
          try {
            const results = values.map(v => stmt.run(...v));
            // Mock the .select().single() chain
            return {
              select: () => ({
                single: () => ({ data: processedData[0], error: null })
              }),
              then: (resolve: any) => resolve({ data: processedData[0], error: null })
            };
          } catch (e: any) {
            return { data: null, error: e, then: (resolve: any) => resolve({ data: null, error: e }) };
          }
        },

        upsert: function(data: any[]) {
          return this.insert(data);
        }
      };
      return builder as any;
    }
  }
};

export { useSupabase };
