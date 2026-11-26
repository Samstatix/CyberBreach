/**
 * Guest progress is local to this browser. Signed-in progress is also synced to
 * the user's own Supabase row and remains separate from competitive CTF scoring.
 */
import { supabase } from "./supabase";
const STORAGE_PREFIX="cyberbreach.academy.completed.v1";
function storageKey(userId?:string){return `${STORAGE_PREFIX}.${userId||"guest"}`;}

export function getCompletedLessonIds(userId?:string):string[]{
 try{const raw=window.localStorage.getItem(storageKey(userId));if(!raw)return[];const value:unknown=JSON.parse(raw);return Array.isArray(value)?value.filter((item):item is string=>typeof item==="string"):[];}catch{return[];}
}

export async function loadCompletedLessonIds(userId?:string):Promise<string[]>{
 const local=getCompletedLessonIds(userId);if(!userId||!supabase)return local;
 const {data,error}=await supabase.from("academy_lesson_progress").select("lesson_id").eq("user_id",userId);
 if(error||!data)return local;
 const merged=[...new Set([...local,...data.map(row=>row.lesson_id)])];
 try{window.localStorage.setItem(storageKey(userId),JSON.stringify(merged));}catch{/* database progress remains available */}
 return merged;
}

export function markLessonComplete(lessonId:string,userId?:string):string[]{
 const completed=new Set(getCompletedLessonIds(userId));completed.add(lessonId);const next=[...completed];
 try{window.localStorage.setItem(storageKey(userId),JSON.stringify(next));}catch{/* current page still updates */}
 if(userId&&supabase){void supabase.from("academy_lesson_progress").upsert({user_id:userId,lesson_id:lessonId},{onConflict:"user_id,lesson_id"});}
 return next;
}
