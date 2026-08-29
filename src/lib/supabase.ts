import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://avdkbpgookwbsrmddlhj.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseAnonKey && supabaseAnonKey !== 'TU_ANON_KEY_DE_SUPABASE');

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey || 'dummy-key-for-initialization'
);
