import { useEffect, useState } from "react";
import { ArrowUpRight, Award, BookOpen, Users, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";

type LeaderboardRow={position:number;username:string;display_name:string;points:number;solves:number};

export default function CommunityPage(){
 const [rows,setRows]=useState<LeaderboardRow[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 useEffect(()=>{
  let active=true;
  async function load(){
   if(!supabase){if(active){setLoading(false);setError("Connect Supabase to load the opt-in community leaderboard.");}return;}
   const {data,error:queryError}=await supabase.rpc("get_public_leaderboard",{p_limit:25});
   if(!active)return;
   if(queryError){setError(queryError.message);setRows([]);}else setRows((data??[]) as LeaderboardRow[]);
   setLoading(false);
  }
  void load();
  return()=>{active=false;};
 },[]);
 return <section className="section-page community-page">
  <div className="eyebrow">CONNECT / COMMUNITY</div><h1>Learn together. Compete fairly.</h1>
  <p className="section-description">CyberBreach is built for curious beginners, students, defenders, researchers and experienced practitioners. Share what you learn without exposing real systems or other people's data.</p>
  <div className="community-principles"><article><BookOpen size={20}/><h2>Share understanding</h2><p>Explain the reasoning, not just the final flag. Help the next learner build the skill.</p></article><article><ShieldCheck size={20}/><h2>Respect scope</h2><p>Only test systems you own or are explicitly authorized to assess. Keep people and private data out of investigations.</p></article><article><Users size={20}/><h2>Make room for everyone</h2><p>Be constructive with newcomers. Challenge the idea, not the person.</p></article></div>
  <div className="section-heading"><div><span className="eyebrow">CTF COMMUNITY</span><h2>Public leaderboard</h2></div><span className="section-note">OPT-IN ONLY</span></div>
  <div className="leaderboard-panel"><div className="leaderboard-head"><div><Award size={20}/><strong>Top learners</strong></div><span>Verified challenge points</span></div>
   {loading?<p className="leaderboard-empty">Loading public rankings…</p>:error?<p className="leaderboard-empty">{error}</p>:rows.length===0?<div className="leaderboard-empty"><strong>No public rankings yet.</strong><p>Learners appear here only after they choose public leaderboard visibility in Account settings.</p></div>:<div className="leaderboard-table"><div className="leaderboard-row leaderboard-labels"><span>RANK</span><span>LEARNER</span><span>SOLVES</span><span>POINTS</span></div>{rows.map(row=><div className="leaderboard-row" key={row.username}><strong>#{row.position}</strong><div><b>{row.display_name}</b><small>@{row.username}</small></div><span>{row.solves}</span><strong>{row.points.toLocaleString()}</strong></div>)}</div>}
  </div>
  <div className="community-actions"><Link className="secondary-button" to="/account">MANAGE PROFILE VISIBILITY <ArrowUpRight size={14}/></Link><Link className="secondary-button" to="/ctf">EXPLORE CHALLENGES <ArrowUpRight size={14}/></Link></div>
  <div className="learning-note"><div className="note-symbol"><ShieldCheck size={14}/></div><div><strong>Privacy by default</strong><p>Leaderboard participation is disabled by default. The public ranking contains only the display name, username, solve count and aggregate points of learners who opt in. Email addresses and private profiles are never shown.</p></div></div>
  <p className="content-disclaimer">Community posting, team spaces and scheduled competitions will be enabled only after moderation, reporting and event operations are ready. No fictional events or user activity are displayed as real.</p>
 </section>;
}
