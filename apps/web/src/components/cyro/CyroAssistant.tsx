import { useEffect, useRef, useState } from "react";
import { Bot, MessageCircle, Minimize2, Send, ShieldCheck, X } from "lucide-react";
import { useLocation } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { getCyroLessonContext } from "../../features/academy/academyContent";

type ChatMessage = { role: "user" | "assistant"; content: string };
type TeachingMode = "explain" | "hint" | "quiz" | "next-step";
type TeachingLevel = "beginner" | "intermediate" | "advanced";
type PreferredLanguage = "auto" | "en" | "bn";
const teachingActions: Array<{ mode: TeachingMode; label: string; prompt: string }> = [
  { mode: "explain", label: "Explain simply", prompt: "Explain the topic on this page in simple beginner-friendly language with one everyday analogy." },
  { mode: "hint", label: "Give me a hint", prompt: "Give one progressive hint for the exercise. Do not reveal the answer, flag, or full solution. Ask me to try the next step." },
  { mode: "quiz", label: "Quiz me", prompt: "Ask one short question about this topic and wait for my answer before explaining." },
  { mode: "next-step", label: "What next?", prompt: "Recommend one achievable next learning step and explain why." },
];

const starters = [
  "I'm completely new to cybersecurity. Where should I start?",
  "Explain this page in very simple words.",
  "Give me a small example and a quick quiz.",
];

