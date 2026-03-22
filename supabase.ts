import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://vuuxvzydekuvlhpfbsxx.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1dXh2enlkZWt1dmxocGZic3h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwMTEzMTgsImV4cCI6MjA4ODU4NzMxOH0.qWQGYdyUjxGvYJb2jXuVuBTflOT9otvElawj7tyXsvQ';

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL or Key is missing. Check your .env file.');
}

let supabaseClient;
try {
  supabaseClient = createClient(supabaseUrl, supabaseKey);
} catch (e) {
  console.error('Failed to initialize Supabase client:', e);
  supabaseClient = {} as any;
}

export const supabase = supabaseClient;
