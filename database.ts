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
  if (sqlite) return sqlite;

  try {
    const Database = require('better-sqlite3');
    const isVercel = !!process.env.VERCEL;
    const dbDir = isVercel ? '/tmp' : __dirname;
    const dbPath = path.join(dbDir, 'barijao.db');
    
    sqlite = new Database(dbPath);
    
    // Use a dedicated SQLite schema. The Postgres schema (supabase.sql) uses
    // syntax SQLite cannot parse (gen_random_uuid(), TIMESTAMP WITH TIME ZONE,
    // RLS/policies), so we ship a SQLite-native schema instead.
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sqlite.sql'), 'utf8');
    sqlite.exec(schema);
    sqlite.pragma('foreign_keys = ON');
    console.log(`SQLite fallback initialized at ${dbPath}`);
    return sqlite;
  } catch (e) {
    console.error('Failed to initialize SQLite fallback:', e);
    return null;
  }
};

export const getSqlite = () => {
  if (!sqlite) initSqlite();
  return sqlite;
};

export const dbStatus = {
  useSupabase: false,
  isReady: false
};

const checkSupabase = async () => {
  const hasUrl = !!(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL);
  const hasKey = !!(process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY);

  if (!hasUrl || !hasKey) {
    console.warn('Supabase credentials missing, using SQLite fallback');
    dbStatus.useSupabase = false;
    initSqlite();
    dbStatus.isReady = true;
    return;
  }

  try {
    if (!supabase || typeof supabase.from !== 'function') {
      throw new Error('Supabase client not initialized correctly');
    }
    
    console.log('Supabase credentials found, testing connection...');
    const { error } = await supabase.from('users').select('count', { count: 'exact', head: true });
    
    if (error) {
      console.warn('Supabase connection failed, falling back to SQLite:', error.message);
      dbStatus.useSupabase = false;
      initSqlite();
    } else {
      console.log('Supabase connection successful, using as primary database');
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
        // UPDATE/DELETE must be executed with run(), not get()/all() — better-sqlite3
        // throws "This statement does not return data" otherwise.
        _op: 'select' as 'select' | 'update' | 'delete',
        // How many of _params belong to the SET clause, so the WHERE params can
        // be replayed on their own when reading a row back after an UPDATE.
        _setParamCount: 0,
        // Whether .select() was chained after .update() (supabase returns the row).
        _returning: false,

        select: function(query = '*', options: any = {}) {
          if (this._op !== 'select') {
            this._returning = true;
            return this;
          }
          if (options.count === 'exact') {
            this._query = `SELECT count(*) as count FROM ${table}`;
          } else if (query.includes('seller:users')) {
            this._query = `SELECT tickets.*, users.name as seller_name, users.rating as seller_rating, users.rating_count as seller_rating_count, users.is_verified as seller_is_verified FROM tickets JOIN users ON tickets.seller_id = users.id`;
          } else if (query.includes('ticket:tickets')) {
            this._query = `SELECT messages.*, tickets.transport_type as ticket_transport_type, tickets.operator_name as ticket_operator_name, tickets.from_location as ticket_from_location, tickets.to_location as ticket_to_location, sender.name as sender_name, sender.avatar_url as sender_avatar_url, receiver.name as receiver_name, receiver.avatar_url as receiver_avatar_url FROM messages LEFT JOIN tickets ON messages.ticket_id = tickets.id LEFT JOIN users as sender ON messages.sender_id = sender.id LEFT JOIN users as receiver ON messages.receiver_id = receiver.id`;
          } else if (query.includes('sender:users') || query.includes('sender_id')) {
            this._query = `SELECT messages.*, sender.name as sender_name, sender.avatar_url as sender_avatar_url, receiver.name as receiver_name, receiver.avatar_url as receiver_avatar_url FROM messages LEFT JOIN users as sender ON messages.sender_id = sender.id LEFT JOIN users as receiver ON messages.receiver_id = receiver.id`;
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
          this._op = 'update';
          this._setParamCount = values.length;
          return this;
        },

        delete: function() {
          this._query = `DELETE FROM ${table}`;
          this._op = 'delete';
          return this;
        },

        then: async function(resolve: any, reject: any) {
          const where = this._filters.length > 0 ? ` WHERE ${this._filters.join(' AND ')}` : '';

          // Writes: execute with run() and, when the caller chained .select(),
          // read the affected row back so the result matches supabase's shape.
          if (this._op === 'update' || this._op === 'delete') {
            const writeQuery = this._query + where;
            try {
              const info = sqlite.prepare(writeQuery).run(...this._params);
              let data: any = null;
              if (this._op === 'update' && this._returning) {
                const whereParams = this._params.slice(this._setParamCount);
                const readStmt = sqlite.prepare(`SELECT * FROM ${table}${where}`);
                data = this._single ? readStmt.get(...whereParams) : readStmt.all(...whereParams);
              }
              return resolve({ data, error: null, count: info.changes });
            } catch (e: any) {
              console.error('SQLite write error:', e, 'Query:', writeQuery);
              return resolve({ data: null, error: e });
            }
          }

          let finalQuery = this._query + where;
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


