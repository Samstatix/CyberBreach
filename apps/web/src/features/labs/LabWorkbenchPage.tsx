import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Binary, Bug, Code2, Fingerprint, Globe2, KeyRound, ShieldCheck, TerminalSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import {
  assessBuffer, decodeBase64, decodeCaesarCipher, forensicEvents,
  simulateInvoiceRequest, summarizeFailedLogins,
} from "./labWorkbenchLogic";
import { checkLabAnswer, getLabHint, guidedLabExercises, type LabExerciseId } from "./guidedLabExercises";

type LabModule = "web" | "crypto" | "reverse" | "memory" | "forensics" | "osint";
const modules: Array<{ id: LabModule; label: string; icon: typeof Bug; description: string }> = [
  { id: "web", label: "Web security", icon: Bug, description: "Object-level authorization" },
  { id: "crypto", label: "Cryptography", icon: KeyRound, description: "Encoding and classical ciphers" },
  { id: "reverse", label: "Reverse engineering", icon: Binary, description: "Static file inspection" },
  { id: "memory", label: "Binary / Pwn", icon: TerminalSquare, description: "Memory boundaries" },
  { id: "forensics", label: "Forensics", icon: Fingerprint, description: "Log investigation" },
  { id: "osint", label: "OSINT", icon: Globe2, description: "Source verification" },
];

function WebSecurityLab() {
  const [mode, setMode] = useState<"vulnerable" | "secure">("vulnerable");
  const [invoiceId, setInvoiceId] = useState("INV-204");
  const [response, setResponse] = useState<ReturnType<typeof simulateInvoiceRequest> | null>(null);
  const result = response?.invoice;
  return (
    <div className="workbench-module">
      <div className="workbench-module-heading"><span className="eyebrow">WEB EXPLOITATION / OBJECT AUTHORIZATION</span><h2>Can Maya read Ravi's invoice?</h2><p>A broken API checks whether a user is signed in, but forgets to check whether that user owns the requested record. This is a safe, fictional example of IDOR/BOLA.</p></div>
      <div className="workbench-grid">
        <div className="workbench-control-card">
          <label>Signed-in account<input value="maya" readOnly/></label>
          <label>Requested invoice<select value={invoiceId} onChange={(event) => { setInvoiceId(event.target.value); setResponse(null); }}><option value="INV-101">INV-101 · Maya's invoice</option><option value="INV-204">INV-204 · Ravi's invoice</option><option value="INV-999">INV-999 · Missing invoice</option></select></label>
          <div className="workbench-label">API authorization mode</div>
          <div className="workbench-choice-row"><button type="button" className={mode === "vulnerable" ? "selected" : ""} onClick={() => { setMode("vulnerable"); setResponse(null); }}>BROKEN CHECK</button><button type="button" className={mode === "secure" ? "selected" : ""} onClick={() => { setMode("secure"); setResponse(null); }}>SECURE CHECK</button></div>
          <button className="primary-button" type="button" onClick={() => setResponse(simulateInvoiceRequest(invoiceId, "maya", mode))}>SEND SIMULATED REQUEST <ArrowRight size={14}/></button>
        </div>
        <div className="workbench-result-card">
          <span className="eyebrow">SIMULATED HTTP RESPONSE</span>
          {!response ? <div className="workbench-empty"><Code2 size={24}/><p>Choose an invoice and send the request to inspect the API response.</p></div> : (
            <div className={`workbench-http-result ${response.status === 200 && result?.owner !== "maya" ? "warning" : response.status === 403 ? "success" : ""}`}>
              <strong>HTTP {response.status} {response.status === 200 ? "OK" : response.status === 403 ? "FORBIDDEN" : "NOT FOUND"}</strong><p>{response.message}</p>
              {result && <dl><div><dt>Invoice</dt><dd>{result.id}</dd></div><div><dt>Owner</dt><dd>{result.owner}</dd></div><div><dt>Amount</dt><dd>${result.amount}</dd></div><div><dt>Description</dt><dd>{result.description}</dd></div></dl>}
            </div>
          )}
        </div>
      </div>
      <div className="workbench-learning"><strong>What should you notice?</strong><p>In broken mode, Maya can read Ravi's invoice by changing the object ID. In secure mode, the server checks ownership and returns 403. The important fix belongs on the server; hiding an invoice button in the browser is not authorization.</p></div>
    </div>
  );
}

