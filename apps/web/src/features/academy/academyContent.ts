/**
 * CollabCircle-authored Academy curriculum.
 *
 * These lessons are original explanations informed by public learning references.
 * External links are provided for further reading; CyberBreach does not copy their
 * proprietary room text, assessment answers, flags, or walkthroughs.
 */

export type LessonBlock = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
  callout?: string;
};

export type QuizOption = {
  id: string;
  label: string;
};

export type AcademyLesson = {
  id: string;
  title: string;
  duration: string;
  summary: string;
  objectives: string[];
  blocks: LessonBlock[];
  keyTerms: Array<{ term: string; definition: string }>;
  workedExample: { title: string; steps: string[]; takeaway: string };
  question: string;
  options: QuizOption[];
  correctOption: string;
  feedback: string;
  sources: Array<{ label: string; url: string }>;
};

export type AcademyCourse = {
  id: string;
  title: string;
  level: string;
  description: string;
  outcomes: string[];
  lessons: AcademyLesson[];
};

const thmPreSecurity = "https://tryhackme.com/path/outline/beginner";
const thmCyber101 = "https://tryhackme.com/path/outline/cybersecurity101";
const htbAcademy = "https://academy.hackthebox.com/";
const htbPaths = "https://academy.hackthebox.com/catalogue/paths";
const niceFramework = "https://www.nist.gov/itl/applied-cybersecurity/nice/nice-framework-resource-center";
const owaspWstg = "https://owasp.org/www-project-web-security-testing-guide/";
const portSwigger = "https://portswigger.net/web-security/";

