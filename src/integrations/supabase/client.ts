import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://vfjmwbxvticnwfmvoonc.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmam13Ynh2dGljbndmbXZvb25jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1ODU2MTksImV4cCI6MjA4OTE2MTYxOX0.RRXMYzPPwGOlAUSS6BDRYVkAw3Tbk09Y1gGsyeYxdyQ';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL or Anonymous Key is missing in environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

