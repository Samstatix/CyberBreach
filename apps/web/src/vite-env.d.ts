/// <reference types="vite/client" />
interface ImportMetaEnv{
 readonly VITE_SUPABASE_URL?:string;
 readonly VITE_SUPABASE_ANON_KEY?:string;
 readonly VITE_CYBERBREACH_LAB_PORTAL_URL?:string;
}
interface ImportMeta{readonly env:ImportMetaEnv;}
declare const process:{env:{
 NEXT_PUBLIC_SUPABASE_URL?:string;
 NEXT_PUBLIC_SUPABASE_ANON_KEY?:string;
 NEXT_PUBLIC_CYBERBREACH_LAB_PORTAL_URL?:string;
}};
