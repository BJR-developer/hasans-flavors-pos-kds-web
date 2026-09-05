import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wplbfxyudyndgzkucbia.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwbGJmeHl1ZHluZGd6a3VjYmlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0MTcyNjEsImV4cCI6MjEwMzk5MzI2MX0.QktkOSyKCimEROkTFDuXc6aRo5RrmbZj9BVSGbyB4_U';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