function CryptographyLab() {
  const [cipherText, setCipherText] = useState("KHOOR ZRUOG");
  const [shift, setShift] = useState(3);
  const [base64Text, setBase64Text] = useState("Q1lCRVJCUkVBQ0g=");
  const decoded = useMemo(() => decodeCaesarCipher(cipherText, shift), [cipherText, shift]);
  let base64Result = "";
  try { base64Result = decodeBase64(base64Text); } catch { base64Result = ""; }
  return (
    <div className="workbench-module">
      <div className="workbench-module-heading"><span className="eyebrow">CRYPTOGRAPHY / ENCODING VS ENCRYPTION</span><h2>Decode the message</h2><p>Encoding changes how data is represented. Encryption uses a key to protect confidentiality. These small tools demonstrate the difference.</p></div>
      <div className="workbench-grid">
        <div className="workbench-control-card">
          <span className="eyebrow">TOOL 01 / CAESAR SHIFT</span><label>Ciphertext<input value={cipherText} onChange={(event) => setCipherText(event.target.value)} spellCheck={false}/></label>
          <label>Shift amount <strong>{shift}</strong><input type="range" min="0" max="25" value={shift} onChange={(event) => setShift(Number(event.target.value))}/></label>
          <div className="workbench-output"><small>DECODED TEXT</small><strong>{decoded || "—"}</strong></div>
          <p className="workbench-hint">A Caesar cipher moves each letter by a fixed number of places. It is useful for learning, not for protecting real data.</p>
        </div>
        <div className="workbench-control-card">
          <span className="eyebrow">TOOL 02 / BASE64</span><label>Encoded text<input value={base64Text} onChange={(event) => setBase64Text(event.target.value)} spellCheck={false}/></label>
          <div className="workbench-output"><small>DECODED TEXT</small><strong>{base64Result || "No valid output"}</strong></div>
          {base64Text && !base64Result && <p className="workbench-error">This is not valid Base64 text.</p>}
          <p className="workbench-hint">Base64 is not encryption. Anyone with the encoded text can decode it without a secret key.</p>
        </div>
      </div>
    </div>
  );
}

const reverseSamples = {
  "license-checker": {
    name: "license-checker.elf", type: "ELF 64-bit LSB executable", architecture: "x86-64", entry: "0x401080",
    hex: "7f 45 4c 46 02 01 01 00 00 00 00 00 00 00 00 00",
    strings: ["Welcome to the training program", "check_license", "license_valid", "Access granted", "Access denied"],
  },
  "network-tool": {
    name: "network-tool.elf", type: "ELF 64-bit LSB PIE executable", architecture: "x86-64", entry: "0x000010a0",
    hex: "7f 45 4c 46 02 01 01 00 03 00 3e 00 01 00 00 00",
    strings: ["Usage: nettool <host>", "connect_to_host", "resolve_hostname", "timeout_seconds", "Connection failed"],
  },
};

