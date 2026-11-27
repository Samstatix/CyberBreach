/**
 * Original CyberBreach CTF content. This browser-safe catalogue contains prompts,
 * evidence and progressive hints only. Flags and full walkthroughs stay server-side.
 */
export type ChallengeDifficulty = "medium" | "hard" | "expert";
export type ChallengeCategory = "web-exploitation" | "cryptography" | "reverse-engineering" | "binary-exploitation" | "forensics" | "osint-misc";
export type Challenge = {
  id: string; slug: string; category: ChallengeCategory; title: string;
  difficulty: ChallengeDifficulty; points: number; estimatedMinutes: number;
  summary: string; objective: string; scenario: string; artifact: string; task: string;
  prerequisites: string[]; hints: string[]; safety: string; tags: string[];
};

export const challengeCatalog: Challenge[] = [
  {
    "id": "ad9a78d4-ce0b-5688-9f20-8cf7a6d4b840",
    "slug": "web-broken-badge",
    "category": "web-exploitation",
    "title": "Badge Without a Gate",
    "difficulty": "medium",
    "points": 150,
    "estimatedMinutes": 35,
    "summary": "Find the broken object-level authorization check in a fictional badge API.",
    "objective": "Identify the badge record returned to a user who does not own it, then explain the missing authorization control.",
    "scenario": "You are reviewing a fictional training portal after a learner reports seeing another account's badge. The API is in scope only inside this supplied evidence. No live target exists.",
    "artifact": "SESSION user=learner-17\n\nGET /api/badges/5101 -> 200\n{\"owner\":\"learner-17\",\"badge\":\"FOUNDATIONS\"}\n\nGET /api/badges/5102 -> 200\n{\"owner\":\"learner-44\",\"badge\":\"INCIDENT-LEAD\",\"record\":\"NORTH-17\"}\n\nGET /api/badges/5103 -> 403\n{\"error\":\"forbidden\"}",
    "task": "Which badge ID was returned successfully even though its owner is a different user? Submit the ID inside the standard CB{...} wrapper.",
    "prerequisites": [
      "HTTP request and response basics",
      "Authentication versus authorization"
    ],
    "hints": [
      "Compare the session identity with the owner field in every successful response.",
      "A valid login does not automatically authorize access to every object.",
      "The mismatched successful record is the one to report."
    ],
    "safety": "Fictional API transcript only; no network requests or real accounts are involved.",
    "tags": [
      "idor",
      "broken-access-control",
      "api"
    ]
  },
  {
    "id": "df67fae7-3795-51f0-8dad-efa3106d4074",
    "slug": "web-redirect-boundary",
    "category": "web-exploitation",
    "title": "URL Authority",
    "difficulty": "hard",
    "points": 300,
    "estimatedMinutes": 60,
    "summary": "Reason about URL parsing and a flawed string-prefix allow-list.",
    "objective": "Determine the actual host and port selected by a URL parser when a validator checks only a string prefix.",
    "scenario": "A fictional support portal validates redirect destinations using a string-prefix check. A security review includes the exact parser output for a suspicious but accepted input.",
    "artifact": "Validator pseudocode:\n  if destination.startsWith(\"https://portal.training.test\"):\n      allow(destination)\n\nAccepted input:\n  https://portal.training.test@127.0.0.1:8443/admin/export\n\nURL parser result:\n  protocol = https:\n  username = portal.training.test\n  hostname = 127.0.0.1\n  port = 8443\n  pathname = /admin/export",
    "task": "Report the parsed hostname and port as one flag value, replacing dots and the colon with underscores.",
    "prerequisites": [
      "URL structure",
      "HTTP redirects and allow-lists"
    ],
    "hints": [
      "A URL can contain user information before the @ symbol.",
      "The hostname is the authority component after the @ symbol, not necessarily the text at the beginning.",
      "Read the parser's hostname and port fields, not the original string."
    ],
    "safety": "Static parser output only; no redirect is performed and no internal service is contacted.",
    "tags": [
      "url-parsing",
      "open-redirect",
      "ssrf-awareness"
    ]
  },
  {
    "id": "bfcf22e9-0adf-541f-ac33-c3b047fa632d",
    "slug": "web-claims-wrong-place",
    "category": "web-exploitation",
    "title": "A Header Is Not a Role",
    "difficulty": "expert",
    "points": 500,
    "estimatedMinutes": 90,
    "summary": "Trace a multi-step authorization decision across a verified token, tenant path and client-controlled header.",
    "objective": "Identify the trust-boundary error that lets a request pass an administrative check.",
    "scenario": "A fictional audit export endpoint has a tenant check and a role check. Review the code and the single captured request; the exercise is limited to this supplied program trace.",
    "artifact": "Handler:\n  claims = verifySignedToken(request.token)\n  if claims.tenant_id != request.path.tenant_id:\n      deny(403)\n  role = request.headers[\"x-role\"] ?? claims.role\n  if role == \"admin\":\n      return exportAuditLog()\n  deny(403)\n\nCaptured request:\n  token.tenant_id = org-17\n  token.role = analyst\n  path.tenant_id = org-17\n  X-Role = admin\n  response = 200\n  export_id = EX-9904",
    "task": "Name the unsafe source used for the privileged role decision. Use the flag wrapper with the phrase shown by the vulnerable header name and trust failure.",
    "prerequisites": [
      "JWT claims",
      "Tenant isolation",
      "Server-side authorization"
    ],
    "hints": [
      "The tenant comparison succeeds, so inspect the separate role decision.",
      "A signed token is verified, but the code later reads another value from the request.",
      "Headers are supplied by the requester and are not proof of privilege."
    ],
    "safety": "Code-review exercise using fictional tokens and a fixed trace; no authentication bypass is performed against a real service.",
    "tags": [
      "authorization",
      "jwt",
      "tenant-isolation",
      "trust-boundary"
    ]
  },
  {
    "id": "9ef76366-9a92-51c2-91dd-19e1444140c1",
    "slug": "crypto-shifted-archive",
    "category": "cryptography",
    "title": "A Shift in the Archive",
    "difficulty": "medium",
    "points": 150,
    "estimatedMinutes": 35,
    "summary": "Decode a classical Caesar shift and explain why encoding is not encryption.",
    "objective": "Recover a short training flag from a Caesar-shifted string.",
    "scenario": "An old archive note was shifted by a fixed number of alphabet positions. The braces and punctuation were left unchanged.",
    "artifact": "Ciphertext:\n  JI{yvahapvu_pz_uva_zljbypaf}\n\nAnalyst note:\n  Every alphabetic character was shifted forward by the same number of places. The shift is 7.",
    "task": "Reverse the shift and submit the recovered flag exactly as written.",
    "prerequisites": [
      "Alphabet positions",
      "Basic substitution ciphers"
    ],
    "hints": [
      "A forward shift of 7 must be reversed by shifting backward by 7.",
      "Apply the shift to letters only; underscores and braces remain unchanged.",
      "Check that the result begins with the platform's CB{ prefix."
    ],
    "safety": "Offline puzzle; no real cryptographic material or credentials are used.",
    "tags": [
      "caesar",
      "classical-cryptography",
      "encoding"
    ]
  },
  {
    "id": "fe34edea-b6b8-5cd1-be00-3a49317fec74",
    "slug": "crypto-reused-stream",
    "category": "cryptography",
    "title": "The Reused Stream",
    "difficulty": "hard",
    "points": 300,
    "estimatedMinutes": 65,
    "summary": "Recover a repeating XOR keystream from a known plaintext and a reused ciphertext stream.",
    "objective": "Derive the repeating key bytes and use them to decode the second message.",
    "scenario": "A fictional telemetry service encrypted two messages with the same repeating XOR key. One plaintext is known because it was a fixed status template.",
    "artifact": "Known plaintext:\n  status=ok;user=guest;id\n\nCiphertext of known plaintext (hex):\n  383138553e36644e207e2c522e3764463e202a55702c3d\n\nSecond ciphertext (hex):\n  0807224f2e333c5314373c54382006523f373c40263624\n\nBoth ciphertexts were encrypted with the same repeating key.",
    "task": "Use the known plaintext and its ciphertext to recover the repeating key, then decrypt the second ciphertext. Submit the recovered message.",
    "prerequisites": [
      "XOR operation",
      "Hexadecimal bytes",
      "Known-plaintext reasoning"
    ],
    "hints": [
      "For XOR, ciphertext XOR plaintext reveals the key byte at that position.",
      "The key repeats, so bytes at positions separated by the key length share a key byte.",
      "Apply the recovered repeating key to the second ciphertext."
    ],
    "safety": "Offline byte exercise with synthetic data; no real encrypted traffic is supplied.",
    "tags": [
      "xor",
      "known-plaintext",
      "stream-cipher"
    ]
  },
  {
    "id": "b9b9765f-8aac-503c-9a93-6c4b40a0563d",
    "slug": "crypto-small-modulus",
    "category": "cryptography",
    "title": "The Small Modulus",
    "difficulty": "expert",
    "points": 500,
    "estimatedMinutes": 95,
    "summary": "Factor a deliberately tiny RSA modulus and recover an ASCII message block by block.",
    "objective": "Factor n, derive the private exponent and decrypt each ciphertext integer.",
    "scenario": "A fictional legacy device used a tiny RSA modulus for a training-only message. Each character was encrypted as its ASCII integer using textbook RSA.",
    "artifact": "Public key:\n  n = 11413\n  e = 17\n\nCiphertext blocks (decimal, one ASCII character per block):\n  6424, 6593, 1625, 2026, 2422, 5283, 10698, 10698, 6197, 1176,\n  10706, 1861, 2026, 6197, 8234, 4521, 10706, 5283, 1176, 11216\n\nTraining constraint: n is intentionally small enough to factor with basic trial division.",
    "task": "Factor n, calculate φ(n), find the modular inverse d of e, decrypt each block with m = c^d mod n, and join the resulting ASCII characters.",
    "prerequisites": [
      "Prime factorization",
      "Euler's totient",
      "Modular inverses",
      "RSA decryption"
    ],
    "hints": [
      "Search for the two prime factors of 11413; they are close to the square root.",
      "Calculate φ(n) = (p − 1)(q − 1), then find d such that e·d ≡ 1 mod φ(n).",
      "Decrypt each block separately and convert the result to its ASCII character."
    ],
    "safety": "Small-number mathematics exercise; the key is intentionally insecure and is not used for real data.",
    "tags": [
      "rsa",
      "factorization",
      "modular-arithmetic"
    ]
  },
  {
    "id": "acc2eb76-ff0f-5ef8-ab45-b9e613024a1f",
    "slug": "reverse-strings-static",
    "category": "reverse-engineering",
    "title": "Strings in the Static",
    "difficulty": "medium",
    "points": 150,
    "estimatedMinutes": 35,
    "summary": "Inspect a program's embedded string and identify a simple representation layer.",
    "objective": "Decode the embedded Base64 string and recover the original message.",
    "scenario": "A fictional command-line utility prints a startup banner. A static string extractor found one encoded constant in its read-only data section.",
    "artifact": "Extracted constant:\n  Q0J7c3RyaW5nc19hcmVfY2x1ZXN9\n\nDisassembler note:\n  The program calls a Base64 decoder before displaying this constant.",
    "task": "Decode the constant from Base64 and submit the resulting string.",
    "prerequisites": [
      "Hexadecimal and Base64 basics",
      "Strings in compiled programs"
    ],
    "hints": [
      "Base64 uses letters, numbers, + and /, with optional padding.",
      "This is a representation change, not encryption.",
      "Decode the complete constant as one Base64 value."
    ],
    "safety": "Static string puzzle only; no executable file is provided or run.",
    "tags": [
      "static-analysis",
      "base64",
      "strings"
    ]
  },
  {
    "id": "ac25d654-53d5-5a2e-bb88-709afe5be461",
    "slug": "reverse-branch-table",
    "category": "reverse-engineering",
    "title": "The Branch Table",
    "difficulty": "hard",
    "points": 300,
    "estimatedMinutes": 65,
    "summary": "Reverse a simple byte transformation from a program's loop and output buffer.",
    "objective": "Invert the transformation applied to each byte and recover the accepted input.",
    "scenario": "A fictional checker transforms a candidate byte string before comparing it with an embedded constant. You have the loop and the transformed output, but not the original input.",
    "artifact": "Transformation loop:\n  for i, b in enumerate(input):\n      out[i] = ((b XOR 0x31) + 3*i) AND 0xff\n\nEmbedded output (hex):\n  7276504c605666585a6f8c667d7b98807383958b958b",
    "task": "Invert the operations in reverse order for every byte, then convert the recovered bytes to ASCII.",
    "prerequisites": [
      "XOR",
      "Byte arithmetic",
      "Reading simple pseudocode"
    ],
    "hints": [
      "Undo addition before undoing XOR.",
      "Subtract 3*i from output[i] modulo 256.",
      "XOR the result with 0x31 to recover the original byte."
    ],
    "safety": "Offline pseudocode exercise; no binary or live target is involved.",
    "tags": [
      "static-analysis",
      "control-flow",
      "byte-transform"
    ]
  },
  {
    "id": "0481b38d-d938-5fd2-a436-b6417c62a7a1",
    "slug": "reverse-opcode-breadcrumbs",
    "category": "reverse-engineering",
    "title": "Opcode Breadcrumbs",
    "difficulty": "expert",
    "points": 500,
    "estimatedMinutes": 95,
    "summary": "Reverse a composed byte transformation using XOR, rotation and index-dependent arithmetic.",
    "objective": "Reconstruct the original byte sequence by applying the inverse operations in the correct order.",
    "scenario": "A fictional embedded checker uses a small transformation routine before comparing its input. The key and operation order are visible in a decompiler note.",
    "artifact": "Routine:\n  x = (byte + 7*i) mod 256\n  x = ROL8(x, 3)\n  out[i] = x XOR key[i mod 4]\n\nKey bytes:\n  13 37 A5 5C\n\nOutput bytes (hex):\n  097de9106713c9e8afaad0c98e49030ae56082fbe4371d",
    "task": "For each byte, XOR with the repeating key, rotate right by 3 bits, subtract 7*i modulo 256, and decode the recovered ASCII.",
    "prerequisites": [
      "Bitwise XOR",
      "8-bit rotate operations",
      "Modular byte arithmetic"
    ],
    "hints": [
      "The last operation in the routine is XOR, so undo it first.",
      "A left rotate by 3 is reversed by a right rotate by 3.",
      "After rotation is undone, subtract the index contribution modulo 256."
    ],
    "safety": "Offline byte-transformation puzzle only; no executable or system interaction is required.",
    "tags": [
      "reverse-engineering",
      "bitwise-operations",
      "transform-analysis"
    ]
  },
  {
    "id": "1f0f3d27-d9b8-5cea-bccc-07a29a57af73",
    "slug": "pwn-stack-map",
    "category": "binary-exploitation",
    "title": "The Stack Map",
    "difficulty": "medium",
    "points": 150,
    "estimatedMinutes": 40,
    "summary": "Read a simplified stack-frame layout and calculate the saved return-address offset.",
    "objective": "Calculate the byte offset from the start of a local buffer to the saved instruction pointer.",
    "scenario": "A training binary was compiled for a fictional 64-bit target. The debugger's stack layout is supplied; no exploit needs to be executed.",
    "artifact": "Stack frame (addresses increase upward):\n  buffer[32]       offsets 0–31\n  saved RBP         offsets 32–39\n  saved RIP         offsets 40–47\n\nThe input begins at offset 0 of buffer.",
    "task": "How many bytes from the start of the buffer reach the first byte of saved RIP? Submit the decimal offset.",
    "prerequisites": [
      "Bytes and memory addresses",
      "Stack frames",
      "Saved frame pointer"
    ],
    "hints": [
      "The buffer occupies 32 bytes.",
      "The saved frame pointer occupies the next 8 bytes.",
      "Add both regions before the saved return address."
    ],
    "safety": "Static stack-layout exercise; no exploit payload is executed and no target binary is supplied.",
    "tags": [
      "stack",
      "memory-layout",
      "buffer-overflow"
    ]
  },
  {
    "id": "bec90394-c021-5457-bb64-a18697156c7b",
    "slug": "pwn-format-string-ledger",
    "category": "binary-exploitation",
    "title": "The Format-String Ledger",
    "difficulty": "hard",
    "points": 300,
    "estimatedMinutes": 65,
    "summary": "Reconstruct a leaked byte string from positional pointer values in a safe, synthetic trace.",
    "objective": "Interpret little-endian 64-bit values and concatenate their byte representation.",
    "scenario": "A fictional diagnostic program incorrectly treats user input as a format string. A sanitized debugger trace shows three positional values; the task is offline analysis only.",
    "artifact": "Sanitized output:\n  %1$p -> 0x616d726f667b4243\n  %2$p -> 0x676e697274735f74\n  %3$p -> 0x00007d6b61656c5f\n\nTarget architecture: little-endian, 64-bit.",
    "task": "Convert each 64-bit value to eight little-endian bytes, remove only trailing null bytes, concatenate in order and read the ASCII string.",
    "prerequisites": [
      "Hexadecimal",
      "Little-endian byte order",
      "Format-string concept"
    ],
    "hints": [
      "A 64-bit value is eight bytes; write each byte from least significant to most significant.",
      "Do not reverse the order of the three positional values.",
      "Remove null terminators at the end of each displayed chunk, not printable characters."
    ],
    "safety": "Sanitized numeric trace only; no format-string payload is sent to a program.",
    "tags": [
      "format-string",
      "little-endian",
      "memory-disclosure"
    ]
  },
  {
    "id": "9f792810-442f-56e9-8ab3-7019bb6e6e95",
    "slug": "pwn-heap-afterlife",
    "category": "binary-exploitation",
    "title": "Heap Afterlife",
    "difficulty": "expert",
    "points": 500,
    "estimatedMinutes": 90,
    "summary": "Trace a use-after-free caused by allocator reuse of a freed chunk.",
    "objective": "Identify which object occupies the reused chunk and what the stale pointer reads.",
    "scenario": "A fictional application stores references to heap objects. A debug allocator trace shows a freed chunk being reused by a later allocation of the same size class.",
    "artifact": "Trace:\n  1. A = malloc(0x30) -> 0x55556000\n  2. A->label = \"PUBLIC\"\n  3. free(A)\n  4. B = malloc(0x30) -> 0x55556000\n  5. B->label = \"ARCHIVE-REVIEW-27\"\n  6. legacy_view(A)->label -> \"ARCHIVE-REVIEW-27\"\n\nThe legacy_view reference was not cleared after free(A).",
    "task": "Explain the lifetime error and submit the flag that names the memory-safety bug pattern.",
    "prerequisites": [
      "Heap allocation and free",
      "Pointers and object lifetime",
      "Use-after-free"
    ],
    "hints": [
      "Compare the address returned for A and B.",
      "The same chunk address is reused after A is freed.",
      "The old reference still points to the reused chunk, so it now observes B's label."
    ],
    "safety": "Static allocator trace only; no heap corruption or executable exploit is performed.",
    "tags": [
      "heap",
      "use-after-free",
      "memory-safety"
    ]
  },
  {
    "id": "ee663ae3-9d17-5496-b6ce-2f921de4e982",
    "slug": "forensics-one-minute",
    "category": "forensics",
    "title": "One Minute Missing",
    "difficulty": "medium",
    "points": 150,
    "estimatedMinutes": 35,
    "summary": "Build a short incident timeline from synthetic authentication logs.",
    "objective": "Identify the repeated source address associated with failed SSH attempts.",
    "scenario": "A fictional Linux training host reports an unusual login sequence. The log excerpt uses documentation-only IP addresses.",
    "artifact": "Nov 27 08:12:04 analyst-lab sshd: Failed password for invalid user admin from 192.0.2.44\nNov 27 08:12:11 analyst-lab sshd: Failed password for analyst from 192.0.2.44\nNov 27 08:12:19 analyst-lab sshd: Failed password for analyst from 192.0.2.44\nNov 27 08:14:02 analyst-lab sshd: Accepted publickey for analyst from 192.0.2.25",
    "task": "Identify the source IP repeated across the failed attempts. Replace dots with underscores inside the CB{...} wrapper.",
    "prerequisites": [
      "Log timestamps",
      "IP address structure",
      "Authentication events"
    ],
    "hints": [
      "Separate failed authentication events from the successful one.",
      "Compare the source address on the three failed attempts.",
      "The successful login uses a different address."
    ],
    "safety": "Synthetic log data only; 192.0.2.0/24 is reserved for documentation examples.",
    "tags": [
      "linux-logs",
      "timeline",
      "incident-response"
    ]
  },
  {
    "id": "ee1d5936-6306-5a67-8383-f7ffe64ae04c",
    "slug": "forensics-dns-breadcrumbs",
    "category": "forensics",
    "title": "DNS Breadcrumbs",
    "difficulty": "hard",
    "points": 300,
    "estimatedMinutes": 65,
    "summary": "Reassemble a Base32 data sequence from ordered synthetic DNS query labels.",
    "objective": "Order the numbered labels, remove sequence prefixes, concatenate the payload and decode Base32.",
    "scenario": "A fictional endpoint generated a burst of DNS queries to a training domain. The first label carries a sequence number and the remaining part carries encoded data.",
    "artifact": "DNS query labels (captured order is not guaranteed):\n  03-gx3smvqxg4.exfil.lab.test\n  01-inbhwzdoon.exfil.lab.test\n  05-pu.exfil.lab.test\n  02-pwg2dvnzvx.exfil.lab.test\n  04-3fnvrgyzle.exfil.lab.test\n\nEncoding: Base32, uppercase alphabet; padding omitted.",
    "task": "Sort the fragments by their two-digit sequence number, remove each sequence prefix, concatenate the payload labels and Base32-decode the result.",
    "prerequisites": [
      "DNS query structure",
      "Base32 encoding",
      "Evidence ordering"
    ],
    "hints": [
      "The numeric prefix defines the fragment order.",
      "Remove the prefix and separators before concatenating the payload.",
      "Base32 padding may be omitted; restore it if your decoder requires it."
    ],
    "safety": "Synthetic DNS names under the reserved training domain; no DNS lookups are required.",
    "tags": [
      "dns",
      "network-forensics",
      "base32",
      "exfiltration-detection"
    ]
  },
  {
    "id": "6f6286c1-fe87-5621-827f-941d97e7eedb",
    "slug": "forensics-carved-header",
    "category": "forensics",
    "title": "Carved from Unallocated Space",
    "difficulty": "expert",
    "points": 500,
    "estimatedMinutes": 90,
    "summary": "Recover a deleted training artifact from a supplied hexadecimal byte sequence.",
    "objective": "Reassemble the ordered byte fragments and decode the original ASCII content.",
    "scenario": "A fictional disk image contains a deleted text artifact in unallocated space. The examiner has already established fragment order and extracted the bytes.",
    "artifact": "Fragment order from the allocation map:\n  extent-02 -> 7b6361727665645f66726f6d5f\n  extent-01 -> 4342\n  extent-03 -> 756e616c6c6f63617465647d\n\nAll values are hexadecimal bytes. The fragments are intentionally listed out of order.",
    "task": "Reorder the extents 01, 02, 03, concatenate their hex bytes, convert to ASCII and submit the recovered content.",
    "prerequisites": [
      "Hexadecimal bytes",
      "File carving concepts",
      "Evidence integrity"
    ],
    "hints": [
      "The allocation map gives the order, not the order in which the excerpts are displayed.",
      "Concatenate the hex values before decoding.",
      "Two hexadecimal characters represent one byte."
    ],
    "safety": "Synthetic byte fragments only; no disk image or real user data is involved.",
    "tags": [
      "file-carving",
      "hexadecimal",
      "disk-forensics"
    ]
  },
  {
    "id": "bfc2d4ab-3250-5979-afc2-73798db87d4d",
    "slug": "osint-poster-pier-nine",
    "category": "osint-misc",
    "title": "The Poster at Pier Nine",
    "difficulty": "medium",
    "points": 150,
    "estimatedMinutes": 40,
    "summary": "Correlate clues from fictional public event material without investigating a real person.",
    "objective": "Identify the fictional venue from a poster and an archived public notice.",
    "scenario": "A fictional city tourism office asks you to verify the venue printed on an old event poster. Every organization, venue and record in this exercise is invented.",
    "artifact": "Poster text:\n  NORTHPORT COMMUNITY TECHNOLOGY FAIR\n  Saturday · 14:00–18:00\n  Waterfront district · Hall beside the old ferry clock\n\nArchived city notice:\n  The public event hall beside the old ferry clock is listed in the municipal venue index as Pier 9.\n\nCity: Northport (fictional).",
    "task": "Combine the poster's waterfront clue with the archived municipal notice. Submit the city and venue number in the flag wrapper, using underscores.",
    "prerequisites": [
      "Source verification",
      "Cross-referencing public records",
      "Ethical OSINT"
    ],
    "hints": [
      "The poster gives a landmark, not the formal venue name.",
      "Use the archived municipal notice to map the landmark to the venue index.",
      "The city name and venue number form the requested value."
    ],
    "safety": "All people, places and records are fictional. Do not apply this workflow to identify or locate private individuals.",
    "tags": [
      "osint",
      "source-verification",
      "fictional-investigation"
    ]
  },
  {
    "id": "8e3bda1f-fff5-5c55-b3a0-92d441c0e916",
    "slug": "osint-three-mirrors",
    "category": "osint-misc",
    "title": "The Three Mirrors",
    "difficulty": "hard",
    "points": 300,
    "estimatedMinutes": 65,
    "summary": "Correlate three fictional public records to identify a shared software build identifier.",
    "objective": "Find the value repeated across an archive snapshot, status record and release note.",
    "scenario": "A fictional open-source project has inconsistent release labels across three public pages. Your task is to identify the stable build identifier, not to attribute activity to a person.",
    "artifact": "Archive snapshot:\n  /releases/2026-11-20 -> build_id = bld-7e91\n\nStatus page:\n  deployment = green\n  artifact_ref = bld-7e91\n\nPublic release note:\n  release channel = stable\n  build identifier = bld-7e91\n  display version = 2.4.0",
    "task": "Identify the stable build identifier that appears in all three records. Submit it inside CB{...}.",
    "prerequisites": [
      "Source correlation",
      "Identifiers versus display labels",
      "Evidence provenance"
    ],
    "hints": [
      "Do not assume the human-readable version is the unique artifact identifier.",
      "Compare the identifier fields across all three sources.",
      "The repeated value is the strongest cross-source match."
    ],
    "safety": "Fictional project records only; no real domains, maintainers or accounts are investigated.",
    "tags": [
      "osint",
      "metadata-correlation",
      "verification"
    ]
  },
  {
    "id": "095c4415-dd2b-5dc9-a9ef-02c926ae04ec",
    "slug": "osint-signal-without-person",
    "category": "osint-misc",
    "title": "Signal Without a Person",
    "difficulty": "expert",
    "points": 500,
    "estimatedMinutes": 90,
    "summary": "Correlate synthetic infrastructure metadata while deliberately avoiding personal attribution.",
    "objective": "Combine a release note, archive record and status timestamp to recover a fictional location-time token.",
    "scenario": "A fictional service owner wants to know which internal archive generated a test deployment. The evidence contains infrastructure metadata only; personal attribution is explicitly out of scope.",
    "artifact": "Build manifest:\n  archive_region = east-archive\n  package_digest = sha256:7f91...c204\n\nStatus event:\n  package_digest = sha256:7f91...c204\n  ready_at = 04:17 UTC\n\nMirror index:\n  package_digest = sha256:7f91...c204\n  source_region = east-archive\n\nThe digest is the same in all three records.",
    "task": "Correlate the matching package digest, then combine the source region and ready time. Replace the hyphen and colon with underscores inside CB{...}.",
    "prerequisites": [
      "Evidence correlation",
      "Timestamp normalization",
      "Privacy-preserving OSINT"
    ],
    "hints": [
      "The package digest is the join key across the three records.",
      "Use the region from the manifest/mirror index, not a guessed geographic location.",
      "Use the UTC ready_at time exactly as shown."
    ],
    "safety": "Synthetic infrastructure metadata only. The challenge forbids identifying or profiling real people.",
    "tags": [
      "osint",
      "infrastructure-metadata",
      "privacy"
    ]
  }
];

export function findChallenge(slug: string | undefined): Challenge | undefined {
  return challengeCatalog.find((challenge) => challenge.slug === slug);
}

export function getChallengesForCategory(category: string): Challenge[] {
  return challengeCatalog.filter((challenge) => challenge.category === category);
}

export function getChallengeCounts() {
  return {
    total: challengeCatalog.length,
    medium: challengeCatalog.filter((challenge) => challenge.difficulty === "medium").length,
    hard: challengeCatalog.filter((challenge) => challenge.difficulty === "hard").length,
    expert: challengeCatalog.filter((challenge) => challenge.difficulty === "expert").length,
  };
}
