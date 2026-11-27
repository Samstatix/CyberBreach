import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { ArrowLeft, ChevronRight, CircleHelp, Eraser, ShieldCheck, TerminalSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { usePlayerProgress } from "../progression/progressionService";
import { completeLabTask, syncGuestLabTasks } from "../../lib/labTaskProgress";
import type { LabTaskResult } from "../../lib/labTaskProgress";

type LineKind = "command" | "output" | "error";
type TerminalLine = { id: number; kind: LineKind; text: string };

const initialLines: TerminalLine[] = [
  { id: 1, kind: "output", text: "CYBERBREACH SIMULATED LINUX ENVIRONMENT" },
  { id: 2, kind: "output", text: "Training host: analyst-lab-01 · User: analyst · Kernel: simulated 6.1" },
  { id: 3, kind: "output", text: "This is a browser simulation. Commands do not run on your computer or a real server." },
  { id: 4, kind: "output", text: "Type help to see the available commands." },
];

const helpText = [
  "Available simulated commands:",
  "  help                     Show this command list",
  "  clear                    Clear the terminal display",
  "  whoami                   Show the simulated current user",
  "  pwd                      Print the simulated working directory",
  "  ls [path]                List simulated files",
  "  cd [path]                Change the simulated directory",
  "  cat README.md            Read the lab notes",
  "  cat /etc/os-release      Read simulated OS information",
  "  cat /var/log/auth.log    Inspect sample authentication logs",
  "  ip addr                  Show simulated network interfaces",
  "  ip route                 Show the simulated route table",
  "  ss -tuln                 Show simulated listening sockets",
  "  id                       Show simulated user and group IDs",
  "  history                  Show commands entered in this session",
  "",
  "Tip: try pwd, ls, then cat README.md.",
];

const filesByDirectory: Record<string, string[]> = {
  "/home/analyst": ["README.md", "notes.txt", "evidence/"],
  "/home/analyst/evidence": ["auth.log", "network-summary.txt"],
  "/var/log": ["auth.log", "syslog", "kern.log"],
  "/etc": ["hostname", "os-release", "hosts"],
  "/": ["etc/", "home/", "tmp/", "usr/", "var/"],
};

const fileContents: Record<string, string[]> = {
  "README.md": [
    "# Analyst Lab Notes",
    "This simulated host contains sample evidence for beginner Linux practice.",
    "The evidence is fictional and uses documentation-only IP addresses.",
    "Suggested workflow: identify your user, inspect the current directory, then review the authentication log.",
  ],
  "notes.txt": [
    "Investigation note:",
    "- Several failed SSH logins were recorded before a successful login.",
    "- Compare timestamps and source addresses.",
    "- This is a synthetic exercise, not a real incident.",
  ],
  "auth.log": [
    "Nov 27 08:12:04 analyst-lab sshd[410]: Failed password for invalid user admin from 192.0.2.44 port 51221 ssh2",
    "Nov 27 08:12:11 analyst-lab sshd[412]: Failed password for analyst from 192.0.2.44 port 51229 ssh2",
    "Nov 27 08:12:19 analyst-lab sshd[417]: Failed password for analyst from 192.0.2.44 port 51238 ssh2",
    "Nov 27 08:14:02 analyst-lab sshd[431]: Accepted publickey for analyst from 192.0.2.25 port 52001 ssh2",
  ],
  "network-summary.txt": [
    "Interface: eth0",
    "Address: 192.0.2.25/24",
    "Default gateway: 192.0.2.1",
    "Note: 192.0.2.0/24 is reserved for documentation examples.",
  ],
  "/etc/os-release": [
    "NAME=\"CyberBreach Training Linux\"",
    "ID=cyberbreach-lab",
    "VERSION=\"1.0 (simulated)\"",
    "PRETTY_NAME=\"CyberBreach Training Linux 1.0 (simulated)\"",
  ],
};

const labTasks = [
  { id: "linux-auth-source", title: "Trace failed SSH logins", command: "cat /var/log/auth.log", prompt: "Which source IP appears repeatedly in the failed SSH attempts?", placeholder: "Enter the repeated source IP" },
  { id: "linux-listening-ports", title: "Identify listening services", command: "ss -tuln", prompt: "Which TCP ports are listening? Submit the port numbers in ascending order, separated by commas.", placeholder: "Example: 22,80,443" },
  { id: "linux-default-gateway", title: "Find the default gateway", command: "ip route", prompt: "Which IP address is used by the default route as the gateway?", placeholder: "Enter the gateway IP" },
  { id: "linux-current-user", title: "Identify the current user", command: "whoami", prompt: "Which username is returned by the simulated whoami command?", placeholder: "Enter the username" },
];

function normalizePath(currentDirectory: string, requestedPath: string): string {
  const base = requestedPath.startsWith("/") ? [] : currentDirectory.split("/").filter(Boolean);
  for (const segment of requestedPath.split("/")) {
    if (!segment || segment === ".") continue;
    if (segment === "..") base.pop();
    else base.push(segment);
  }
  return "/" + base.join("/");
}

/**
 * A deliberately allow-listed shell simulator.
 *
 * User input is parsed as text and matched against known training commands.
 * It is never passed to eval, a process runner, a shell, or a network request.
 */
export default function TerminalSimulatorPage() {
  const [lines, setLines] = useState<TerminalLine[]>(initialLines);
  const [command, setCommand] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [workingDirectory, setWorkingDirectory] = useState("/home/analyst");
  const [nextId, setNextId] = useState(5);
  const [findings, setFindings] = useState<Record<string, string>>({});
  const [taskResults, setTaskResults] = useState<Record<string, LabTaskResult>>({});
  const [taskErrors, setTaskErrors] = useState<Record<string, string>>({});
  const [busyTaskIds, setBusyTaskIds] = useState<string[]>([]);
  const outputRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { progress } = usePlayerProgress(user?.id);

  useEffect(() => {
    outputRef.current?.scrollTo({ top: outputRef.current.scrollHeight, behavior: "smooth" });
  }, [lines]);

  useEffect(() => {
    void syncGuestLabTasks(user?.id);
  }, [user?.id]);

  function runCommand(rawCommand: string) {
    const trimmed = rawCommand.trim();
    if (!trimmed) return;

    const parts = trimmed.split(/\s+/);
    const name = parts[0];
    const args = parts.slice(1);
    const commandLine: TerminalLine = {
      id: nextId,
      kind: "command",
      text: "analyst@lab:" + workingDirectory + "$ " + trimmed,
    };
    setHistory((previous) => [...previous, trimmed]);

    if (name === "clear") {
      setLines([]);
      setNextId((previous) => previous + 1);
      return;
    }

    let output: string[] = [];
    let kind: LineKind = "output";

    if (name === "help") output = helpText;
    else if (name === "whoami") output = ["analyst"];
    else if (name === "pwd") output = [workingDirectory];
    else if (name === "id") output = ["uid=1001(analyst) gid=1001(analyst) groups=1001(analyst),27(sudo-lab)"];
    else if (name === "ls") {
      const target = args[0] ? normalizePath(workingDirectory, args[0]) : workingDirectory;
      output = filesByDirectory[target] ?? ["ls: cannot access '" + (args[0] ?? target) + "': No such file or directory"];
      if (output[0]?.startsWith("ls:")) kind = "error";
    } else if (name === "cd") {
      const target = args[0] ? normalizePath(workingDirectory, args[0]) : "/home/analyst";
      if (filesByDirectory[target]) {
        setWorkingDirectory(target);
      } else {
        kind = "error";
        output = ["cd: " + (args[0] ?? "") + ": No such directory in this simulation"];
      }
    } else if (name === "cat") {
      const requested = args.join(" ");
      const target = requested.startsWith("/") ? requested : normalizePath(workingDirectory, requested);
      const baseName = target.split("/").pop() ?? target;
      const fileOutput = fileContents[target] ?? fileContents[baseName];
      if (fileOutput) output = fileOutput;
      else {
        kind = "error";
        output = ["cat: " + (requested || "(missing filename)") + ": No such file in this simulation"];
      }
    } else if (name === "ip" && args[0] === "addr") {
      output = [
        "1: lo: <LOOPBACK,UP> mtu 65536",
        "    inet 127.0.0.1/8 scope host lo",
        "2: eth0: <BROADCAST,MULTICAST,UP> mtu 1500",
        "    inet 192.0.2.25/24 brd 192.0.2.255 scope global eth0",
      ];
    } else if (name === "ip" && args[0] === "route") {
      output = [
        "default via 192.0.2.1 dev eth0",
        "192.0.2.0/24 dev eth0 proto kernel scope link src 192.0.2.25",
      ];
    } else if (name === "ss" && args[0] === "-tuln") {
      output = [
        "Netid State  Local Address:Port",
        "tcp   LISTEN 0.0.0.0:22",
        "tcp   LISTEN 0.0.0.0:80",
        "tcp   LISTEN 0.0.0.0:443",
      ];
    } else if (name === "history") {
      output = history.length ? history.map((item, index) => " " + (index + 1) + "  " + item) : ["No previous commands."];
    } else {
      kind = "error";
      output = ["bash: " + name + ": command not found in this training simulator. Type 'help' for supported commands."];
    }

    const outputLines = output.map((text, index) => ({
      id: nextId + 1 + index,
      kind,
      text,
    }));
    setLines((previous) => [...previous, commandLine, ...outputLines]);
    setNextId((previous) => previous + output.length + 1);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    runCommand(command);
    setCommand("");
  }

  function useSuggestion(value: string) {
    setCommand(value);
    document.getElementById("simulated-terminal-input")?.focus();
  }

  async function handleLabTaskSubmit(event: FormEvent<HTMLFormElement>, taskId: string) {
    event.preventDefault();
    setBusyTaskIds((previous) => [...previous, taskId]);
    setTaskErrors((previous) => ({ ...previous, [taskId]: "" }));
    try {
      const result = await completeLabTask(taskId, findings[taskId] ?? "", user?.id);
      setTaskResults((previous) => ({ ...previous, [taskId]: result }));
    } catch (error) {
      setTaskErrors((previous) => ({
        ...previous,
        [taskId]: error instanceof Error ? error.message : "The lab task could not be saved.",
      }));
    } finally {
      setBusyTaskIds((previous) => previous.filter((id) => id !== taskId));
    }
  }

  function resetTerminal() {
    setLines(initialLines);
    setHistory([]);
    setWorkingDirectory("/home/analyst");
    setCommand("");
    setFindings({});
    setTaskResults({});
    setTaskErrors({});
    setBusyTaskIds([]);
    setNextId(5);
  }

  return (
    <section className="section-page terminal-lab-page">
      <Link className="back-link" to="/labs"><ArrowLeft size={14}/> BACK TO CYBER LABS</Link>
      <div className="eyebrow">BROWSER SIMULATION / LINUX FOUNDATIONS</div>
      <h1>Linux practice terminal</h1>
      <p className="section-description">Try basic Linux commands in a safe, simulated environment. The terminal understands a small list of teaching commands; it is not connected to your computer or the internet.</p>

      <div className="terminal-safety-banner"><ShieldCheck size={17}/><p><strong>Safe simulation:</strong> no real shell, file system, host access or network activity is available here.</p></div>

      <div className="terminal-panel">
        <div className="terminal-panel-header">
          <div><span className="terminal-lights"><i/><i/><i/></span><strong><TerminalSquare size={15}/> analyst@cyberbreach-lab</strong></div>
          <button type="button" onClick={resetTerminal}><Eraser size={14}/> RESET</button>
        </div>
        <div className="terminal-output" ref={outputRef} aria-label="Simulated terminal output" aria-live="polite">
          {lines.map((line) => (
            <div className={"terminal-line " + line.kind} key={line.id}>
              {line.kind === "command" ? <ChevronRight size={13}/> : null}
              <span>{line.text}</span>
            </div>
          ))}
          <div className="terminal-current-path"><span>analyst@lab:{workingDirectory}$</span></div>
        </div>
        <form className="terminal-input-row" onSubmit={handleSubmit}>
          <label htmlFor="simulated-terminal-input">analyst@lab:{workingDirectory}$</label>
          <input id="simulated-terminal-input" value={command} onChange={(event) => setCommand(event.target.value)} autoComplete="off" spellCheck={false} placeholder="Type a command, e.g. help" />
          <button type="submit" disabled={!command.trim()}>RUN</button>
        </form>
      </div>

      <div className="terminal-suggestions"><strong>Try a command</strong>{["help", "pwd", "ls", "cat README.md", "cat /var/log/auth.log", "ip addr", "ss -tuln"].map((item) => <button key={item} type="button" onClick={() => useSuggestion(item)}>{item}</button>)}</div>

      <div className="terminal-task-list">
        <div className="terminal-task-list-heading"><div><CircleHelp size={18}/><strong>Linux mini investigations</strong></div><span>4 TASKS · 50 XP EACH</span></div>
        {!user && <p className="account-public-note"><Link to="/account">Sign in or create a free account</Link> to submit findings and earn synchronized XP. The terminal remains available for practice.</p>}
        {labTasks.map((task, index) => {
          const completed = progress.completedLabTaskIds.includes(task.id);
          const inspected = history.some((item) => item === task.command);
          const result = taskResults[task.id];
          const error = taskErrors[task.id];
          const busy = busyTaskIds.includes(task.id);
          return (
            <article className="terminal-task-card" key={task.id}>
              <div><strong>INVESTIGATION {String(index + 1).padStart(2, "0")} · {task.title}</strong><span className="terminal-task-reward">+50 XP</span></div>
              <p>{task.prompt}</p>
              <small>INSPECT EVIDENCE: <code>{task.command}</code></small>
              {completed ? (
                <p className="lab-task-result correct">Investigation complete. Your 50 XP reward has been recorded.</p>
              ) : (
                <>
                  <form className="lab-task-answer-form" onSubmit={(event) => void handleLabTaskSubmit(event, task.id)}>
                    <input aria-label={task.title + " answer"} value={findings[task.id] ?? ""} onChange={(event) => setFindings((previous) => ({ ...previous, [task.id]: event.target.value }))} placeholder={task.placeholder}/>
                    <button type="submit" disabled={!user || !inspected || !(findings[task.id] ?? "").trim() || busy}>{busy ? "CHECKING…" : "SUBMIT"}</button>
                  </form>
                  <p className="lab-task-result">{!user ? "Sign in to submit your finding. Evidence commands remain available in guest mode." : !inspected ? "Run the evidence command above to unlock this answer field." : "Submit your finding to complete this task and earn 50 XP."}</p>
                  {result && <p className={"lab-task-result " + (result.correct ? "correct" : "incorrect")}>{result.message}{result.xp_awarded > 0 ? " +" + result.xp_awarded + " XP." : ""}</p>}
                  {error && <p className="lab-task-result incorrect">{error}</p>}
                </>
              )}
            </article>
          );
        })}
      </div>
      <p className="practice-only-note">All output is synthetic training data. The address range 192.0.2.0/24 is reserved for documentation examples.</p>
    </section>
  );
}
