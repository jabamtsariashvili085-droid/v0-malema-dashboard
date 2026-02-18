import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log("[v0] Supabase URL:", supabaseUrl);
console.log("[v0] Supabase Key exists:", !!supabaseAnonKey);
console.log("[v0] Supabase Key length:", supabaseAnonKey?.length);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
