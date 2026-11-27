import { ArrowUpRight, Binary, Bug, Eye, Fingerprint, KeyRound, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { challengeCatalog, getChallengeCounts } from "./challengeCatalog";

const categories = [
  { slug: "web-exploitation", number: "01", title: "Web Exploitation", detail: "Find and understand weaknesses in web applications.", examples: "SQL injection · XSS · IDOR · SSRF", icon: Bug },
  { slug: "cryptography", number: "02", title: "Cryptography", detail: "Investigate how information is protected, transformed and sometimes exposed.", examples: "Ciphers · RSA · Hashing · Key exchange", icon: KeyRound },
  { slug: "reverse-engineering", number: "03", title: "Reverse Engineering", detail: "Work backwards from a program to understand what it does.", examples: "Disassembly · Debugging · File formats", icon: Binary },
  { slug: "binary-exploitation", number: "04", title: "Binary Exploitation (Pwn)", detail: "Study memory safety and exploit intentionally vulnerable programs.", examples: "Stack bugs · Heap · ROP · Format strings", icon: Fingerprint },
  { slug: "forensics", number: "05", title: "Forensics & Network Forensics", detail: "Reconstruct what happened from files, memory and network evidence.", examples: "Disk · Memory · PCAP · Logs", icon: Eye },
  { slug: "osint-misc", number: "06", title: "OSINT & Misc", detail: "Solve investigation tasks and unusual technical puzzles.", examples: "Public information · Steganography · Scripting", icon: Search },
];

export default function CTFArenaPage() {
  const counts = getChallengeCounts();
  return <section className="section-page"><div className="eyebrow">COMPETE / CTF ARENA</div><h1>Choose your attack surface.</h1><p className="section-description">Six focused disciplines. Start by understanding the techniques, then test yourself on original challenges designed to demand real reasoning.</p><div className="difficulty-strip"><span>MEDIUM</span><span>HARD</span><span>EXPERT</span><small>{counts.total} original challenges · {counts.medium} medium · {counts.hard} hard · {counts.expert} expert</small></div><div className="category-grid">{categories.map(({slug,number,title,detail,examples,icon:Icon})=>{const count=challengeCatalog.filter((challenge)=>challenge.category===slug).length;return <article className="category-card" key={slug}><div className="category-top"><span>{number}</span><Icon size={22}/></div><h2>{title}</h2><p>{detail}</p><small>{examples}</small><div className="category-challenge-count">{count} CHALLENGES</div><Link to={`/ctf/${slug}`}>VIEW CATEGORY <ArrowUpRight size={14}/></Link></article>;})}</div><div className="learning-note"><div className="note-symbol">i</div><div><strong>How challenge difficulty works</strong><p>Medium challenges combine taught skills. Hard challenges require chaining techniques and adapting. Expert challenges demand independent investigation and validation. Difficulty is based on reasoning, not obscure flags.</p></div></div></section>;
}
