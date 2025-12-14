import { createClient } from '@supabase/supabase-js';

declare const VITE_SUPABASE_URL: string;
declare const VITE_SUPABASE_KEY: string;

// Get from environment variables (Vite will replace these at build time)
const supabaseUrl = typeof VITE_SUPABASE_URL !== 'undefined' ? VITE_SUPABASE_URL : '';
const supabaseKey = typeof VITE_SUPABASE_KEY !== 'undefined' ? VITE_SUPABASE_KEY : '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please set VITE_SUPABASE_URL and VITE_SUPABASE_KEY in .env.local');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