function ReverseEngineeringLab() {
  const [sampleId, setSampleId] = useState<keyof typeof reverseSamples>("license-checker");
  const sample = reverseSamples[sampleId];
  return (
    <div className="workbench-module">
      <div className="workbench-module-heading"><span className="eyebrow">REVERSE ENGINEERING / STATIC INSPECTION</span><h2>Read the clues before running anything</h2><p>Inspect a fictional executable's metadata, hexadecimal header and readable strings. No file is executed or uploaded.</p></div>
      <div className="workbench-control-card">
        <label>Training artifact<select value={sampleId} onChange={(event) => setSampleId(event.target.value as keyof typeof reverseSamples)}><option value="license-checker">license-checker.elf</option><option value="network-tool">network-tool.elf</option></select></label>
        <div className="workbench-metadata-grid"><div><small>FILE TYPE</small><strong>{sample.type}</strong></div><div><small>ARCHITECTURE</small><strong>{sample.architecture}</strong></div><div><small>ENTRY POINT</small><strong>{sample.entry}</strong></div></div>
        <div className="workbench-code-block"><small>HEX HEADER</small><code>{sample.hex}</code></div>
        <div className="workbench-string-list"><small>RECOVERED STRINGS</small>{sample.strings.map((value) => <code key={value}>{value}</code>)}</div>
      </div>
      <div className="workbench-learning"><strong>Investigation question</strong><p>{sampleId === "license-checker" ? "Which recovered string most strongly suggests a license-validation routine? Look for a name that describes a check, then confirm it with other evidence." : "Which recovered string suggests that the program performs a DNS lookup? A function name is a clue, not proof of runtime behaviour."}</p></div>
    </div>
  );
}

function BinaryMemoryLab() {
  const [inputLength, setInputLength] = useState(10);
  const [boundsCheck, setBoundsCheck] = useState(false);
  const assessment = assessBuffer(inputLength, 8, boundsCheck);
  return (
    <div className="workbench-module">
      <div className="workbench-module-heading"><span className="eyebrow">BINARY EXPLOITATION / MEMORY SAFETY</span><h2>See where a buffer ends</h2><p>A buffer has a fixed size. If a program copies more bytes than it reserved, nearby memory may be overwritten. This visualizer uses no real memory or executable.</p></div>
      <div className="workbench-grid">
        <div className="workbench-control-card">
          <label>Input length <strong>{inputLength} bytes</strong><input type="range" min="0" max="16" value={inputLength} onChange={(event) => setInputLength(Number(event.target.value))}/></label>
          <div className="workbench-label">Bounds checking</div>
          <div className="workbench-choice-row"><button type="button" className={!boundsCheck ? "selected" : ""} onClick={() => setBoundsCheck(false)}>DISABLED</button><button type="button" className={boundsCheck ? "selected" : ""} onClick={() => setBoundsCheck(true)}>ENABLED</button></div>
          <div className={`workbench-http-result ${assessment.status === "overflow" ? "warning" : assessment.status === "rejected" ? "success" : ""}`}>
            <strong>{assessment.status === "overflow" ? "BOUNDARY CROSSED" : assessment.status === "rejected" ? "INPUT REJECTED SAFELY" : "INPUT FITS"}</strong>
            <p>{assessment.status === "overflow" ? `${assessment.overwrittenBytes} byte(s) would reach memory outside the buffer.` : assessment.status === "rejected" ? "The program checks the length and rejects the oversized input before copying it." : "The input fits inside the reserved buffer."}</p>
          </div>
        </div>
        <div className="workbench-control-card">
          <span className="eyebrow">SIMULATED MEMORY MAP</span>
          <div className="memory-map-labels"><span>BUFFER · 8 BYTES</span><span>ADJACENT DATA</span></div>
          <div className="memory-map">
            {Array.from({ length: 12 }, (_, index) => {
              const inBuffer = index < 8;
              const filled = !boundsCheck && index < inputLength;
              return <div key={index} className={`memory-cell ${inBuffer ? "buffer-cell" : "adjacent-cell"} ${filled ? (inBuffer ? "filled" : "overwritten") : ""}`}>{filled ? "XX" : "··"}</div>;
            })}
          </div>
          <p className="workbench-hint">The first eight cells are the buffer. The remaining cells represent nearby data only for teaching; no actual overwrite occurs.</p>
        </div>
      </div>
    </div>
  );
}

