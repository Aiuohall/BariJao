import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function init() {
  console.log('Initializing database schema...');
  
  // Note: We can't create tables via REST API. 
  // This script is mainly to check if they exist and provide instructions.
  
  const tables = ['users', 'tickets', 'messages', 'transactions'];
  
  for (const table of tables) {
    const { error } = await supabase.from(table).select('count', { count: 'exact', head: true });
    if (error) {
      console.error(`Table "${table}" check failed:`, error.message);
      console.log(`Please ensure table "${table}" exists in your Supabase project.`);
    } else {
      console.log(`Table "${table}" exists.`);
    }
  }
}

init();
