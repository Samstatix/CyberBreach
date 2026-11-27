import { useEffect, useRef, useState } from "react";
import { Bot, MessageCircle, Minimize2, Send, ShieldCheck, X } from "lucide-react";
import { useLocation } from "react-router-dom";
import { supabase } from "../../lib/supabase";

type ChatMessage = { role: "user" | "assistant"; content: string };

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
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Hey! I'm CYRO, your CyberBreach learning companion. No question is too basic. Tell me what you're learning, and I'll break it into small, clear steps." },
  ]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, busy, open]);

  async function sendMessage(text = input) {
    const prompt = text.trim();
    if (!prompt || busy) return;
    if (!supabase) { setError("CYRO needs a connected CyberBreach account service. Please try again later."); return; }
    const next = [...messages, { role: "user" as const, content: prompt }].slice(-13);
    setMessages(next);
    setInput("");
    setError("");
    setBusy(true);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke("cyro-assistant", {
        body: { messages: next.slice(-12), page: location.pathname },
      });
      if (invokeError) throw invokeError;
      if (typeof data?.reply !== "string" || !data.reply.trim()) throw new Error("CYRO did not return an answer. Please try again.");
      setMessages((current) => [...current, { role: "assistant", content: data.reply }].slice(-14));
    } catch (err) {
      setError(err instanceof Error ? err.message : "CYRO is temporarily unavailable.");
    } finally { setBusy(false); }
  }

  return (
    <div className="cyro-widget">
      {open && <section className="cyro-panel" aria-label="CYRO learning assistant">
        <header className="cyro-header">
          <div className="cyro-avatar"><Bot size={20}/></div>
          <div><strong>CYRO</strong><small>CYBERBREACH LEARNING COMPANION</small></div>
          <button type="button" className="cyro-icon-button" onClick={() => setOpen(false)} aria-label="Minimize CYRO"><Minimize2 size={17}/></button>
          <button type="button" className="cyro-icon-button" onClick={() => setOpen(false)} aria-label="Close CYRO"><X size={17}/></button>
        </header>
        <div className="cyro-trust"><ShieldCheck size={13}/> Beginner-friendly guidance · Safe learning only</div>
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