function ForensicsLab() {
  const summaries = summarizeFailedLogins(forensicEvents);
  const [selectedIp, setSelectedIp] = useState("all");
  const filtered = selectedIp === "all" ? forensicEvents : forensicEvents.filter((event) => event.sourceIp === selectedIp);
  return (
    <div className="workbench-module">
      <div className="workbench-module-heading"><span className="eyebrow">FORENSICS / LOG INVESTIGATION</span><h2>Build a timeline from authentication logs</h2><p>Filter synthetic host events and identify repeated failed login attempts. The IP addresses are reserved documentation examples.</p></div>
      <div className="workbench-grid">
        <div className="workbench-control-card">
          <label>Filter source IP<select value={selectedIp} onChange={(event) => setSelectedIp(event.target.value)}><option value="all">All sources</option>{summaries.map((item) => <option value={item.sourceIp} key={item.sourceIp}>{item.sourceIp}</option>)}</select></label>
          <div className="workbench-evidence-list"><small>FAILED LOGIN COUNTS</small>{summaries.map((item) => <div key={item.sourceIp}><code>{item.sourceIp}</code><strong>{item.count}</strong></div>)}</div>
          <div className="workbench-learning compact"><strong>Leading failed-login source</strong><p>{summaries[0]?.sourceIp} · {summaries[0]?.count} failed attempts in this sample.</p></div>
        </div>
        <div className="workbench-control-card">
          <span className="eyebrow">EVENT TIMELINE / {filtered.length} RECORDS</span>
          <div className="forensic-timeline">{filtered.map((event) => <div className="forensic-event" key={event.time + event.sourceIp}><time>{event.time}</time><div><strong>{event.event}</strong><small>{event.sourceIp}</small></div><span className={`event-outcome ${event.outcome}`}>{event.outcome.toUpperCase()}</span></div>)}</div>
        </div>
      </div>
    </div>
  );
}

function OsintLab() {
  const [showAnalysis, setShowAnalysis] = useState(false);
  return (
    <div className="workbench-module">
      <div className="workbench-module-heading"><span className="eyebrow">OSINT / SOURCE VERIFICATION</span><h2>Is this really independent evidence?</h2><p>Use this fictional event report to compare an official notice, a repost and an independent municipal record. The goal is to verify a claim without investigating a real person.</p></div>
      <div className="osint-source-grid">
        <article><span className="source-kind primary">PRIMARY SOURCE</span><h3>Harbor Skills Day — Official Notice</h3><p>Published 12 November 2026. The event is scheduled for Pier Nine on 18 November.</p><small>Original organizer announcement</small></article>
        <article><span className="source-kind repost">REPOST</span><h3>Community Calendar Mirror</h3><p>Published 20 November 2026. Repeats the organizer's notice and original event date.</p><small>Copied from the official notice</small></article>
        <article><span className="source-kind independent">INDEPENDENT RECORD</span><h3>Municipal Venue Register</h3><p>Updated 13 November 2026. Lists Pier Nine as reserved for Harbor Skills Day on 18 November.</p><small>Separate municipal record</small></article>
      </div>
      <button className="secondary-button" type="button" onClick={() => setShowAnalysis((value) => !value)}>{showAnalysis ? "HIDE SOURCE ANALYSIS" : "COMPARE THE SOURCES"} <ArrowRight size={14}/></button>
      {showAnalysis && <div className="workbench-learning"><strong>What is independently corroborated?</strong><p>The official organizer notice and municipal venue register support the same venue and date through separate sources. The calendar mirror is a repost, so it is not independent confirmation. Its 20 November publication date is not the event date.</p><p>Record the original URL, access time and confidence level. Do not treat a repeated claim as a second independent source.</p></div>}
    </div>
  );
}

