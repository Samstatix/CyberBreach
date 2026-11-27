/**
 * Browser Supabase client. The service-role key must never be exposed to browser code.
 * runtimeConfig supports standalone Vite and a later Next.js mount.
 */
import { createClient } from "@supabase/supabase-js";
import { runtimeConfig } from "./runtimeConfig";

export const isSupabaseConfigured = Boolean(runtimeConfig.supabaseUrl && runtimeConfig.supabaseAnonKey);
export const supabase = isSupabaseConfigured ? createClient(runtimeConfig.supabaseUrl,runtimeConfig.supabaseAnonKey,{
 auth:{autoRefreshToken:true,detectSessionInUrl:true,persistSession:true}
}) : null;