export const academyCourses: AcademyCourse[] = [
  {
    id: "cybersecurity-fundamentals",
    title: "Cybersecurity Fundamentals",
    level: "FOUNDATION",
    description: "Learn what security protects, how risk appears, and how defenders reduce it. No technical background is required.",
    outcomes: [
      "Explain confidentiality, integrity and availability in your own words.",
      "Tell the difference between a threat, a vulnerability and a risk.",
      "Describe why several defensive layers are stronger than one.",
    ],
    lessons: [
      {
        id: "security-goals",
        title: "What are we protecting?",
        duration: "8 min",
        summary: "Understand the three basic goals of information security.",
        objectives: ["Explain the CIA triad.", "Give a real-life example of each security goal."],
        blocks: [
          {
            heading: "Start with an everyday example",
            paragraphs: [
              "Imagine you keep important documents in a locked cabinet. You want only the right people to read them, you do not want anyone to secretly change them, and you need them to be available when you need them.",
              "Cybersecurity applies the same ideas to computers, accounts, networks and information. It is not only about stopping hackers. It is also about keeping useful systems trustworthy and available.",
            ],
            callout: "Security is not one magic tool. It is a set of decisions and controls that protect information and the systems that use it.",
          },
          {
            heading: "The CIA triad",
            paragraphs: ["Security professionals often group the main goals into three ideas. The letters C, I and A stand for confidentiality, integrity and availability."],
            bullets: [
              "Confidentiality — only authorized people can see the information. Example: your private account details are not visible to strangers.",
              "Integrity — information stays accurate and is changed only in an authorized way. Example: nobody silently changes a bank transfer amount.",
              "Availability — systems and information are usable when needed. Example: a hospital can access patient records during an emergency.",
            ],
          },
          {
            heading: "Why all three matter",
            paragraphs: [
              "A system can be private but still unsafe if its records are changed incorrectly. A system can have accurate data but be useless if nobody can access it. Good security considers all three goals together.",
            ],
          },
        ],
        keyTerms: [
          { term: "Asset", definition: "Something valuable that needs protection, such as data, a device, an account or a service." },
          { term: "Confidentiality", definition: "Keeping information away from people who are not allowed to see it." },
          { term: "Integrity", definition: "Keeping information accurate and protected from unauthorized changes." },
          { term: "Availability", definition: "Making sure authorized users can access a system when they need it." },
        ],
        workedExample: {
          title: "A university results portal",
          steps: [
            "A student's grades must not be visible to other students. That is confidentiality.",
            "A student's grade must not be changed without an authorized academic process. That is integrity.",
            "Students and faculty need the portal during result publication. That is availability.",
          ],
          takeaway: "One service can need all three security goals at the same time.",
        },
        question: "A student can log in to a results portal, but another student has secretly changed their grade. Which security goal was directly broken?",
        options: [
          { id: "confidentiality", label: "Confidentiality" },
          { id: "integrity", label: "Integrity" },
          { id: "availability", label: "Availability" },
        ],
        correctOption: "integrity",
        feedback: "Integrity is about keeping information correct and preventing unauthorized changes. The grade was changed without permission.",
        sources: [
          { label: "TryHackMe — Pre Security", url: thmPreSecurity },
          { label: "NIST NICE Framework", url: niceFramework },
        ],
      },
      {
        id: "threats-vulnerabilities-risk",
        title: "Threats, vulnerabilities and risk",
        duration: "10 min",
        summary: "Learn the difference between something that can cause harm, a weakness, and the chance of loss.",
        objectives: ["Define threat, vulnerability and risk.", "Explain how a weakness can become a real incident."],
        blocks: [
          {
            heading: "Three words that are easy to mix up",
            paragraphs: [
              "A threat is a possible cause of harm. A vulnerability is a weakness that could be used. Risk is the possibility and impact of that harm in a particular situation.",
              "Think about a house: a burglar is a threat, an unlocked back door is a vulnerability, and the chance of a break-in and its consequences is the risk.",
            ],
          },
          {
            heading: "How they connect",
            paragraphs: ["A threat does not automatically mean an incident will happen. A vulnerability does not always mean someone will exploit it. Risk depends on the situation, including how likely the event is and how much damage it could cause."],
            bullets: [
              "Threat: a criminal tries to access an employee account.",
              "Vulnerability: the account has a weak, reused password and no second factor.",
              "Risk: the account may be taken over, exposing company information.",
            ],
            callout: "A useful first response is to identify the asset, the threat, the weakness and the possible impact. Then choose a control that reduces the risk.",
          },
          {
            heading: "Risk is not just a technical issue",
            paragraphs: ["A small technical weakness can create a serious business problem if it affects important services or sensitive information. Security teams therefore consider impact, likelihood and the value of the asset."],
          },
        ],
        keyTerms: [
          { term: "Threat", definition: "A person, event or condition that could cause harm." },
          { term: "Vulnerability", definition: "A weakness in a system, process or control." },
          { term: "Exploit", definition: "A method or action that takes advantage of a vulnerability." },
          { term: "Risk", definition: "The combination of how likely harm is and how serious its impact could be." },
          { term: "Control", definition: "A safeguard used to reduce risk." },
        ],
        workedExample: {
          title: "A reused password",
          steps: [
            "Asset: an employee's email account.",
            "Threat: someone tries passwords leaked from another website.",
            "Vulnerability: the employee reused the same password.",
            "Possible impact: the attacker reads messages and resets other accounts.",
            "Controls: unique passwords, a password manager and multi-factor authentication.",
          ],
          takeaway: "A control should reduce either the likelihood of an incident, its impact, or both.",
        },
        question: "A web application has an outdated component with a known security weakness. What is the outdated component in this example?",
        options: [
          { id: "threat", label: "The threat" },
          { id: "vulnerability", label: "The vulnerability" },
          { id: "impact", label: "The impact" },
        ],
        correctOption: "vulnerability",
        feedback: "The outdated component is a weakness in the system, so it is the vulnerability. A threat could exploit that weakness.",
        sources: [
          { label: "TryHackMe — Cyber Security 101", url: thmCyber101 },
          { label: "NIST NICE Framework", url: niceFramework },
        ],
      },
      {
        id: "defense-in-depth",
        title: "Defense in depth and least privilege",
        duration: "9 min",
        summary: "Understand why security uses several safeguards and gives users only the access they need.",
        objectives: ["Explain defense in depth.", "Describe least privilege and multi-factor authentication."],
        blocks: [
          {
            heading: "Why one lock is not enough",
            paragraphs: [
              "Imagine a building protected by a fence, a locked entrance, an identity check and cameras. If one layer fails, the other layers can still help.",
              "Defense in depth applies this idea to technology. Organizations combine different controls so that one mistake does not automatically become a major incident.",
            ],
            bullets: [
              "Prevent: patch software and use strong authentication.",
              "Detect: monitor logs and alert on unusual activity.",
              "Respond: disable compromised accounts and investigate.",
              "Recover: restore clean backups and return services safely.",
            ],
          },
          {
            heading: "Least privilege",
            paragraphs: [
              "A person or program should receive only the access needed to perform its task, and only for as long as needed.",
              "For example, an intern who only needs to read a report should not automatically receive permission to delete the entire database.",
            ],
            callout: "More access than necessary creates more ways for mistakes or compromised accounts to cause damage.",
          },
          {
            heading: "Multi-factor authentication",
            paragraphs: [
              "A password is one proof of identity. Multi-factor authentication (MFA) asks for another independent proof, such as an authenticator-app code or a security key.",
              "MFA does not make an account impossible to compromise, but it can make a stolen password less useful to an attacker.",
            ],
          },
        ],
        keyTerms: [
          { term: "Defense in depth", definition: "Using multiple complementary security layers." },
          { term: "Least privilege", definition: "Giving only the minimum access needed for a task." },
          { term: "MFA", definition: "Authentication using two or more different types of evidence." },
          { term: "Recovery", definition: "Restoring systems and data to a trustworthy working state after an incident." },
        ],
        workedExample: {
          title: "Protecting a shared company folder",
          steps: [
            "Require each employee to use an individual account and MFA.",
            "Give each team access only to the folders it needs.",
            "Keep audit logs of file access and changes.",
            "Maintain tested backups so accidental deletion can be recovered.",
          ],
          takeaway: "Several independent safeguards make the overall system more resilient.",
        },
        question: "A staff member can view project files but cannot delete or change them because their role only requires reading. Which principle is being applied?",
        options: [
          { id: "least", label: "Least privilege" },
          { id: "availability", label: "Availability" },
          { id: "obfuscation", label: "Obfuscation" },
        ],
        correctOption: "least",
        feedback: "Least privilege gives users only the permissions required for their job. Read-only access is appropriate when editing is not needed.",
        sources: [
          { label: "NIST NICE Framework", url: niceFramework },
          { label: "Hack The Box Academy", url: htbAcademy },
        ],
      },
    ],
  },
  {
    id: "networking-essentials",
    title: "Networking Essentials",
    level: "FOUNDATION",
    description: "Learn how computers identify one another and exchange information before moving into traffic analysis and network security.",
    outcomes: [
      "Explain the purpose of IP addresses, ports and protocols.",
      "Describe how DNS and HTTP work when opening a website.",
    ],
    lessons: [
      {
        id: "ip-ports-protocols",
        title: "IP addresses, ports and protocols",
        duration: "11 min",
        summary: "Understand the basic labels and rules that let devices communicate.",
        objectives: ["Explain an IP address and a port.", "Distinguish TCP from UDP at a basic level."],
        blocks: [
          {
            heading: "A network is a delivery system",
            paragraphs: [
              "When you send a parcel, the delivery service needs an address and some idea of where the parcel should go. Computer networks solve a similar problem with digital information.",
              "An IP address identifies a network interface so data can be routed to the right destination. A port helps the receiving device direct the data to the correct application or service.",
            ],
          },
          {
            heading: "IP address, port and protocol",
            bullets: [
              "IP address: identifies where data should be delivered on a network.",
              "Port: identifies which service or application should receive the data.",
              "Protocol: a shared set of rules that devices follow when communicating.",
            ],
            callout: "A simplified destination might look like 203.0.113.10:443 — an example IP address followed by port 443. The address identifies the host; the port points to a service.",
          },
          {
            heading: "TCP and UDP",
            paragraphs: [
              "TCP creates a connection and provides ordered, reliable delivery. It is useful when the application needs data to arrive correctly and in order.",
              "UDP sends datagrams without the same connection and delivery guarantees. It can be useful when speed and low overhead matter and the application can handle loss or reordering.",
            ],
          },
        ],
        keyTerms: [
          { term: "IP address", definition: "A network address used to route data to a device or interface." },
          { term: "Port", definition: "A number used by a device to direct network traffic to a service." },
          { term: "Protocol", definition: "Agreed rules for how systems exchange information." },
          { term: "TCP", definition: "A transport protocol that provides reliable, ordered delivery." },
          { term: "UDP", definition: "A transport protocol that sends datagrams without TCP's delivery guarantees." },
        ],
        workedExample: {
          title: "Opening a secure website",
          steps: [
            "Your device finds the website's IP address using DNS.",
            "The browser connects to the server using TCP in a typical HTTPS connection.",
            "The browser uses port 443 for HTTPS.",
            "The browser and server exchange encrypted application data after setting up TLS.",
          ],
          takeaway: "IP address, port and protocol answer different questions; they work together.",
        },
        question: "In the destination 203.0.113.10:443, what does 443 represent?",
        options: [
          { id: "ip", label: "The IP address" },
          { id: "port", label: "The port number" },
          { id: "protocol", label: "The protocol name" },
        ],
        correctOption: "port",
        feedback: "443 is the port number. It commonly identifies the HTTPS service on a server.",
        sources: [
          { label: "TryHackMe — Pre Security", url: thmPreSecurity },
          { label: "TryHackMe — Cyber Security 101", url: thmCyber101 },
        ],
      },
      {
        id: "dns-and-http",
        title: "DNS and HTTP: opening a website",
        duration: "12 min",
        summary: "Follow the journey from typing a website name to receiving a page.",
        objectives: ["Explain why DNS is needed.", "Describe a simplified HTTP request and response."],
        blocks: [
          {
            heading: "People use names; networks use addresses",
            paragraphs: [
              "It is easier to remember a website name than a numeric IP address. The Domain Name System (DNS) helps translate a domain name, such as example.com, into the address needed to contact a server.",
              "DNS is often compared to a contacts list: you look up a name to find the number or address associated with it. The real system is distributed and more complex, but the analogy helps explain the purpose.",
            ],
          },
          {
            heading: "The browser and server conversation",
            paragraphs: [
              "HTTP is the application protocol browsers and web servers use to exchange requests and responses. The browser asks for a resource; the server sends back a response that includes a status and, often, content.",
            ],
            bullets: [
              "Request: method, path, headers and sometimes a body.",
              "Response: status code, headers and sometimes a body.",
              "HTTPS: HTTP protected by TLS encryption while data travels between the browser and server.",
            ],
          },
          {
            heading: "A simplified visit",
            bullets: [
              "You enter a domain name in the browser.",
              "The browser or operating system looks up the domain using DNS.",
              "The device connects to the server's IP address and service port.",
              "For HTTPS, the connection negotiates TLS protection.",
              "The browser sends an HTTP request and receives an HTTP response.",
            ],
            callout: "This is a simplified learning model. Real browsers may reuse cached DNS results, existing connections and other optimizations.",
          },
        ],
        keyTerms: [
          { term: "DNS", definition: "A distributed naming system that helps translate domain names into network records, including IP addresses." },
          { term: "HTTP", definition: "An application protocol for requests and responses between clients and servers." },
          { term: "HTTPS", definition: "HTTP protected by TLS." },
          { term: "Status code", definition: "A number in an HTTP response that summarizes the result, such as 200 or 404." },
        ],
        workedExample: {
          title: "A page returns 404",
          steps: [
            "DNS may still work correctly and point the browser to the right server.",
            "The browser sends a request for /old-page.",
            "The server responds with HTTP status 404 because that resource was not found.",
            "A 404 response does not by itself mean the website was hacked.",
          ],
          takeaway: "A network connection can succeed even when the requested page does not exist.",
        },
        question: "What is DNS mainly helping your device do when you visit a website by name?",
        options: [
          { id: "encrypt", label: "Encrypt the page content" },
          { id: "resolve", label: "Find the network records associated with the domain name" },
          { id: "render", label: "Draw the website on your screen" },
        ],
        correctOption: "resolve",
        feedback: "DNS helps resolve a domain name to records such as the IP address needed to reach the service. TLS handles transport encryption; the browser renders the page.",
        sources: [
          { label: "TryHackMe — Pre Security", url: thmPreSecurity },
          { label: "Hack The Box Academy", url: htbAcademy },
        ],
      },
    ],
  },
  {
    id: "linux-foundations",
    title: "Linux Foundations",
    level: "FOUNDATION",
    description: "Learn the Linux filesystem, basic commands and permissions. Practice safely in a simulated terminal before using real lab machines.",
    outcomes: [
      "Explain the purpose of common filesystem locations.",
      "Use basic commands to inspect a simulated Linux environment.",
      "Explain why file permissions matter.",
    ],
    lessons: [
      {
        id: "linux-filesystem",
        title: "Files, folders and navigation",
        duration: "10 min",
        summary: "Learn how Linux organizes files and how to move around from the command line.",
        objectives: ["Explain the root directory.", "Understand pwd, ls and cd."],
        blocks: [
          {
            heading: "The filesystem is a tree",
            paragraphs: [
              "Linux organizes files and folders in a hierarchy. The top of that hierarchy is called the root directory and is written as /. Other folders live below it.",
              "A path tells you where something is. An absolute path starts at /, while a relative path is interpreted from your current directory.",
            ],
          },
          {
            heading: "Three commands to get oriented",
            bullets: [
              "pwd — print the directory you are currently in.",
              "ls — list the files and folders in a directory.",
              "cd — change to another directory.",
            ],
            callout: "Commands are instructions to a shell. In CyberBreach's browser exercise, commands are simulated and do not run on your computer.",
          },
          {
            heading: "A few useful locations",
            bullets: [
              "/home — home directories for regular users.",
              "/etc — system-wide configuration files.",
              "/var/log — many system and service log files.",
              "/tmp — temporary files.",
            ],
          },
        ],
        keyTerms: [
          { term: "Root directory", definition: "The top-level directory of a Linux filesystem, written /." },
          { term: "Path", definition: "The location of a file or directory." },
          { term: "Shell", definition: "A program that reads commands and asks the operating system to carry them out." },
          { term: "Working directory", definition: "The directory a process is currently operating in." },
        ],
        workedExample: {
          title: "Find the current directory",
          steps: [
            "Run pwd to see where you are.",
            "Run ls to list the items in that location.",
            "Run cd /var/log to move into the log directory.",
            "Run pwd again to confirm the new location.",
          ],
          takeaway: "Check your current location before running commands that change or inspect files.",
        },
        question: "Which command prints the current working directory?",
        options: [
          { id: "ls", label: "ls" },
          { id: "pwd", label: "pwd" },
          { id: "cd", label: "cd" },
        ],
        correctOption: "pwd",
        feedback: "pwd means print working directory. It shows the path of the directory you are currently in.",
        sources: [
          { label: "TryHackMe — Cyber Security 101", url: thmCyber101 },
          { label: "Hack The Box Academy", url: htbAcademy },
        ],
      },
      {
        id: "linux-permissions",
        title: "Users and file permissions",
        duration: "11 min",
        summary: "Understand who owns a file and who is allowed to read, change or run it.",
        objectives: ["Explain user, group and other permissions.", "Recognize read, write and execute permissions."],
        blocks: [
          {
            heading: "Why permissions exist",
            paragraphs: [
              "A shared computer may have many users. Permissions help stop one user from reading private files, changing system configuration or running programs they should not control.",
              "Linux commonly describes permissions for three groups: the file owner, the file's group and everyone else (often called others).",
            ],
          },
          {
            heading: "Read, write and execute",
            bullets: [
              "Read (r): view a file's contents or list a directory.",
              "Write (w): change a file or create/remove entries in a directory, depending on the directory permissions.",
              "Execute (x): run a program file or enter a directory when the other requirements are met.",
            ],
          },
          {
            heading: "Use the minimum access needed",
            paragraphs: [
              "A configuration file containing sensitive information should not be readable by every account. A script that only its owner needs to change should not be writable by everyone.",
              "This is another example of least privilege: permissions should match the task, not provide the broadest access possible.",
            ],
            callout: "Do not copy permission-changing commands from the internet without understanding the effect. Broad permissions can expose sensitive files or weaken a system.",
          },
        ],
        keyTerms: [
          { term: "Owner", definition: "The user account associated with a file." },
          { term: "Group", definition: "A set of user accounts that can share permissions." },
          { term: "Read (r)", definition: "Permission to read a file or list directory entries." },
          { term: "Write (w)", definition: "Permission to modify a file or directory entries." },
          { term: "Execute (x)", definition: "Permission to run a program or traverse a directory." },
        ],
        workedExample: {
          title: "A private notes file",
          steps: [
            "The file belongs to user sam.",
            "Sam needs to read and edit it.",
            "Other users do not need access.",
            "A sensible permission policy gives Sam read/write access and does not grant unnecessary access to others.",
          ],
          takeaway: "Permissions should reflect who needs to do what, and nothing more.",
        },
        question: "Which permission allows a user to run an executable file?",
        options: [
          { id: "read", label: "Read (r)" },
          { id: "write", label: "Write (w)" },
          { id: "execute", label: "Execute (x)" },
        ],
        correctOption: "execute",
        feedback: "Execute permission (x) allows a program file to be run, subject to the other system and directory requirements.",
        sources: [
          { label: "TryHackMe — Cyber Security 101", url: thmCyber101 },
          { label: "Hack The Box Academy", url: htbAcademy },
        ],
      },
    ],
  },
];