function GuidedExercisePanel({ exerciseId }: { exerciseId: LabExerciseId }) {
  const exercise = guidedLabExercises.find((item) => item.id === exerciseId)!;
  const [answer, setAnswer] = useState("");
  const [hintLevel, setHintLevel] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [solved, setSolved] = useState(false);
  const [savedProgress, setSavedProgress] = useState(false);
  const correct = submitted && checkLabAnswer(exercise, answer);
  return (
    <section className="guided-exercise" aria-labelledby="guided-exercise-title">
      <div className="guided-exercise-heading"><span className="eyebrow">GUIDED PRACTICE / NOT SCORED</span><span>{solved ? "COMPLETED" : "LEARNING EXERCISE"}</span></div>
      <h2 id="guided-exercise-title">{exercise.title}</h2>
      <p>{exercise.objective}</p>
      <label className="guided-exercise-question" htmlFor="guided-exercise-answer">{exercise.question}</label>
      <div className="guided-exercise-answer-row">
        <input id="guided-exercise-answer" value={answer} onChange={(event) => { setAnswer(event.target.value); setSubmitted(false); }} placeholder="Type your answer..." disabled={solved}/>
        <button type="button" onClick={async () => { setSubmitted(true); if (checkLabAnswer(exercise, answer)) { setSolved(true); if (supabase) { const { data: auth } = await supabase.auth.getUser(); if (auth.user) { const { error } = await supabase.rpc("record_cyro_learning_activity", { p_activity_type: "guided_lab_completed", p_activity_id: exercise.id }); setSavedProgress(!error); } } } }} disabled={!answer.trim() || solved}>CHECK</button>
      </div>
      {submitted && <div className={correct ? "guided-exercise-feedback correct" : "guided-exercise-feedback"} role="status">{correct ? "Correct — well done." : "Not quite. Review a hint and try again."}</div>}
      {!solved && <div className="guided-exercise-hints"><button type="button" onClick={() => setHintLevel((level) => Math.min(2, level + 1))} disabled={hintLevel === 3}> {hintLevel === 0 ? "GET A HINT" : "NEXT HINT"} </button>{hintLevel > 0 && <p>{getLabHint(exercise, hintLevel - 1)}</p>}</div>}
      {solved && <div className="guided-exercise-feedback correct" role="status"><strong>Why this matters</strong><p>{exercise.explanation}</p>{savedProgress && <small>Progress saved to your account.</small>}{!savedProgress && <small>Practice complete in this session. Sign in and apply the learning-activity migration to sync progress.</small>}<button type="button" onClick={() => { setAnswer(""); setHintLevel(0); setSubmitted(false); setSolved(false); setSavedProgress(false); }}>TRY AGAIN</button></div>}
    </section>
  );
}

export default function LabWorkbenchPage() {
  const [active, setActive] = useState<LabModule>("web");
  return (
    <section className="section-page workbench-page">
      <Link className="back-link" to="/labs"><ArrowLeft size={14}/> BACK TO CYBER LABS</Link>
      <div className="eyebrow">CYBER LABS / MULTI-DISCIPLINE WORKBENCH</div>
      <h1>Learn by testing ideas.</h1>
      <p className="section-description">Six safe, interactive practice rooms. Change an input, observe the result and understand the security concept before you take on a harder CTF challenge.</p>
      <div className="workbench-safety-note"><ShieldCheck size={17}/><span>All evidence and systems here are fictional simulations. No real targets, files, accounts or host commands are used. These practice rooms do not award competitive CTF points.</span></div>
      <div className="workbench-tabs" aria-label="Choose a practice room">
        {modules.map((module) => {
          const Icon = module.icon;
          return <button type="button" key={module.id} className={active === module.id ? "active" : ""} onClick={() => setActive(module.id)} aria-pressed={active === module.id}><Icon size={16}/><span><strong>{module.label}</strong><small>{module.description}</small></span></button>;
        })}
      </div>
      <div className="workbench-stage">
        {active === "web" && <WebSecurityLab/>}
        {active === "crypto" && <CryptographyLab/>}
        {active === "reverse" && <ReverseEngineeringLab/>}
        {active === "memory" && <BinaryMemoryLab/>}
        {active === "forensics" && <ForensicsLab/>}
        {active === "osint" && <OsintLab/>}
      </div>
      <GuidedExercisePanel key={active} exerciseId={active}/>
      <div className="workbench-next-step"><div><span className="eyebrow">READY FOR A CHALLENGE?</span><strong>Practice the concept, then solve an original CTF task.</strong></div><Link className="secondary-button" to="/ctf">OPEN CTF ARENA <ArrowRight size={14}/></Link></div>
    </section>
  );
}
