import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://vuuxvzydekuvlhpfbsxx.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1dXh2enlkZWt1dmxocGZic3h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwMTEzMTgsImV4cCI6MjA4ODU4NzMxOH0.qWQGYdyUjxGvYJb2jXuVuBTflOT9otvElawj7tyXsvQ';

console.log('Environment variables check:', {
  SUPABASE_URL: !!process.env.SUPABASE_URL,
  VITE_SUPABASE_URL: !!process.env.VITE_SUPABASE_URL,
  SUPABASE_KEY: !!process.env.SUPABASE_KEY,
  VITE_SUPABASE_ANON_KEY: !!process.env.VITE_SUPABASE_ANON_KEY
});

console.log('VITE_SUPABASE_URL value:', process.env.VITE_SUPABASE_URL ? process.env.VITE_SUPABASE_URL.substring(0, 15) + '...' : 'undefined');
console.log('VITE_SUPABASE_ANON_KEY value:', process.env.VITE_SUPABASE_ANON_KEY ? process.env.VITE_SUPABASE_ANON_KEY.substring(0, 10) + '...' : 'undefined');

console.log('Supabase config loaded:', {
  url: supabaseUrl ? supabaseUrl.substring(0, 15) + '...' : 'MISSING',
  key: supabaseKey ? supabaseKey.substring(0, 10) + '...' : 'MISSING',
  source: process.env.SUPABASE_URL ? 'SUPABASE_URL' : (process.env.VITE_SUPABASE_URL ? 'VITE_SUPABASE_URL' : 'HARDCODED')
});

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL or Key is missing. Check your environment variables.');
}

let supabaseClient;
try {
  supabaseClient = createClient(supabaseUrl, supabaseKey);
} catch (e) {
  console.error('Failed to initialize Supabase client:', e);
  supabaseClient = {} as any;
}

export const supabase = supabaseClient;
