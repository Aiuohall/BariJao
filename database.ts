import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import { supabase } from './supabase.ts';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize SQLite lazily
let sqlite: any = null;

const initSqlite = () => {
  if (sqlite) return;
  try {
    const Database = require('better-sqlite3');
    const isVercel = !!process.env.VERCEL;
    const dbDir = isVercel ? '/tmp' : __dirname;
    const dbPath = path.join(dbDir, 'barijao.db');
    
    sqlite = new Database(dbPath);
    
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
    console.log(`SQLite schema initialized at ${dbPath}`);
  } catch (e) {
    console.error('Failed to initialize SQLite schema:', e);
  }
};

export const dbStatus = {
  useSupabase: false,
  isReady: false
};

const checkSupabase = async () => {
  try {
    if (!supabase || typeof supabase.from !== 'function') {
      throw new Error('Supabase client not initialized correctly');
    }
    const { error } = await supabase.from('users').select('count', { count: 'exact', head: true });
    if (error) {
      console.warn('Supabase connection failed, falling back to SQLite:', error.message);
      dbStatus.useSupabase = false;
      initSqlite();
    } else {
      console.log('Using Supabase as primary database');
      dbStatus.useSupabase = true;
    }
  } catch (e: any) {
    console.warn('Supabase connection error, falling back to SQLite:', e.message);
    dbStatus.useSupabase = false;
    initSqlite();
  } finally {
    dbStatus.isReady = true;
  }
};

// Initial check
checkSupabase().then(() => {
  console.log('Database initialization complete. Status:', JSON.stringify(dbStatus));
});

export const db = {
  from: (table: string) => {
    if (dbStatus.useSupabase) {
      return supabase.from(table);
    } else {
      // Mock Supabase-like interface for SQLite
      if (!sqlite) initSqlite();
      
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
            this._query = `SELECT tickets.*, users.name as seller_name, users.rating as seller_rating, users.rating_count as seller_rating_count, users.is_verified as seller_is_verified FROM tickets JOIN users ON tickets.seller_id = users.id`;
          } else if (query.includes('ticket:tickets')) {
            this._query = `SELECT messages.*, tickets.transport_type as ticket_transport_type, tickets.operator_name as ticket_operator_name, sender.name as sender_name, receiver.name as receiver_name FROM messages JOIN tickets ON messages.ticket_id = tickets.id JOIN users as sender ON messages.sender_id = sender.id JOIN users as receiver ON messages.receiver_id = receiver.id`;
          } else if (query.includes('buyer:users')) {
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
          this._params.push(value.replace(/%/g, '%'));
          return this;
        },

        or: function(query: string) {
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
          this._params.unshift(...values);
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
            
            if (this._query.includes('count(*)')) {
              const count = data ? (data.count || 0) : 0;
              return resolve({ data: null, count, error: null });
            }

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
            values.forEach(v => stmt.run(...v));
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


