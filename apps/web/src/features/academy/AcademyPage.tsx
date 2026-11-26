import { ArrowRight, BookOpen, CheckCircle2, Network, Shield, Terminal, Globe, KeyRound, FileSearch, BrainCircuit } from "lucide-react";
import { Link } from "react-router-dom";

const paths = [
  { icon: Shield, level: "START HERE", title: "Cybersecurity Fundamentals", detail: "What cybersecurity protects, who attacks, how defenses work and the basic security ideas behind everything else.", lessons: "6 lessons", topics: ["CIA triad", "Threats and risks", "Authentication", "Security controls"] },
  { icon: Network, level: "FOUNDATION", title: "Networking Essentials", detail: "Understand how devices find each other and exchange information before you inspect network traffic.", lessons: "8 lessons", topics: ["IP addresses", "DNS", "TCP and UDP", "HTTP and ports"] },
  { icon: Terminal, level: "FOUNDATION", title: "Linux and Command Line", detail: "Learn to move around a Linux system, inspect files, understand permissions and use commands confidently.", lessons: "8 lessons", topics: ["Files and folders", "Permissions", "Processes", "Shell basics"] },
  { icon: Globe, level: "CORE SKILL", title: "Web Security", detail: "Understand browsers, servers, requests and common mistakes that make web applications vulnerable.", lessons: "9 lessons", topics: ["HTTP requests", "Sessions", "Access control", "OWASP concepts"] },
  { icon: KeyRound, level: "CORE SKILL", title: "Cryptography Basics", detail: "Learn the difference between encoding, hashing and encryption, and why keys matter.", lessons: "7 lessons", topics: ["Encoding vs encryption", "Hashing", "Symmetric keys", "Public-key basics"] },
  { icon: FileSearch, level: "CORE SKILL", title: "Digital Forensics", detail: "Learn how investigators preserve, inspect and interpret digital evidence without changing the original.", lessons: "7 lessons", topics: ["Metadata", "File signatures", "Logs", "PCAP introduction"] },
  { icon: BrainCircuit, level: "SPECIALIST", title: "AI and Machine Learning Security", detail: "Explore how AI systems can be attacked, misused or defended, with careful explanations of the underlying models.", lessons: "6 lessons", topics: ["Prompt injection", "Data poisoning", "Adversarial examples", "Model privacy"] },
];

export default function AcademyPage() {
  return (
    <section className="section-page">
      <div className="eyebrow">LEARN / CYBER ACADEMY</div>
      <h1>Build understanding, not just vocabulary.</h1>
      <p className="section-description">No prior experience is assumed in the starting paths. Each topic begins with a plain-language explanation, introduces the real technical terms, then moves into demonstrations and independent practice.</p>
      <div className="academy-promise">
        <BookOpen size={21} />
        <div><strong>How every lesson is taught</strong><p>Why it matters → simple explanation → technical detail → worked example → guided practice → independent exercise → recap.</p></div>
      </div>
      <div className="section-heading"><div><span className="eyebrow">LEARNING PATHS</span><h2>Choose what you want to understand</h2></div><span className="section-note">7 PATHS</span></div>
      <div className="academy-grid">
        {paths.map(({ icon: Icon, level, title, detail, lessons, topics }) => (
          <article className="academy-card" key={title}>
            <div className="academy-card-head"><span className="area-icon"><Icon size={20} /></span><span className="area-tag">{level}</span></div>
            <h3>{title}</h3><p>{detail}</p>
            <div className="topic-list">{topics.map(topic => <span key={topic}>{topic}</span>)}</div>
            <div className="academy-card-foot"><small>{lessons} · Content outline</small><span><CheckCircle2 size={14}/> Structured path</span></div>
            <Link to="/operations">EXPLORE PRACTICE FORMAT <ArrowRight size={14}/></Link>
          </article>
        ))}
      </div>
      <p className="content-disclaimer">These are the initial curriculum outlines, not a claim that all lessons are already written or published. Detailed lessons and tested exercises will be developed and reviewed before release.</p>
    </section>
  );
}
