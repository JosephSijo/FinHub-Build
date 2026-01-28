import { createClient } from '@supabase/supabase-js';

// Strictly read from Environment Variables
const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!projectId || !anonKey || projectId === "" || anonKey === "") {
    throw new Error("Supabase Configuration Missing! Please set VITE_SUPABASE_PROJECT_ID and VITE_SUPABASE_ANON_KEY in your .env file.");
}

const supabaseUrl = `https://${projectId}.supabase.co`;

export const supabase = createClient(supabaseUrl, anonKey);