export function findCourse(courseId: string | undefined): AcademyCourse | undefined {
  return academyCourses.find((course) => course.id === courseId);
}

export function findLesson(lessonId: string | undefined): { course: AcademyCourse; lesson: AcademyLesson; index: number } | undefined {
  for (const course of academyCourses) {
    const index = course.lessons.findIndex((lesson) => lesson.id === lessonId);
    if (index >= 0) {
      return { course, lesson: course.lessons[index], index };
    }
  }
  return undefined;
}

export const academyReferenceLinks = [
  { label: "TryHackMe Pre Security", url: thmPreSecurity, note: "Beginner-first learning path structure." },
  { label: "TryHackMe Cyber Security 101", url: thmCyber101, note: "Broad foundation topics across offensive and defensive security." },
  { label: "Hack The Box Academy", url: htbAcademy, note: "Modular lessons, practical examples and skills progression." },
  { label: "Hack The Box learning paths", url: htbPaths, note: "Ordered paths for skill and role development." },
  { label: "NIST NICE Framework", url: niceFramework, note: "Cybersecurity knowledge and skills vocabulary." },
  { label: "OWASP Web Security Testing Guide", url: owaspWstg, note: "Methodology for authorized web security testing." },
  { label: "PortSwigger Web Security Academy", url: portSwigger, note: "Free technical web security topics and labs." },
];
