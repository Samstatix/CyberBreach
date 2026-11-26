import { useState } from "react";
import type { FormEvent } from "react";
import { ArrowLeft, CheckCircle2, LogIn, LogOut, ShieldCheck, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "./AuthProvider";

type AccountMode = "sign-in" | "sign-up";
type StatusMessage = { kind: "success" | "error" | "info"; text: string };

export default function AccountPage() {
  const { user, loading, configured, signIn, signUp, signOut } = useAuth();
  const [mode, setMode] = useState<AccountMode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<StatusMessage | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);
    setBusy(true);

    try {
      if (mode === "sign-in") {
        const error = await signIn(email.trim(), password);
        if (error) setStatus({ kind: "error", text: error });
      } else {
        const result = await signUp(email.trim(), password, username.trim());
        if (result.error) {
          setStatus({ kind: "error", text: result.error });
        } else if (result.confirmationRequired) {
          setStatus({ kind: "success", text: "Account created. Check your email to confirm the address before signing in." });
        } else {
          setStatus({ kind: "success", text: "Your account is ready. Welcome to CyberBreach." });
        }
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleSignOut() {
    setBusy(true);
    const error = await signOut();
    setBusy(false);
    setStatus(error ? { kind: "error", text: error } : { kind: "success", text: "You have signed out." });
  }

  return (
    <section className="section-page account-page">
      <Link className="back-link" to="/"><ArrowLeft size={14}/> BACK TO OVERVIEW</Link>
      <div className="eyebrow">COLLABCIRCLE / YOUR ACCOUNT</div>
      <h1>Your learning identity.</h1>
      <p className="section-description">An account will let CyberBreach connect your profile, lesson progress and future CTF results across devices. Public learning content remains free and does not require an account.</p>

      {loading ? (
        <div className="account-card"><p>Checking your session…</p></div>
      ) : user ? (
        <div className="account-card">
          <div className="account-card-icon"><UserRound size={23}/></div>
          <span className="eyebrow">SIGNED IN</span>
          <h2>Welcome back.</h2>
          <p className="account-email">{user.email}</p>
          <div className="account-security-note"><ShieldCheck size={16}/><span>Your identity is managed by Supabase Auth. Challenge scores will be recorded by trusted database functions, not by this browser.</span></div>
          <button className="primary-button account-submit" type="button" onClick={handleSignOut} disabled={busy}><LogOut size={15}/>{busy ? "SIGNING OUT…" : "SIGN OUT"}</button>
          {status && <p className={"account-status " + status.kind} role="status">{status.text}</p>}
        </div>
      ) : (
        <div className="account-card">
          <div className="account-card-icon"><LogIn size={23}/></div>
          <div className="account-tabs">
            <button type="button" className={mode === "sign-in" ? "active" : ""} onClick={() => { setMode("sign-in"); setStatus(null); }}>SIGN IN</button>
            <button type="button" className={mode === "sign-up" ? "active" : ""} onClick={() => { setMode("sign-up"); setStatus(null); }}>CREATE ACCOUNT</button>
          </div>

          {!configured && (
            <div className="account-config-notice">
              <strong>Account services need configuration</strong>
              <p>Copy <code>.env.example</code> to <code>.env</code>, then add your Supabase project URL and publishable/anon key. The database migration must also be applied before profiles and scoring can work.</p>
            </div>
          )}

          <form className="account-form" onSubmit={handleSubmit}>
            {mode === "sign-up" && (
              <label>Username
                <input value={username} onChange={(event) => setUsername(event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))} minLength={3} maxLength={24} pattern="[a-z0-9_]{3,24}" placeholder="your_handle" required autoComplete="username"/>
                <small>3–24 characters. Lowercase letters, numbers and underscores.</small>
              </label>
            )}
            <label>Email address
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required autoComplete="email"/>
            </label>
            <label>Password
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={10} placeholder="At least 10 characters" required autoComplete={mode === "sign-in" ? "current-password" : "new-password"}/>
              {mode === "sign-up" && <small>Use a unique password. Never reuse your email password.</small>}
            </label>
            <button className="primary-button account-submit" type="submit" disabled={!configured || busy}>
              {busy ? "PLEASE WAIT…" : mode === "sign-in" ? "SIGN IN" : "CREATE FREE ACCOUNT"}
            </button>
          </form>

          {status && <p className={"account-status " + status.kind} role="status">{status.text}</p>}
          <p className="account-free-note"><CheckCircle2 size={14}/> CyberBreach accounts are free. No paid learning tiers or competitive advantages.</p>
        </div>
      )}

      <p className="account-public-note">Just exploring? <Link to="/academy">Continue to Cyber Academy without signing in.</Link></p>
    </section>
  );
}