export default function CyroAssistant() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [logoFailed, setLogoFailed] = useState(false);
  const [activeMode, setActiveMode] = useState<TeachingMode>("explain");
  const [hintLevel, setHintLevel] = useState(0);
  const [teachingLevel, setTeachingLevel] = useState<TeachingLevel>("beginner");
  const [preferredLanguage, setPreferredLanguage] = useState<PreferredLanguage>("auto");
  const [preferencesReady, setPreferencesReady] = useState(false);
  const [preferencesSaving, setPreferencesSaving] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Hey! I'm CYRO, your CyberBreach learning companion. No question is too basic. Tell me what you're learning, and I'll break it into small, clear steps." },
  ]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, busy, open]);

  useEffect(() => {
    let active = true;
    async function loadPreferences() {
      if (!supabase) { setPreferencesReady(true); return; }
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) { setPreferencesReady(true); return; }
      const { data } = await supabase.from("cyro_learning_preferences").select("teaching_level, preferred_language").eq("user_id", auth.user.id).maybeSingle();
      if (active && data) {
        if (["beginner", "intermediate", "advanced"].includes(data.teaching_level)) setTeachingLevel(data.teaching_level as TeachingLevel);
        if (["auto", "en", "bn"].includes(data.preferred_language)) setPreferredLanguage(data.preferred_language as PreferredLanguage);
      }
      if (active) setPreferencesReady(true);
    }
    void loadPreferences();
    return () => { active = false; };
  }, []);

  async function savePreferences(level: TeachingLevel, language: PreferredLanguage) {
    setTeachingLevel(level);
    setPreferredLanguage(language);
    if (!supabase) return;
    setPreferencesSaving(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Sign in to save your learning preferences.");
      const { error: saveError } = await supabase.from("cyro_learning_preferences").upsert({ user_id: auth.user.id, teaching_level: level, preferred_language: language, updated_at: new Date().toISOString() });
      if (saveError) throw saveError;
      setError("");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Your preferences could not be saved.");
    } finally { setPreferencesSaving(false); }
  }

  async function sendMessage(text = input, mode: TeachingMode = activeMode, requestedHintLevel = hintLevel) {
    const prompt = text.trim();
    if (!prompt || busy) return;
    if (!supabase) { setError("CYRO needs a connected CyberBreach account service. Please try again later."); return; }
    const next: ChatMessage[] = [...messages, { role: "user", content: prompt }].slice(-13);
    setMessages(next);
    setInput("");
    setError("");
    setBusy(true);
    try {
      const lessonMatch = location.pathname.match(/^\\/academy\\/lessons\\/([a-z0-9-]+)$/);
      const lessonContext = lessonMatch ? getCyroLessonContext(lessonMatch[1]) : undefined;
      const { data, error: invokeError } = await supabase.functions.invoke("cyro-assistant", {
        body: { messages: next.slice(-12), page: location.pathname, mode, hintLevel: requestedHintLevel, lessonContext },
      });
      if (invokeError) throw invokeError;
      if (typeof data?.reply !== "string" || !data.reply.trim()) throw new Error("CYRO did not return an answer. Please try again.");
      setMessages((current): ChatMessage[] => [...current, { role: "assistant", content: data.reply as string }].slice(-14));
    } catch (err) {
      setError(err instanceof Error ? err.message : "CYRO is temporarily unavailable.");
    } finally { setBusy(false); }
  }

  return (
    <div className="cyro-widget">
      {open && <section className="cyro-panel" aria-label="CYRO learning assistant">
        <header className="cyro-header">
          <div className="cyro-avatar">{!logoFailed ? <img src="/cyro-logo.png" alt="CYRO" onError={() => setLogoFailed(true)} /> : <Bot size={20}/>}</div>
          <div><strong>CYRO</strong><small>CYBERBREACH LEARNING COMPANION</small></div>
          <button type="button" className="cyro-icon-button" onClick={() => setOpen(false)} aria-label="Minimize CYRO"><Minimize2 size={17}/></button>
          <button type="button" className="cyro-icon-button" onClick={() => setOpen(false)} aria-label="Close CYRO"><X size={17}/></button>
        </header>
        <div className="cyro-trust"><ShieldCheck size={13}/> Beginner-friendly guidance · Safe learning only</div>
        <div className="cyro-preferences"><label>Teaching level<select aria-label="CYRO teaching level" value={teachingLevel} disabled={!preferencesReady || preferencesSaving} onChange={(event) => void savePreferences(event.target.value as TeachingLevel, preferredLanguage)}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></label><label>Language<select aria-label="CYRO preferred language" value={preferredLanguage} disabled={!preferencesReady || preferencesSaving} onChange={(event) => void savePreferences(teachingLevel, event.target.value as PreferredLanguage)}><option value="auto">Auto detect</option><option value="en">English</option><option value="bn">বাংলা</option></select></label></div>
        {activeMode === "hint" && <div className="cyro-hint-progress" aria-live="polite">HINT PROGRESSION · {hintLevel || 1} / 3 · Each hint reveals a little more</div>}
        <div className="cyro-actions" role="group" aria-label="CYRO teaching tools">{teachingActions.map((action) => <button type="button" key={action.mode} aria-pressed={activeMode === action.mode} className={activeMode === action.mode ? "active" : ""} onClick={() => { const nextHint = action.mode === "hint" ? Math.min(hintLevel + 1, 3) : 0; setHintLevel(nextHint); setActiveMode(action.mode); const prompt = action.mode === "hint" ? `Give me hint level ${nextHint} of 3 for the exercise on this page. Do not reveal the answer.` : action.prompt; void sendMessage(prompt, action.mode, nextHint); }}>{action.label}</button>)}</div>
        <div className="cyro-messages" aria-live="polite">
          {messages.map((message, index) => <div className={`cyro-message ${message.role}`} key={index}>
            <span>{message.role === "assistant" ? "CYRO" : "YOU"}</span><p>{message.content}</p>
          </div>)}
          {busy && <div className="cyro-message assistant"><span>CYRO</span><p className="cyro-thinking">Thinking through it…</p></div>}
          <div ref={endRef}/>
        </div>
        {messages.length === 1 && <div className="cyro-starters">{starters.map((starter) => <button type="button" key={starter} onClick={() => void sendMessage(starter)}>{starter}</button>)}</div>}
        {error && <p className="cyro-error" role="alert">{error}</p>}
        <form className="cyro-compose" onSubmit={(event) => { event.preventDefault(); void sendMessage(); }}>
          <label className="sr-only" htmlFor="cyro-prompt">Ask CYRO a question</label>
          <textarea id="cyro-prompt" rows={2} maxLength={1500} placeholder="Ask anything, even the basics…" value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void sendMessage(); } }} />
          <button type="submit" disabled={busy || !input.trim()} aria-label="Send message"><Send size={17}/></button>
        </form>
        <footer className="cyro-footer">CYRO can make mistakes. Never run commands or test systems unless you understand the risks and have permission.</footer>
      </section>}
      <button type="button" className="cyro-launcher" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label={open ? "Close CYRO assistant" : "Open CYRO assistant"}>
        {open ? <X size={21}/> : <MessageCircle size={21}/>}<span>{open ? "CLOSE CYRO" : "ASK CYRO"}</span>
      </button>
    </div>
  );
}
