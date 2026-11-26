import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { ArrowLeft, CheckCircle2, LogIn, LogOut, ShieldCheck, UserRound, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { supabase } from "../../lib/supabase";

type AccountMode="sign-in"|"sign-up";
type StatusMessage={kind:"success"|"error"|"info";text:string};

export default function AccountPage(){
 const {user,loading,configured,signIn,signUp,signOut}=useAuth();
 const [mode,setMode]=useState<AccountMode>("sign-in");
 const [email,setEmail]=useState("");const [password,setPassword]=useState("");const [username,setUsername]=useState("");
 const [busy,setBusy]=useState(false);const [status,setStatus]=useState<StatusMessage|null>(null);
 const [leaderboardOptIn,setLeaderboardOptIn]=useState(false);const [profileLoading,setProfileLoading]=useState(false);const [profileBusy,setProfileBusy]=useState(false);

 useEffect(()=>{
  let active=true;
  async function loadProfile(){
   if(!user||!supabase)return;
   setProfileLoading(true);
   const {data}=await supabase.from("profiles").select("username,display_name,show_on_leaderboard").eq("id",user.id).maybeSingle();
   if(active&&data)setLeaderboardOptIn(Boolean(data.show_on_leaderboard));
   if(active)setProfileLoading(false);
  }
  void loadProfile();
  return()=>{active=false;};
 },[user?.id]);

 async function handleSubmit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();setStatus(null);setBusy(true);
  try{
   if(mode==="sign-in"){const error=await signIn(email.trim(),password);if(error)setStatus({kind:"error",text:error});}
   else{const result=await signUp(email.trim(),password,username.trim());if(result.error)setStatus({kind:"error",text:result.error});else if(result.confirmationRequired)setStatus({kind:"success",text:"Account created. Check your email to confirm the address before signing in."});else setStatus({kind:"success",text:"Your account is ready. Welcome to CyberBreach."});}
  }finally{setBusy(false);}
 }
 async function handleSignOut(){setBusy(true);const error=await signOut();setBusy(false);setStatus(error?{kind:"error",text:error}:{kind:"success",text:"You have signed out."});}
 async function toggleLeaderboard(){
  if(!user||!supabase)return;
  setProfileBusy(true);setStatus(null);const next=!leaderboardOptIn;
  const {error}=await supabase.from("profiles").update({show_on_leaderboard:next}).eq("id",user.id);
  if(error)setStatus({kind:"error",text:error.message});else{setLeaderboardOptIn(next);setStatus({kind:"success",text:next?"Your public leaderboard visibility is enabled.":"Your public leaderboard visibility is disabled."});}
  setProfileBusy(false);
 }

 return <section className="section-page account-page">
  <Link className="back-link" to="/"><ArrowLeft size={14}/> BACK TO OVERVIEW</Link><div className="eyebrow">COLLABCIRCLE / YOUR ACCOUNT</div><h1>Your learning identity.</h1>
  <p className="section-description">A free account syncs lesson progress and records verified CTF solves. Public learning content remains available without signing in.</p>
  {loading?<div className="account-card"><p>Checking your session…</p></div>:user?<div className="account-card">
   <div className="account-card-icon"><UserRound size={23}/></div><span className="eyebrow">SIGNED IN</span><h2>Welcome back.</h2><p className="account-email">{user.email}</p>
   <div className="account-security-note"><ShieldCheck size={16}/><span>Your identity is managed by Supabase Auth. Challenge scores are recorded by trusted database functions, not by this browser.</span></div>
   <div className="account-privacy-setting"><div><strong><Users size={15}/> Public leaderboard</strong><p>Show your username, display name, solve count and aggregate points to other learners. Email and private profile data are never shown.</p></div><button type="button" className={leaderboardOptIn?"visibility-toggle active":"visibility-toggle"} onClick={toggleLeaderboard} disabled={profileLoading||profileBusy} aria-pressed={leaderboardOptIn}>{profileBusy?"SAVING…":leaderboardOptIn?"VISIBLE":"HIDDEN"}</button></div>
   {status&&<p className={"account-status "+status.kind} role="status">{status.text}</p>}
   <button className="primary-button account-submit" onClick={handleSignOut} type="button" disabled={busy}><LogOut size={15}/>{busy?"SIGNING OUT…":"SIGN OUT"}</button>
  </div>:<div className="account-card">
   <div className="account-card-icon"><LogIn size={23}/></div><div className="account-tabs"><button type="button" className={mode==="sign-in"?"active":""} onClick={()=>{setMode("sign-in");setStatus(null);}}>SIGN IN</button><button type="button" className={mode==="sign-up"?"active":""} onClick={()=>{setMode("sign-up");setStatus(null);}}>CREATE ACCOUNT</button></div>
   {!configured&&<div className="account-config-notice"><strong>Account services need configuration</strong><p>Copy <code>.env.example</code> to <code>.env</code>, then add your Supabase project URL and publishable/anon key. Apply the database migrations before profiles and scoring can work.</p></div>}
   <form className="account-form" onSubmit={handleSubmit}>
    {mode==="sign-up"&&<label>Username<input value={username} onChange={event=>setUsername(event.target.value.toLowerCase().replace(/[^a-z0-9_]/g,""))} minLength={3} maxLength={24} pattern="[a-z0-9_]{3,24}" placeholder="your_handle" required autoComplete="username"/><small>3–24 characters. Lowercase letters, numbers and underscores.</small></label>}
    <label>Email address<input type="email" value={email} onChange={event=>setEmail(event.target.value)} placeholder="you@example.com" required autoComplete="email"/></label>
    <label>Password<input type="password" value={password} onChange={event=>setPassword(event.target.value)} minLength={10} placeholder="At least 10 characters" required autoComplete={mode==="sign-in"?"current-password":"new-password"}/>{mode==="sign-up"&&<small>Use a unique password. Never reuse your email password.</small>}</label>
    <button className="primary-button account-submit" type="submit" disabled={!configured||busy}>{busy?"PLEASE WAIT…":mode==="sign-in"?"SIGN IN":"CREATE FREE ACCOUNT"}</button>
   </form>
   {status&&<p className={"account-status "+status.kind} role="status">{status.text}</p>}
   <p className="account-free-note"><CheckCircle2 size={14}/> CyberBreach accounts are free. No paid learning tiers or competitive advantages.</p>
  </div>}
  <p className="account-public-note">Just exploring? <Link to="/academy">Continue to Cyber Academy without signing in.</Link></p>
 </section>;
}
