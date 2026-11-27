import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { ArrowLeft, CheckCircle2, KeyRound, LogIn, LogOut, ShieldCheck, Trash2, UserRound, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { supabase } from "../../lib/supabase";
import { isValidBio, isValidDisplayName, isValidUsername, normalizeUsername } from "./accountValidation";

type AccountMode = "sign-in" | "sign-up" | "forgot-password";
type StatusMessage = { kind: "success" | "error" | "info"; text: string };

export default function AccountPage() {
  const {
    user, loading, configured, passwordRecovery, signIn, signUp, signOut,
    requestPasswordReset, updatePassword, deleteAccount,
  } = useAuth();
  const [mode, setMode] = useState<AccountMode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [busy, setBusy] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [status, setStatus] = useState<StatusMessage | null>(null);
  const [leaderboardOptIn, setLeaderboardOptIn] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileBusy, setProfileBusy] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadProfile() {
      if (!user || !supabase) return;
      setProfileLoading(true);
      const { data, error } = await supabase.from("profiles")
        .select("username,display_name,bio,show_on_leaderboard")
        .eq("id", user.id).maybeSingle();
      if (active && data) {
        setUsername(data.username ?? "");
        setDisplayName(data.display_name ?? "");
        setBio(data.bio ?? "");
        setLeaderboardOptIn(Boolean(data.show_on_leaderboard));
      }
      if (active && error) setStatus({ kind: "error", text: error.message });
      if (active) setProfileLoading(false);
    }
    void loadProfile();
    return () => { active = false; };
  }, [user?.id]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setStatus(null); setBusy(true);
    try {
      if (mode === "sign-in") {
        const error = await signIn(email.trim(), password);
        if (error) setStatus({ kind: "error", text: error });
      } else {
        const result = await signUp(email.trim(), password, username.trim());
        if (result.error) setStatus({ kind: "error", text: result.error });
        else if (result.confirmationRequired) setStatus({ kind: "success", text: "Account created. Check your email to confirm the address before signing in." });
        else setStatus({ kind: "success", text: "Your account is ready. Welcome to CyberBreach." });
      }
    } finally { setBusy(false); }
  }

  async function handlePasswordResetRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setStatus(null);
    const error = await requestPasswordReset(email.trim());
    setBusy(false);
    setStatus(error
      ? { kind: "error", text: error }
      : { kind: "success", text: "If an account exists for that email, a password-reset link has been sent." });
  }

  async function handlePasswordUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setStatus(null);
    const error = await updatePassword(newPassword);
    setBusy(false);
    if (error) setStatus({ kind: "error", text: error });
    else { setNewPassword(""); setStatus({ kind: "success", text: "Your password has been updated. Your account is secure again." }); }
  }

  async function handleSignOut() {
    setBusy(true); const error = await signOut(); setBusy(false);
    setStatus(error ? { kind: "error", text: error } : { kind: "success", text: "You have signed out." });
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || !supabase) return;
    if (!isValidUsername(username)) {
      setStatus({ kind: "error", text: "Username must be 3–24 lowercase letters, numbers or underscores." });
      return;
    }
    if (!isValidDisplayName(displayName)) {
      setStatus({ kind: "error", text: "Display name must be between 2 and 40 characters." });
      return;
    }
    if (!isValidBio(bio)) {
      setStatus({ kind: "error", text: "Bio must be 160 characters or fewer." });
      return;
    }
    setProfileBusy(true); setStatus(null);
    const { error } = await supabase.from("profiles").update({
      username: username.trim(),
      display_name: displayName.trim(),
      bio: bio.trim(),
    }).eq("id", user.id);
    if (error) setStatus({ kind: "error", text: error.message });
    else setStatus({ kind: "success", text: "Your profile has been updated." });
    setProfileBusy(false);
  }

  async function toggleLeaderboard() {
    if (!user || !supabase) return;
    setProfileBusy(true); setStatus(null); const next = !leaderboardOptIn;
    const { error } = await supabase.from("profiles").update({ show_on_leaderboard: next }).eq("id", user.id);
    if (error) setStatus({ kind: "error", text: error.message });
    else {
      setLeaderboardOptIn(next);
      setStatus({ kind: "success", text: next ? "Your public leaderboard visibility is enabled." : "Your public leaderboard visibility is disabled." });
    }
    setProfileBusy(false);
  }

  async function handleDeleteAccount() {
    const confirmed = window.confirm("Permanently delete your CyberBreach account? Your profile, team membership, CTF solves and learning progress will be deleted. This cannot be undone.");
    if (!confirmed) return;
    setDeleteBusy(true); setStatus(null);
    const error = await deleteAccount();
    setDeleteBusy(false);
    setStatus(error
      ? { kind: "error", text: "Account deletion failed: " + error }
      : { kind: "success", text: "Your account and associated progress have been deleted." });
  }

  return (
    <section className="section-page account-page">
      <Link className="back-link" to="/"><ArrowLeft size={14}/> BACK TO OVERVIEW</Link>
      <div className="eyebrow">COLLABCIRCLE / YOUR ACCOUNT</div>
      <h1>Your learning identity.</h1>
      <p className="section-description">Manage your account, profile visibility and learning identity. CyberBreach is free, and public learning content remains available without signing in.</p>

      {passwordRecovery ? (
        <div className="account-card">
          <div className="account-card-icon"><KeyRound size={23}/></div>
          <span className="eyebrow">ACCOUNT RECOVERY</span><h2>Choose a new password.</h2>
          <p className="account-email">Use a unique password that you do not use on other websites.</p>
          <form className="account-form" onSubmit={handlePasswordUpdate}>
            <label>New password<input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} minLength={10} maxLength={128} required autoComplete="new-password" placeholder="At least 10 characters"/></label>
            <button className="primary-button account-submit" type="submit" disabled={!configured || busy}>{busy ? "UPDATING…" : "UPDATE PASSWORD"}</button>
          </form>
          {status && <p className={"account-status " + status.kind} role="status">{status.text}</p>}
        </div>
      ) : loading ? (
        <div className="account-card"><p>Checking your session…</p></div>
      ) : user ? (
        <div className="account-card">
          <div className="account-card-icon"><UserRound size={23}/></div>
          <span className="eyebrow">SIGNED IN</span><h2>Welcome back.</h2><p className="account-email">{user.email}</p>
          <div className="account-security-note"><ShieldCheck size={16}/><span>Your identity is managed by Supabase Auth. Challenge scores are recorded by trusted database functions, not by this browser.</span></div>

          <form className="account-form account-profile-form" onSubmit={saveProfile}>
            <span className="eyebrow">PUBLIC PROFILE</span>
            <label>Username<input value={username} onChange={(event) => setUsername(normalizeUsername(event.target.value))} minLength={3} maxLength={24} pattern="[a-z0-9_]{3,24}" required autoComplete="username"/></label>
            <label>Display name<input value={displayName} onChange={(event) => setDisplayName(event.target.value)} minLength={2} maxLength={40} required/></label>
            <label>Short bio <small>Optional · 160 characters maximum</small><textarea value={bio} onChange={(event) => setBio(event.target.value)} maxLength={160} rows={3} placeholder="What are you learning or researching?"/></label>
            <button className="secondary-button" type="submit" disabled={profileLoading || profileBusy}>{profileBusy ? "SAVING…" : "SAVE PROFILE"}</button>
          </form>

          <div className="account-privacy-setting">
            <div><strong><Users size={15}/> Public leaderboard</strong><p>Show your username, display name, solve count and aggregate CTF points to other learners. Email and private profile data are never shown.</p></div>
            <button type="button" className={leaderboardOptIn ? "visibility-toggle active" : "visibility-toggle"} onClick={toggleLeaderboard} disabled={profileLoading || profileBusy} aria-pressed={leaderboardOptIn}>{profileBusy ? "SAVING…" : leaderboardOptIn ? "VISIBLE" : "HIDDEN"}</button>
          </div>

          {status && <p className={"account-status " + status.kind} role="status">{status.text}</p>}
          <button className="primary-button account-submit" onClick={handleSignOut} type="button" disabled={busy}><LogOut size={15}/>{busy ? "SIGNING OUT…" : "SIGN OUT"}</button>

          <div className="account-danger-zone">
            <div><strong>Delete account and data</strong><p>This permanently removes your account, team membership, CTF records and synchronized learning progress. This action cannot be undone.</p></div>
            <button className="danger-button" type="button" onClick={() => void handleDeleteAccount()} disabled={deleteBusy}><Trash2 size={14}/>{deleteBusy ? "DELETING…" : "DELETE ACCOUNT"}</button>
          </div>
        </div>
      ) : (
        <div className="account-card">
          <div className="account-card-icon"><LogIn size={23}/></div>
          {mode !== "forgot-password" && <div className="account-tabs">
            <button type="button" className={mode === "sign-in" ? "active" : ""} onClick={() => { setMode("sign-in"); setStatus(null); }}>SIGN IN</button>
            <button type="button" className={mode === "sign-up" ? "active" : ""} onClick={() => { setMode("sign-up"); setStatus(null); }}>CREATE ACCOUNT</button>
          </div>}
          {!configured && <div className="account-config-notice"><strong>Account services need configuration</strong><p>Copy <code>.env.example</code> to <code>.env</code>, add your Supabase project URL and publishable/anon key, then apply the database migrations.</p></div>}

          {mode === "forgot-password" ? (
            <>
              <span className="eyebrow">ACCOUNT RECOVERY</span><h2>Reset your password.</h2>
              <p className="account-email">Enter your account email. If it exists, Supabase will send a secure recovery link.</p>
              <form className="account-form" onSubmit={handlePasswordResetRequest}>
                <label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" placeholder="you@example.com"/></label>
                <button className="primary-button account-submit" type="submit" disabled={!configured || busy}>{busy ? "SENDING…" : "SEND RESET LINK"}</button>
              </form>
              <button className="text-button" type="button" onClick={() => { setMode("sign-in"); setStatus(null); }}>BACK TO SIGN IN</button>
            </>
          ) : (
            <form className="account-form" onSubmit={handleSubmit}>
              {mode === "sign-up" && <label>Username<input value={username} onChange={(event) => setUsername(normalizeUsername(event.target.value))} minLength={3} maxLength={24} pattern="[a-z0-9_]{3,24}" placeholder="your_handle" required autoComplete="username"/><small>3–24 characters. Lowercase letters, numbers and underscores.</small></label>}
              <label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required autoComplete="email"/></label>
              <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={10} maxLength={128} placeholder="At least 10 characters" required autoComplete={mode === "sign-in" ? "current-password" : "new-password"}/>{mode === "sign-up" && <small>Use a unique password. Never reuse your email password.</small>}</label>
              <button className="primary-button account-submit" type="submit" disabled={!configured || busy}>{busy ? "PLEASE WAIT…" : mode === "sign-in" ? "SIGN IN" : "CREATE FREE ACCOUNT"}</button>
              {mode === "sign-in" && <button className="text-button" type="button" onClick={() => { setMode("forgot-password"); setStatus(null); }}>FORGOT PASSWORD?</button>}
            </form>
          )}
          {status && <p className={"account-status " + status.kind} role="status">{status.text}</p>}
          <p className="account-free-note"><CheckCircle2 size={14}/> CyberBreach accounts are free. No paid learning tiers or competitive advantages.</p>
        </div>
      )}
      <p className="account-public-note">Just exploring? <Link to="/academy">Continue to Cyber Academy without signing in.</Link></p>
    </section>
  );
}
