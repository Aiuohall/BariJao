import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://vuuxvzydekuvlhpfbsxx.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1dXh2enlkZWt1dmxocGZic3h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwMTEzMTgsImV4cCI6MjA4ODU4NzMxOH0.qWQGYdyUjxGvYJb2jXuVuBTflOT9otvElawj7tyXsvQ";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
