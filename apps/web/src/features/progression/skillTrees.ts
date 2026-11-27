import { challengeCatalog } from "../ctf/challengeCatalog";

export type SkillNode = {
  id: string;
  title: string;
  kind: "lesson" | "challenge" | "mission" | "lab";
  reference: string;
};

export type SkillTree = {
  id: string;
  title: string;
  description: string;
  accent: string;
  nodes: SkillNode[];
};

function lessons(items: Array<[string, string]>): SkillNode[] {
  return items.map(([reference, title]) => ({
    id: "lesson:" + reference,
    title,
    kind: "lesson",
    reference,
  }));
}

function missions(items: Array<[string, string]>): SkillNode[] {
  return items.map(([reference, title]) => ({
    id: "mission:" + reference,
    title,
    kind: "mission",
    reference,
  }));
}

function labTasks(items: Array<[string, string]>): SkillNode[] {
  return items.map(([reference, title]) => ({
    id: "lab:" + reference,
    title,
    kind: "lab",
    reference,
  }));
}

function challenges(category: string): SkillNode[] {
  return challengeCatalog
    .filter((challenge) => challenge.category === category)
    .map((challenge) => ({
      id: "challenge:" + challenge.slug,
      title: challenge.title,
      kind: "challenge" as const,
      reference: challenge.slug,
    }));
}

export const skillTrees: SkillTree[] = [
  {
    id: "core-security",
    title: "Security Foundations",
    description: "Build the mental models used across every security discipline.",
    accent: "FOUNDATION",
    nodes: lessons([
      ["security-goals", "What are we protecting?"],
      ["threats-vulnerabilities-risk", "Threats, vulnerabilities and risk"],
      ["defense-in-depth", "Defense in depth and least privilege"],
    ]),
  },
  {
    id: "web-security",
    title: "Web Security",
    description: "Understand web requests, sessions and access-control failures.",
    accent: "APPLICATION",
    nodes: [
      ...lessons([
        ["web-request-response", "How a website talks"],
        ["web-cookies-sessions", "Cookies and sessions"],
        ["web-object-authorization", "Who is allowed to see this?"],
      ]),
      ...challenges("web-exploitation"),
    ],
  },
  {
    id: "networking",
    title: "Networking",
    description: "Learn how devices address one another and exchange information.",
    accent: "INFRASTRUCTURE",
    nodes: lessons([
      ["ip-ports-protocols", "IP addresses, ports and protocols"],
      ["dns-and-http", "DNS and HTTP: opening a website"],
    ]),
  },
  {
    id: "linux-systems",
    title: "Linux and Systems",
    description: "Build confidence with filesystems, users and permissions.",
    accent: "SYSTEMS",
    nodes: [
      ...lessons([
        ["linux-filesystem", "Files, folders and navigation"],
        ["linux-permissions", "Users and file permissions"],
      ]),
      ...labTasks([
        ["linux-auth-source", "SSH authentication log investigation"],
        ["linux-listening-ports", "Identify listening network services"],
        ["linux-default-gateway", "Find the default network gateway"],
        ["linux-current-user", "Identify the current Linux user"],
      ]),
    ],
  },
  {
    id: "cryptography",
    title: "Cryptography",
    description: "Distinguish encoding, hashing and public-key cryptography.",
    accent: "MATHEMATICS",
    nodes: [
      ...lessons([
        ["crypto-encoding-encryption", "Encoding is not encryption"],
        ["crypto-hash-integrity", "Hashes and integrity"],
        ["crypto-public-key", "Public and private keys"],
      ]),
      ...challenges("cryptography"),
    ],
  },
  {
    id: "digital-forensics",
    title: "Digital Forensics",
    description: "Preserve evidence, build timelines and inspect network artifacts.",
    accent: "INVESTIGATION",
    nodes: [
      ...lessons([
        ["forensics-evidence-preservation", "Preserve before you investigate"],
        ["forensics-log-timeline", "Build a timeline from logs"],
        ["forensics-packet-basics", "Read a network packet"],
      ]),
      ...challenges("forensics"),
    ],
  },
  {
    id: "ai-security",
    title: "AI Security",
    description: "Explore prompt injection, tool permissions and retrieval risks.",
    accent: "EMERGING",
    nodes: lessons([
      ["ai-prompt-injection", "Prompt injection in plain language"],
      ["ai-tool-permissions", "Give AI tools only what they need"],
      ["ai-retrieval-data-protection", "Protect data in retrieval systems"],
    ]),
  },
  {
    id: "reverse-engineering",
    title: "Reverse Engineering",
    description: "Read program artifacts and reason about transformations.",
    accent: "LOW LEVEL",
    nodes: challenges("reverse-engineering"),
  },
  {
    id: "binary-exploitation",
    title: "Binary Exploitation",
    description: "Understand memory layout, stack frames and object lifetimes.",
    accent: "LOW LEVEL",
    nodes: challenges("binary-exploitation"),
  },
  {
    id: "osint",
    title: "OSINT and Intelligence",
    description: "Correlate evidence carefully while respecting privacy and scope.",
    accent: "INTELLIGENCE",
    nodes: challenges("osint-misc"),
  },
  {
    id: "incident-response",
    title: "Incident Response",
    description: "Practice evidence preservation, scoped containment and accountable response decisions.",
    accent: "OPERATIONS",
    nodes: missions([
      ["auth-burst", "Unusual account activity"],
      ["dns-burst", "Unexpected outbound DNS"],
      ["priv-change", "Unexpected privileged change"],
    ]),
  },
];
