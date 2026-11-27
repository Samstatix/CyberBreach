import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { ArrowLeft, ArrowRight, CalendarDays, Clock3, Plus, ShieldCheck, Trophy, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { challengeCatalog } from "../ctf/challengeCatalog";
import { useAuth } from "../auth/AuthProvider";
import { supabase } from "../../lib/supabase";
import { getCompetitionStatus, isValidCompetitionWindow, slugifyCompetitionTitle } from "./competitionLogic";

type CompetitionEvent = {
  event_id: string; slug: string; title: string; description: string; event_type: "individual" | "team";
  starts_at: string; ends_at: string; max_team_size: number; challenge_count: number;
  registered_count: number; is_registered: boolean;
};
type TeamSummary = { team_id: string; name: string; role: "owner" | "member" };
type EventRank = { position: number; participant_type: "individual" | "team"; participant_name: string; points: number; solves: number };

function dateLabel(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
function statusLabel(status: string) {
  return status === "live" ? "LIVE NOW" : status === "completed" ? "COMPLETED" : "UPCOMING";
}

export default function CommunityEventsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<CompetitionEvent[]>([]);
  const [team, setTeam] = useState<TeamSummary | null>(null);
  const [isModerator, setIsModerator] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busyEvent, setBusyEvent] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [selectedEventId, setSelectedEventId] = useState("");
  const [leaderboard, setLeaderboard] = useState<EventRank[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [eventType, setEventType] = useState<"individual" | "team">("individual");
  const [maxTeamSize, setMaxTeamSize] = useState(4);
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [selectedChallenges, setSelectedChallenges] = useState<string[]>([]);
  const [draftEventId, setDraftEventId] = useState("");

  const loadEvents = useCallback(async () => {
    if (!supabase) { setError("Connect Supabase to load competitions."); setLoading(false); return; }
    const { data, error: loadError } = await supabase.rpc("get_public_competition_events", { p_limit: 50 });
    if (loadError) setError(loadError.message);
    else { setEvents((data ?? []) as CompetitionEvent[]); setError(""); }
    setLoading(false);
  }, []);

  useEffect(() => {
    let active = true;
    async function loadAccountContext() {
      if (!user || !supabase) { setTeam(null); setIsModerator(false); return; }
      const [profileResult, teamResult] = await Promise.all([
        supabase.from("profiles").select("role").eq("id", user.id).maybeSingle(),
        supabase.rpc("get_my_community_team"),
      ]);
      if (!active) return;
      setIsModerator(["admin", "moderator"].includes(profileResult.data?.role ?? ""));
      setTeam((teamResult.data ?? null) as TeamSummary | null);
    }
    void loadAccountContext();
    return () => { active = false; };
  }, [user?.id]);

  useEffect(() => { void loadEvents(); }, [loadEvents]);

  const selectedChallengeCount = selectedChallenges.length;
  const sortedEvents = useMemo(() => [...events].sort((a, b) => a.starts_at.localeCompare(b.starts_at)), [events]);

  async function register(event: CompetitionEvent) {
    if (!supabase || !user) { setError("Sign in to register for a competition."); return; }
    if (event.event_type === "team" && (!team || team.role !== "owner")) {
      setError("A team owner must register the team. Create a team or ask your owner to register it.");
      return;
    }
    setBusyEvent(event.event_id); setError(""); setNotice("");
    const { error: registerError } = await supabase.rpc("register_for_competition_event", {
      p_event_id: event.event_id,
      p_team_id: event.event_type === "team" ? team?.team_id : null,
    });
    if (registerError) setError(registerError.message);
    else { setNotice(event.event_type === "team" ? "Your team is registered. The event roster is now fixed." : "You are registered for the competition."); await loadEvents(); }
    setBusyEvent("");
  }

  async function viewLeaderboard(event: CompetitionEvent) {
    if (!supabase) return;
    setSelectedEventId(event.event_id); setLeaderboardLoading(true); setError("");
    const { data, error: rankError } = await supabase.rpc("get_competition_event_leaderboard", {
      p_event_id: event.event_id, p_limit: 50,
    });
    if (rankError) setError(rankError.message);
    else setLeaderboard((data ?? []) as EventRank[]);
    setLeaderboardLoading(false);
  }

  async function createAndPublishEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    if (!isValidCompetitionWindow(startsAt, endsAt)) {
      setError("Choose a future event window that lasts no more than fourteen days.");
      return;
    }
    if (selectedChallengeCount === 0) {
      setError("Select at least one published challenge for this event.");
      return;
    }
    setBusyEvent("create"); setError(""); setNotice(""); setDraftEventId("");
    const { data, error: createError } = await supabase.rpc("create_competition_event", {
      p_title: title.trim(),
      p_slug: slug.trim(),
      p_description: description.trim(),
      p_event_type: eventType,
      p_starts_at: new Date(startsAt).toISOString(),
      p_ends_at: new Date(endsAt).toISOString(),
      p_max_team_size: eventType === "team" ? maxTeamSize : 1,
      p_challenge_slugs: selectedChallenges,
    });
    if (createError || !data) {
      setError(createError?.message ?? "The event draft could not be created.");
      setBusyEvent("");
      return;
    }
    const id = String(data);
    setDraftEventId(id);
    const { error: publishError } = await supabase.rpc("publish_competition_event", { p_event_id: id });
    if (publishError) {
      setError("The draft was created but could not be published: " + publishError.message);
    } else {
      setNotice("Competition published. Learners can now register.");
      setTitle(""); setSlug(""); setDescription(""); setSelectedChallenges([]);
      setStartsAt(""); setEndsAt("");
      await loadEvents();
      setDraftEventId("");
    }
    setBusyEvent("");
  }

  async function publishDraft() {
    if (!supabase || !draftEventId) return;
    setBusyEvent("publish"); setError("");
    const { error: publishError } = await supabase.rpc("publish_competition_event", { p_event_id: draftEventId });
    if (publishError) setError(publishError.message);
    else { setNotice("Competition published."); setDraftEventId(""); await loadEvents(); }
    setBusyEvent("");
  }

  return (
    <section className="section-page competition-page">
      <Link className="back-link" to="/community"><ArrowLeft size={14}/> BACK TO COMMUNITY</Link>
      <div className="eyebrow">COMMUNITY / EVENTS & TOURNAMENTS</div>
      <h1>Compete. Learn. Improve.</h1>
      <p className="section-description">Join scheduled individual or team CTF events. Every event uses selected CyberBreach challenges, a fixed registration window and scores calculated from verified solves.</p>
      <div className="competition-principles"><ShieldCheck size={17}/><span>Fair play: event points come from verified challenge solves during the event window. Team rosters are snapshotted at registration. No manual score submissions.</span></div>

      {isModerator && (
        <article className="competition-admin-card">
          <div className="section-heading"><div><span className="eyebrow">MODERATOR CONSOLE</span><h2><Plus size={17}/> Schedule a competition</h2></div><span className="section-note">ADMIN / MODERATOR</span></div>
          <form className="competition-form" onSubmit={(event) => void createAndPublishEvent(event)}>
            <label>Event title<input value={title} onChange={(event) => { setTitle(event.target.value); if (!slug || slug === slugifyCompetitionTitle(title)) setSlug(slugifyCompetitionTitle(event.target.value)); }} minLength={4} maxLength={80} required placeholder="CollabCircle Weekly CTF"/></label>
            <label>URL slug<input value={slug} onChange={(event) => setSlug(slugifyCompetitionTitle(event.target.value))} required placeholder="collabcircle-weekly-ctf"/></label>
            <label>Description<textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} maxLength={1200} placeholder="What should participants expect?"/></label>
            <div className="competition-form-grid">
              <label>Competition format<select value={eventType} onChange={(event) => setEventType(event.target.value as "individual" | "team")}><option value="individual">Individual</option><option value="team">Team</option></select></label>
              {eventType === "team" && <label>Maximum team size<select value={maxTeamSize} onChange={(event) => setMaxTeamSize(Number(event.target.value))}><option value={2}>2 members</option><option value={3}>3 members</option><option value={4}>4 members</option><option value={5}>5 members</option><option value={6}>6 members</option><option value={7}>7 members</option><option value={8}>8 members</option></select></label>}
              <label>Starts at<input type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} required/></label>
              <label>Ends at<input type="datetime-local" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} required/></label>
            </div>
            <div className="competition-challenge-picker"><div><strong>Choose event challenges</strong><span>{selectedChallengeCount} selected · published CTF challenges only</span></div>
              <div className="competition-challenge-list">{challengeCatalog.map((challenge) => <label key={challenge.slug}><input type="checkbox" checked={selectedChallenges.includes(challenge.slug)} onChange={(event) => setSelectedChallenges((current) => event.target.checked ? [...current, challenge.slug] : current.filter((slugValue) => slugValue !== challenge.slug))}/><span><strong>{challenge.title}</strong><small>{challenge.category} · {challenge.difficulty} · {challenge.points} pts</small></span></label>)}</div>
            </div>
            <button className="primary-button" type="submit" disabled={busyEvent === "create"}>{busyEvent === "create" ? "PUBLISHING…" : "CREATE & PUBLISH EVENT"} <ArrowRight size={14}/></button>
          </form>
          {draftEventId && <div className="competition-draft-warning"><span>Draft saved: {draftEventId}</span><button className="secondary-button" type="button" onClick={() => void publishDraft()} disabled={busyEvent === "publish"}>RETRY PUBLISH</button></div>}
        </article>
      )}

      <div className="section-heading"><div><span className="eyebrow">SCHEDULED EVENTS</span><h2>Upcoming and recent competitions</h2></div><span className="section-note">INDIVIDUAL / TEAM</span></div>
      {loading ? <div className="competition-empty">Loading competition schedule…</div> : error && events.length === 0 ? <div className="competition-empty">{error}</div> : sortedEvents.length === 0 ? <div className="competition-empty"><CalendarDays size={23}/><strong>No competitions scheduled yet.</strong><p>When CollabCircle moderators publish an event, it will appear here.</p></div> : (
        <div className="competition-event-list">
          {sortedEvents.map((event) => {
            const status = getCompetitionStatus(event.starts_at, event.ends_at);
            const canRegister = status === "upcoming" && !event.is_registered;
            const teamNeedsOwner = event.event_type === "team" && (!team || team.role !== "owner");
            return <article className="competition-event-card" key={event.event_id}>
              <div className="competition-event-heading"><div><span className={`competition-status ${status}`}>{statusLabel(status)}</span><span className="eyebrow">{event.event_type === "team" ? "TEAM TOURNAMENT" : "INDIVIDUAL CTF"}</span><h3>{event.title}</h3></div><div className="competition-event-count"><Trophy size={16}/><strong>{event.challenge_count}</strong><small>CHALLENGES</small></div></div>
              <p>{event.description}</p>
              <div className="competition-event-meta"><span><CalendarDays size={14}/>{dateLabel(event.starts_at)} – {dateLabel(event.ends_at)}</span><span><Users size={14}/>{event.registered_count} registered</span>{event.event_type === "team" && <span>Max {event.max_team_size} / team</span>}</div>
              <div className="competition-event-actions">
                {event.is_registered ? <span className="competition-registered"><ShieldCheck size={14}/> REGISTERED</span> : canRegister && user ? <button className="primary-button" type="button" onClick={() => void register(event)} disabled={busyEvent === event.event_id || teamNeedsOwner}>{busyEvent === event.event_id ? "REGISTERING…" : event.event_type === "team" ? "REGISTER MY TEAM" : "REGISTER"} <ArrowRight size={14}/></button> : !user && canRegister ? <Link className="secondary-button" to="/account">SIGN IN TO REGISTER</Link> : event.event_type === "team" && teamNeedsOwner && canRegister ? <Link className="secondary-button" to="/community">CREATE OR JOIN A TEAM</Link> : <span className="competition-registered">{statusLabel(status)}</span>}
                <button className="secondary-button" type="button" onClick={() => void viewLeaderboard(event)}>VIEW LEADERBOARD <Trophy size={14}/></button>
              </div>
              {selectedEventId === event.event_id && <div className="competition-leaderboard"><strong>EVENT LEADERBOARD</strong>{leaderboardLoading ? <p>Loading scores…</p> : leaderboard.length === 0 ? <p>No verified event solves yet.</p> : leaderboard.map((row) => <div key={row.position}><b>#{row.position} · {row.participant_name}</b><span>{row.solves} solves · {row.points} points</span></div>)}</div>}
            </article>;
          })}
        </div>
      )}
      {error && events.length > 0 && <p className="account-status error" role="alert">{error}</p>}
      {notice && <p className="account-status success" role="status">{notice}</p>}
      <div className="competition-footer"><Clock3 size={15}/><span>Registration closes when the event starts. Event rankings include only the selected challenges solved during the scheduled time window.</span></div>
    </section>
  );
}
