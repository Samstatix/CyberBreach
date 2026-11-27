import { useCallback, useEffect, useState } from "react";
import { ArrowUpRight, Award, BookOpen, Copy, Crown, LogOut, ShieldCheck, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { supabase } from "../../lib/supabase";

type LeaderboardRow = { position: number; username: string; display_name: string; points: number; solves: number };
type TeamMember = { username: string; display_name: string; role: "owner" | "member"; joined_at: string };
type MyTeam = {
  team_id: string; slug: string; name: string; description: string;
  is_public: boolean; role: "owner" | "member"; members: TeamMember[];
};
type TeamRank = { position: number; team_slug: string; team_name: string; member_count: number; points: number; solves: number };

function formatPoints(value: number | string) {
  return Number(value ?? 0).toLocaleString();
}

export default function CommunityPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [teamRows, setTeamRows] = useState<TeamRank[]>([]);
  const [loadingBoards, setLoadingBoards] = useState(true);
  const [boardError, setBoardError] = useState("");
  const [team, setTeam] = useState<MyTeam | null>(null);
  const [teamLoading, setTeamLoading] = useState(false);
  const [teamBusy, setTeamBusy] = useState(false);
  const [teamError, setTeamError] = useState("");
  const [teamNotice, setTeamNotice] = useState("");
  const [teamName, setTeamName] = useState("");
  const [teamDescription, setTeamDescription] = useState("");
  const [inviteInput, setInviteInput] = useState("");
  const [newInviteCode, setNewInviteCode] = useState("");

  const loadMyTeam = useCallback(async () => {
    if (!user || !supabase) { setTeam(null); setTeamLoading(false); return; }
    setTeamLoading(true);
    const { data, error } = await supabase.rpc("get_my_community_team");
    if (error) setTeamError(error.message);
    else setTeam((data ?? null) as MyTeam | null);
    setTeamLoading(false);
  }, [user?.id]);

  const loadBoards = useCallback(async () => {
    if (!supabase) {
      setBoardError("Connect Supabase to load community rankings.");
      setLoadingBoards(false);
      return;
    }
    const [globalResult, teamResult] = await Promise.all([
      supabase.rpc("get_public_leaderboard", { p_limit: 25 }),
      supabase.rpc("get_public_team_leaderboard", { p_limit: 15 }),
    ]);
    if (globalResult.error || teamResult.error) {
      setBoardError(globalResult.error?.message || teamResult.error?.message || "Community rankings could not be loaded.");
    } else {
      setRows((globalResult.data ?? []) as LeaderboardRow[]);
      setTeamRows((teamResult.data ?? []) as TeamRank[]);
      setBoardError("");
    }
    setLoadingBoards(false);
  }, []);

  useEffect(() => {
    void loadBoards();
  }, [loadBoards]);

  useEffect(() => {
    void loadMyTeam();
  }, [loadMyTeam]);

  async function createTeam(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    setTeamBusy(true); setTeamError(""); setTeamNotice(""); setNewInviteCode("");
    try {
      const { data, error } = await supabase.rpc("create_community_team", {
        p_name: teamName.trim(),
        p_description: teamDescription.trim(),
      });
      if (error) throw error;
      const result = data as { invite_code?: string } | null;
      setNewInviteCode(result?.invite_code ?? "");
      setTeamName(""); setTeamDescription("");
      setTeamNotice("Your team is ready. Save the invitation code and share it with your teammates.");
      await loadMyTeam();
      await loadBoards();
    } catch (error) {
      setTeamError(error instanceof Error ? error.message : "The team could not be created.");
    } finally { setTeamBusy(false); }
  }

  async function joinTeam(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    setTeamBusy(true); setTeamError(""); setTeamNotice("");
    try {
      const { error } = await supabase.rpc("join_community_team", { p_invite_code: inviteInput.trim() });
      if (error) throw error;
      setInviteInput("");
      setTeamNotice("You joined the team. Welcome aboard.");
      await loadMyTeam();
      await loadBoards();
    } catch (error) {
      setTeamError(error instanceof Error ? error.message : "The invitation could not be accepted.");
    } finally { setTeamBusy(false); }
  }

  async function rotateInvite() {
    if (!supabase || !team) return;
    setTeamBusy(true); setTeamError(""); setTeamNotice("");
    try {
      const { data, error } = await supabase.rpc("rotate_community_team_invite", { p_team_id: team.team_id });
      if (error) throw error;
      setNewInviteCode(String(data ?? ""));
      setTeamNotice("A new invitation code was created. The previous code no longer works.");
    } catch (error) {
      setTeamError(error instanceof Error ? error.message : "The invitation could not be rotated.");
    } finally { setTeamBusy(false); }
  }

  async function toggleTeamVisibility() {
    if (!supabase || !team) return;
    setTeamBusy(true); setTeamError(""); setTeamNotice("");
    try {
      const next = !team.is_public;
      const { error } = await supabase.rpc("set_community_team_visibility", {
        p_team_id: team.team_id, p_is_public: next,
      });
      if (error) throw error;
      setTeam({ ...team, is_public: next });
      setTeamNotice(next ? "Your team now appears in public team rankings." : "Your team is hidden from public team rankings.");
      await loadBoards();
    } catch (error) {
      setTeamError(error instanceof Error ? error.message : "Team visibility could not be updated.");
    } finally { setTeamBusy(false); }
  }

  async function leaveOrDissolveTeam() {
    if (!supabase || !team) return;
    const owner = team.role === "owner";
    const confirmed = window.confirm(owner
      ? "Dissolve this team? All memberships will be removed and this cannot be undone."
      : "Leave this team? You will need a new invitation to rejoin.");
    if (!confirmed) return;
    setTeamBusy(true); setTeamError(""); setTeamNotice("");
    try {
      const { error } = await supabase.rpc(owner ? "dissolve_community_team" : "leave_community_team", {
        p_team_id: team.team_id,
      });
      if (error) throw error;
      setTeam(null); setNewInviteCode("");
      setTeamNotice(owner ? "The team has been dissolved." : "You left the team.");
      await loadBoards();
    } catch (error) {
      setTeamError(error instanceof Error ? error.message : "The team action could not be completed.");
    } finally { setTeamBusy(false); }
  }

  async function copyInviteCode() {
    if (!newInviteCode) return;
    try {
      await navigator.clipboard.writeText(newInviteCode);
      setTeamNotice("Invitation code copied.");
    } catch {
      setTeamNotice("Copy was blocked. Select and copy the invitation code manually.");
    }
  }

  return (
    <section className="section-page community-page">
      <div className="eyebrow">CONNECT / COMMUNITY</div>
      <h1>Learn together. Compete fairly.</h1>
      <p className="section-description">CyberBreach is built for curious beginners, students, defenders, researchers and experienced practitioners. Share what you learn without exposing real systems or other people's data.</p>

      <div className="community-principles">
        <article><BookOpen size={20}/><h2>Share understanding</h2><p>Explain the reasoning, not just the final flag. Help the next learner build the skill.</p></article>
        <article><ShieldCheck size={20}/><h2>Respect scope</h2><p>Only test systems you own or are explicitly authorized to assess. Keep people and private data out of investigations.</p></article>
        <article><Users size={20}/><h2>Make room for everyone</h2><p>Be constructive with newcomers. Challenge the idea, not the person.</p></article>
      </div>

      <div className="section-heading"><div><span className="eyebrow">TEAM WORKSPACE</span><h2>Find your people</h2></div><span className="section-note">ONE TEAM PER ACCOUNT</span></div>
      {!user ? (
        <div className="community-team-empty"><Users size={22}/><div><strong>Sign in to create or join a team.</strong><p>Accounts are free. You can still explore lessons and challenges without joining a team.</p><Link className="secondary-button" to="/account">SIGN IN OR CREATE ACCOUNT <ArrowUpRight size={14}/></Link></div></div>
      ) : teamLoading ? (
        <div className="community-team-empty"><p>Loading your team…</p></div>
      ) : team ? (
        <article className="community-team-card">
          <div className="community-team-heading">
            <div><span className="eyebrow">YOUR TEAM / {team.slug}</span><h3>{team.name}</h3><p>{team.description || "A CyberBreach learning team."}</p></div>
            <span className="team-role">{team.role === "owner" ? <><Crown size={13}/> TEAM OWNER</> : <><Users size={13}/> MEMBER</>}</span>
          </div>
          <div className="team-members-heading"><strong>TEAM MEMBERS</strong><span>{team.members.length} / 1+ MEMBERS</span></div>
          <div className="team-member-list">
            {team.members.map((member) => <div className="team-member-row" key={member.username}><span className="team-member-avatar">{member.display_name.slice(0,1).toUpperCase()}</span><div><strong>{member.display_name}</strong><small>@{member.username}</small></div>{member.role === "owner" && <span className="team-owner-label">OWNER</span>}</div>)}
          </div>
          {team.role === "owner" && (
            <div className="team-owner-controls">
              <div><strong>Public team ranking</strong><p>When enabled, your team name, member count and aggregate verified CTF points appear in the public team leaderboard. Member emails are never shown.</p></div>
              <button type="button" className={team.is_public ? "visibility-toggle active" : "visibility-toggle"} onClick={() => void toggleTeamVisibility()} disabled={teamBusy} aria-pressed={team.is_public}>{team.is_public ? "PUBLIC" : "PRIVATE"}</button>
            </div>
          )}
          {team.role === "owner" && <button className="secondary-button team-action" type="button" onClick={() => void rotateInvite()} disabled={teamBusy}>ROTATE INVITE CODE <ArrowUpRight size={14}/></button>}
          <button className="text-button team-leave" type="button" onClick={() => void leaveOrDissolveTeam()} disabled={teamBusy}><LogOut size={14}/>{team.role === "owner" ? "DISSOLVE TEAM" : "LEAVE TEAM"}</button>
        </article>
      ) : (
        <div className="community-team-forms">
          <form className="community-team-form" onSubmit={createTeam}>
            <span className="eyebrow">START A GROUP</span><h3>Create a team</h3>
            <label>Team name<input value={teamName} onChange={(event) => setTeamName(event.target.value)} minLength={3} maxLength={40} placeholder="e.g. Packet Pioneers" required/></label>
            <label>Short description <small>Optional · 280 characters maximum</small><textarea value={teamDescription} onChange={(event) => setTeamDescription(event.target.value)} maxLength={280} rows={3} placeholder="What is your team learning or practising?"/></label>
            <button className="primary-button" type="submit" disabled={teamBusy}>{teamBusy ? "CREATING…" : "CREATE TEAM"} <ArrowUpRight size={14}/></button>
          </form>
          <form className="community-team-form" onSubmit={joinTeam}>
            <span className="eyebrow">JOIN AN EXISTING GROUP</span><h3>Use an invitation code</h3>
            <p>Ask a team owner for their 48-character invitation code. Codes can be rotated by the owner at any time.</p>
            <label>Invitation code<input value={inviteInput} onChange={(event) => setInviteInput(event.target.value.trim())} minLength={48} maxLength={48} placeholder="Paste your team code" required autoComplete="off"/></label>
            <button className="secondary-button" type="submit" disabled={teamBusy || inviteInput.trim().length !== 48}>{teamBusy ? "JOINING…" : "JOIN TEAM"} <ArrowUpRight size={14}/></button>
          </form>
        </div>
      )}
      {newInviteCode && <div className="team-invite-code"><div><span className="eyebrow">SAVE THIS CODE · SHOWN ONLY ONCE</span><code>{newInviteCode}</code><p>Share it only with people you want in your team. Rotating it invalidates this code.</p></div><button className="secondary-button" type="button" onClick={() => void copyInviteCode()}><Copy size={14}/> COPY CODE</button></div>}
      {teamError && <p className="account-status error" role="alert">{teamError}</p>}
      {teamNotice && <p className="account-status success" role="status">{teamNotice}</p>}

      <div className="section-heading"><div><span className="eyebrow">TEAM COMPETITION</span><h2>Public team rankings</h2></div><span className="section-note">OPT-IN · CTF POINTS ONLY</span></div>
      <div className="leaderboard-panel">
        <div className="leaderboard-head"><div><Users size={20}/><strong>Top teams</strong></div><span>Verified challenge points</span></div>
        {loadingBoards ? <p className="leaderboard-empty">Loading team rankings…</p> : boardError ? <p className="leaderboard-empty">{boardError}</p> : teamRows.length === 0 ? <div className="leaderboard-empty"><strong>No public teams yet.</strong><p>Team owners can opt in to public rankings from their team workspace.</p></div> : (
          <div className="leaderboard-table team-leaderboard-table">
            <div className="leaderboard-row team-leaderboard-labels"><span>RANK</span><span>TEAM</span><span>MEMBERS</span><span>POINTS</span></div>
            {teamRows.map((row) => <div className="leaderboard-row" key={row.team_slug}><strong>#{row.position}</strong><div><b>{row.team_name}</b><small>/{row.team_slug}</small></div><span>{row.member_count}</span><strong>{formatPoints(row.points)}</strong></div>)}
          </div>
        )}
      </div>

      <div className="section-heading"><div><span className="eyebrow">INDIVIDUAL CTF COMMUNITY</span><h2>Public leaderboard</h2></div><span className="section-note">OPT-IN ONLY</span></div>
      <div className="leaderboard-panel">
        <div className="leaderboard-head"><div><Award size={20}/><strong>Top learners</strong></div><span>Verified challenge points</span></div>
        {loadingBoards ? <p className="leaderboard-empty">Loading public rankings…</p> : boardError ? <p className="leaderboard-empty">{boardError}</p> : rows.length === 0 ? <div className="leaderboard-empty"><strong>No public rankings yet.</strong><p>Learners appear here only after they choose public leaderboard visibility in Account settings.</p></div> : (
          <div className="leaderboard-table">
            <div className="leaderboard-row leaderboard-labels"><span>RANK</span><span>LEARNER</span><span>SOLVES</span><span>POINTS</span></div>
            {rows.map((row) => <div className="leaderboard-row" key={row.username}><strong>#{row.position}</strong><div><b>{row.display_name}</b><small>@{row.username}</small></div><span>{row.solves}</span><strong>{formatPoints(row.points)}</strong></div>)}
          </div>
        )}
      </div>
      <div className="community-actions"><Link className="secondary-button" to="/account">MANAGE PROFILE VISIBILITY <ArrowUpRight size={14}/></Link><Link className="secondary-button" to="/ctf">EXPLORE CHALLENGES <ArrowUpRight size={14}/></Link></div>
      <div className="learning-note"><div className="note-symbol"><ShieldCheck size={14}/></div><div><strong>Privacy by default</strong><p>Individual leaderboard participation and team rankings are opt-in. Public rankings show only display names or team names and aggregate CTF results. Email addresses and private profile data are never shown.</p></div></div>
      <p className="content-disclaimer">Team spaces currently support membership and rankings, not public chat or posts. Those features require moderation, reporting and event operations before activation.</p>
    </section>
  );
}
