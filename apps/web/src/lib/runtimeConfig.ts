/**
 * Public browser configuration shared by the Vite build and the later Next.js mount.
 * Only publishable Supabase values and a public lab portal URL belong here.
 */
const viteEnv = import.meta.env;
const nextEnv = typeof process === "undefined" ? {} : process.env;

export const runtimeConfig = {
  supabaseUrl: viteEnv?.VITE_SUPABASE_URL?.trim() || nextEnv.NEXT_PUBLIC_SUPABASE_URL?.trim() || "",
  supabaseAnonKey: viteEnv?.VITE_SUPABASE_ANON_KEY?.trim() || nextEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || "",
  labPortalUrl: viteEnv?.VITE_CYBERBREACH_LAB_PORTAL_URL?.trim() || nextEnv.NEXT_PUBLIC_CYBERBREACH_LAB_PORTAL_URL?.trim() || ""
};
