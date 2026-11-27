import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "../../lib/supabase";

type SignUpResult = { error: string | null; confirmationRequired: boolean };
type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  configured: boolean;
  passwordRecovery: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string, username: string) => Promise<SignUpResult>;
  signOut: () => Promise<string | null>;
  requestPasswordReset: (email: string) => Promise<string | null>;
  updatePassword: (password: string) => Promise<string | null>;
  deleteAccount: () => Promise<string | null>;
  clearPasswordRecovery: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [passwordRecovery, setPasswordRecovery] = useState(false);

  useEffect(() => {
    // Public learning remains available even when Supabase is not configured.
    if (!supabase) { setLoading(false); return; }
    let active = true;

    void supabase.auth.getSession()
      .then(({ data }) => {
        if (!active) return;
        setSession(data.session);
        setLoading(false);
      })
      .catch(() => { if (active) setLoading(false); });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      if (event === "PASSWORD_RECOVERY") setPasswordRecovery(true);
      if (event === "SIGNED_OUT") setPasswordRecovery(false);
      setLoading(false);
    });

    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  async function signIn(email: string, password: string): Promise<string | null> {
    if (!supabase) return "Account services are not configured yet. Add the Supabase settings to your local environment.";
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error?.message ?? null;
  }

  async function signUp(email: string, password: string, username: string): Promise<SignUpResult> {
    if (!supabase) return {
      error: "Account services are not configured yet. Add the Supabase settings to your local environment.",
      confirmationRequired: false,
    };
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username, display_name: username } },
    });
    return { error: error?.message ?? null, confirmationRequired: !error && !data.session };
  }

  async function signOut(): Promise<string | null> {
    if (!supabase) return null;
    const { error } = await supabase.auth.signOut();
    return error?.message ?? null;
  }

  async function requestPasswordReset(email: string): Promise<string | null> {
    if (!supabase) return "Account services are not configured yet.";
    const redirectTo = window.location.origin + window.location.pathname;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    return error?.message ?? null;
  }

  async function updatePassword(password: string): Promise<string | null> {
    if (!supabase) return "Account services are not configured yet.";
    const { error } = await supabase.auth.updateUser({ password });
    if (!error) setPasswordRecovery(false);
    return error?.message ?? null;
  }

  async function deleteAccount(): Promise<string | null> {
    if (!supabase || !session?.user) return "Sign in before deleting your account.";
    const userId = session.user.id;
    const { error } = await supabase.functions.invoke("delete-account", { method: "POST" });
    if (error) return error.message;

    // The Edge Function deletes auth.users; all account-owned rows cascade.
    // Remove the local account cache as well, then clear this browser session.
    try { window.localStorage.removeItem("cyberbreach.academy.completed.v1." + userId); } catch { /* Storage may be unavailable. */ }
    await supabase.auth.signOut({ scope: "local" });
    setSession(null);
    setPasswordRecovery(false);
    return null;
  }

  const value: AuthContextValue = {
    user: session?.user ?? null,
    session,
    loading,
    configured: isSupabaseConfigured,
    passwordRecovery,
    signIn,
    signUp,
    signOut,
    requestPasswordReset,
    updatePassword,
    deleteAccount,
    clearPasswordRecovery: () => setPasswordRecovery(false),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
