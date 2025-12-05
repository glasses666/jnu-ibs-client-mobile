import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../constants';

// Create a single Supabase client for interacting with your database
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage, // Use localStorage for web/capacitor
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Important for Capacitor redirects
  },
});
