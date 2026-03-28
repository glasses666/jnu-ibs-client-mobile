import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../constants.js';
import { appConfig } from '../config/appConfig.js';

// Create a single Supabase client for interacting with your database
export const isCloudAuthEnabled = appConfig.cloudAuthEnabled;

export const supabase = isCloudAuthEnabled
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage: localStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;
