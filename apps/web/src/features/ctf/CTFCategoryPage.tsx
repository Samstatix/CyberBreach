import { ArrowLeft, BookOpen, Lightbulb, Target } from "lucide-react";
import { Link, useParams } from "react-router-dom";

const data: Record<string, { title: string; plain: string; examples: string[]; learn: string[]; safe: string }> = {
  "web-exploitation": { title: "Web Exploitation", plain: "Websites are programs. They receive requests, check who you are and decide what information you can see or change. Web exploitation studies what can go wrong when those checks or assumptions are weak.", examples: ["SQL injection", "Cross-site scripting (XSS)", "Broken access control and IDOR", "Server-side request forgery (SSRF)"], learn: ["How browsers and servers communicate", "HTTP requests, responses, cookies and sessions", "Input handling and output encoding", "Authentication versus authorization"], safe: "All practical exercises use intentionally vulnerable applications owned by the platform or explicitly authorized training targets." },
  cryptography: { title: "Cryptography", plain: "Cryptography is the mathematics and engineering used to protect information. It helps keep messages private, prove that data has not changed and verify who created or signed something.", examples: ["Classical ciphers", "Symmetric encryption such as AES", "Public-key cryptography and RSA", "Hash functions and digital signatures"], learn: ["Encoding is not encryption", "Hashing is not reversible encryption", "How keys are used", "Common implementation mistakes"], safe: "Challenges use generated sample data and keys. Never submit personal passwords or real confidential data." },
  "reverse-engineering": { title: "Reverse Engineering", plain: "A program normally runs from instructions written by its creator. Reverse engineering means examining the finished program to understand what it does, even when the original source code is unavailable.", examples: ["File and binary formats", "Disassembly and decompilation", "Debugging program behavior", "Obfuscation and program logic"], learn: ["How programs are built", "What a binary contains", "CPU instructions at a basic level", "How to observe behavior safely"], safe: "Use platform-provided sample binaries in a disposable environment. Do not run unknown files on your personal machine." },
  "binary-exploitation": { title: "Binary Exploitation (Pwn)", plain: "Programs use memory to store information while they run. A memory-safety bug can make a program behave in an unintended way. Pwn challenges teach how these mistakes happen and how developers prevent them.", examples: ["Buffer overflows", "Stack and heap concepts", "Format-string vulnerabilities", "Return-oriented programming (ROP)"], learn: ["Bits, bytes, addresses and memory", "How functions use the stack", "What a crash tells us", "Compiler and operating-system protections"], safe: "Exploit exercises are limited to purpose-built vulnerable binaries in isolated labs. No real systems are targets." },
  forensics: { title: "Forensics & Network Forensics", plain: "Digital forensics is the careful examination of digital evidence. Network forensics focuses on evidence from communications between devices, such as captured packets and logs.", examples: ["File metadata and file signatures", "Disk and memory evidence", "Packet captures (PCAP)", "Timeline and log analysis"], learn: ["Preserving evidence", "What metadata can reveal", "How network packets are structured", "Building a timeline from multiple clues"], safe: "Training evidence is synthetic or explicitly licensed. Exercises explain how to preserve originals and work from copies." },
  "osint-misc": { title: "OSINT & Misc", plain: "OSINT means Open-Source Intelligence: collecting and checking information that is publicly available. Misc challenges cover useful puzzles and technical skills that do not fit neatly into another category.", examples: ["Public-source research", "Image and document clues", "Steganography", "Scripting and logic puzzles"], learn: ["Source reliability and verification", "Search techniques", "Metadata and context", "Ethical and privacy boundaries"], safe: "OSINT tasks use fictional subjects, platform-owned material or explicitly authorized public exercises. Do not investigate private individuals." },
};

export default function CTFCategoryPage() {
  const { category = "" } = useParams();
  const item = data[category];
  if (!item) return <section className="section-page"><Link className="back-link" to="/ctf"><ArrowLeft size={14}/> BACK TO CTF ARENA</Link><h1>Category not found</h1></section>;
  return (
    <section className="section-page">
      <Link className="back-link" to="/ctf"><ArrowLeft size={14}/> BACK TO CTF ARENA</Link>
      <div className="eyebrow">CTF ARENA / CATEGORY GUIDE</div>
      <h1>{item.title}</h1>
      <p className="section-description">{item.plain}</p>
      <div className="category-learning-grid">
        <article className="category-learning-card"><BookOpen size={20}/><h2>Start with the basics</h2><p>These are the ideas we teach before expecting you to solve a scored challenge.</p><ul>{item.learn.map(x=><li key={x}>{x}</li>)}</ul></article>
        <article className="category-learning-card"><Target size={20}/><h2>What you will encounter</h2><p>Examples of techniques and challenge themes in this category.</p><ul>{item.examples.map(x=><li key={x}>{x}</li>)}</ul></article>
      </div>
      <div className="learning-note"><div className="note-symbol"><Lightbulb size={14}/></div><div><strong>Practice safely</strong><p>{item.safe}</p></div></div>
      <div className="coming-panel"><Target size={22}/><div><strong>Challenge library is being developed</strong><p>We will publish original medium, hard and expert challenges after each has a tested solve path, progressive hints, a complete explanation and a reviewed safety boundary. This category guide is an educational outline, not a live challenge listing.</p></div></div>
    </section>
  );
}
