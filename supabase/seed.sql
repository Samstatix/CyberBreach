-- Idempotent seed for the six agreed CTF disciplines.
-- Public challenge metadata only. Flags and walkthroughs are loaded separately from an ignored private file.

insert into public.challenge_categories (slug, name, description, sort_order)
values
  ('web-exploitation', 'Web Exploitation', 'Investigate weaknesses in web applications, APIs, sessions and access control.', 1),
  ('cryptography', 'Cryptography', 'Understand ciphers, encryption, hashes, key handling and cryptographic implementation mistakes.', 2),
  ('reverse-engineering', 'Reverse Engineering', 'Inspect programs and file formats to understand behavior without relying on original source code.', 3),
  ('binary-exploitation', 'Binary Exploitation (Pwn)', 'Study memory safety, program execution and exploitation of intentionally vulnerable binaries in isolated labs.', 4),
  ('forensics', 'Forensics and Network Forensics', 'Reconstruct events from files, metadata, memory, packet captures and logs.', 5),
  ('osint-misc', 'OSINT & Misc', 'Practice ethical open-source investigation and technical puzzles using fictional or authorized material.', 6)
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  sort_order = excluded.sort_order;


-- Original medium, hard and expert challenges across all six CTF disciplines.

-- web-broken-badge
insert into public.challenges (
  id, category_id, slug, title, summary, description_md, difficulty,
  points, estimated_minutes, tags, prerequisites, status, hints
)
select
  'ad9a78d4-ce0b-5688-9f20-8cf7a6d4b840'::uuid, category.id, 'web-broken-badge', 'Badge Without a Gate', 'Find the broken object-level authorization check in a fictional badge API.',
  'You are reviewing a fictional training portal after a learner reports seeing another account''s badge. The API is in scope only inside this supplied evidence. No live target exists.

Evidence:
SESSION user=learner-17

GET /api/badges/5101 -> 200
{"owner":"learner-17","badge":"FOUNDATIONS"}

GET /api/badges/5102 -> 200
{"owner":"learner-44","badge":"INCIDENT-LEAD","record":"NORTH-17"}

GET /api/badges/5103 -> 403
{"error":"forbidden"}

Your task:
Which badge ID was returned successfully even though its owner is a different user? Submit the ID inside the standard CB{...} wrapper.

Safety boundary:
Fictional API transcript only; no network requests or real accounts are involved.', 'medium', 150, 35,
  array['idor','broken-access-control','api']::text[], array['HTTP request and response basics','Authentication versus authorization']::text[], 'published', '["Compare the session identity with the owner field in every successful response.","A valid login does not automatically authorize access to every object.","The mismatched successful record is the one to report."]'::jsonb
from public.challenge_categories as category
where category.slug = 'web-exploitation'
on conflict (slug) do update set
  title = excluded.title,
  summary = excluded.summary,
  description_md = excluded.description_md,
  difficulty = excluded.difficulty,
  points = excluded.points,
  estimated_minutes = excluded.estimated_minutes,
  tags = excluded.tags,
  prerequisites = excluded.prerequisites,
  status = excluded.status,
  hints = excluded.hints;

-- web-redirect-boundary
insert into public.challenges (
  id, category_id, slug, title, summary, description_md, difficulty,
  points, estimated_minutes, tags, prerequisites, status, hints
)
select
  'df67fae7-3795-51f0-8dad-efa3106d4074'::uuid, category.id, 'web-redirect-boundary', 'URL Authority', 'Reason about URL parsing and a flawed string-prefix allow-list.',
  'A fictional support portal validates redirect destinations using a string-prefix check. A security review includes the exact parser output for a suspicious but accepted input.

Evidence:
Validator pseudocode:
  if destination.startsWith("https://portal.training.test"):
      allow(destination)

Accepted input:
  https://portal.training.test@127.0.0.1:8443/admin/export

URL parser result:
  protocol = https:
  username = portal.training.test
  hostname = 127.0.0.1
  port = 8443
  pathname = /admin/export

Your task:
Report the parsed hostname and port as one flag value, replacing dots and the colon with underscores.

Safety boundary:
Static parser output only; no redirect is performed and no internal service is contacted.', 'hard', 300, 60,
  array['url-parsing','open-redirect','ssrf-awareness']::text[], array['URL structure','HTTP redirects and allow-lists']::text[], 'published', '["A URL can contain user information before the @ symbol.","The hostname is the authority component after the @ symbol, not necessarily the text at the beginning.","Read the parser''s hostname and port fields, not the original string."]'::jsonb
from public.challenge_categories as category
where category.slug = 'web-exploitation'
on conflict (slug) do update set
  title = excluded.title,
  summary = excluded.summary,
  description_md = excluded.description_md,
  difficulty = excluded.difficulty,
  points = excluded.points,
  estimated_minutes = excluded.estimated_minutes,
  tags = excluded.tags,
  prerequisites = excluded.prerequisites,
  status = excluded.status,
  hints = excluded.hints;

-- web-claims-wrong-place
insert into public.challenges (
  id, category_id, slug, title, summary, description_md, difficulty,
  points, estimated_minutes, tags, prerequisites, status, hints
)
select
  'bfcf22e9-0adf-541f-ac33-c3b047fa632d'::uuid, category.id, 'web-claims-wrong-place', 'A Header Is Not a Role', 'Trace a multi-step authorization decision across a verified token, tenant path and client-controlled header.',
  'A fictional audit export endpoint has a tenant check and a role check. Review the code and the single captured request; the exercise is limited to this supplied program trace.

Evidence:
Handler:
  claims = verifySignedToken(request.token)
  if claims.tenant_id != request.path.tenant_id:
      deny(403)
  role = request.headers["x-role"] ?? claims.role
  if role == "admin":
      return exportAuditLog()
  deny(403)

Captured request:
  token.tenant_id = org-17
  token.role = analyst
  path.tenant_id = org-17
  X-Role = admin
  response = 200
  export_id = EX-9904

Your task:
Name the unsafe source used for the privileged role decision. Use the flag wrapper with the phrase shown by the vulnerable header name and trust failure.

Safety boundary:
Code-review exercise using fictional tokens and a fixed trace; no authentication bypass is performed against a real service.', 'expert', 500, 90,
  array['authorization','jwt','tenant-isolation','trust-boundary']::text[], array['JWT claims','Tenant isolation','Server-side authorization']::text[], 'published', '["The tenant comparison succeeds, so inspect the separate role decision.","A signed token is verified, but the code later reads another value from the request.","Headers are supplied by the requester and are not proof of privilege."]'::jsonb
from public.challenge_categories as category
where category.slug = 'web-exploitation'
on conflict (slug) do update set
  title = excluded.title,
  summary = excluded.summary,
  description_md = excluded.description_md,
  difficulty = excluded.difficulty,
  points = excluded.points,
  estimated_minutes = excluded.estimated_minutes,
  tags = excluded.tags,
  prerequisites = excluded.prerequisites,
  status = excluded.status,
  hints = excluded.hints;

-- crypto-shifted-archive
insert into public.challenges (
  id, category_id, slug, title, summary, description_md, difficulty,
  points, estimated_minutes, tags, prerequisites, status, hints
)
select
  '9ef76366-9a92-51c2-91dd-19e1444140c1'::uuid, category.id, 'crypto-shifted-archive', 'A Shift in the Archive', 'Decode a classical Caesar shift and explain why encoding is not encryption.',
  'An old archive note was shifted by a fixed number of alphabet positions. The braces and punctuation were left unchanged.

Evidence:
Ciphertext:
  JI{yvahapvu_pz_uva_zljbypaf}

Analyst note:
  Every alphabetic character was shifted forward by the same number of places. The shift is 7.

Your task:
Reverse the shift and submit the recovered flag exactly as written.

Safety boundary:
Offline puzzle; no real cryptographic material or credentials are used.', 'medium', 150, 35,
  array['caesar','classical-cryptography','encoding']::text[], array['Alphabet positions','Basic substitution ciphers']::text[], 'published', '["A forward shift of 7 must be reversed by shifting backward by 7.","Apply the shift to letters only; underscores and braces remain unchanged.","Check that the result begins with the platform''s CB{ prefix."]'::jsonb
from public.challenge_categories as category
where category.slug = 'cryptography'
on conflict (slug) do update set
  title = excluded.title,
  summary = excluded.summary,
  description_md = excluded.description_md,
  difficulty = excluded.difficulty,
  points = excluded.points,
  estimated_minutes = excluded.estimated_minutes,
  tags = excluded.tags,
  prerequisites = excluded.prerequisites,
  status = excluded.status,
  hints = excluded.hints;

-- crypto-reused-stream
insert into public.challenges (
  id, category_id, slug, title, summary, description_md, difficulty,
  points, estimated_minutes, tags, prerequisites, status, hints
)
select
  'fe34edea-b6b8-5cd1-be00-3a49317fec74'::uuid, category.id, 'crypto-reused-stream', 'The Reused Stream', 'Recover a repeating XOR keystream from a known plaintext and a reused ciphertext stream.',
  'A fictional telemetry service encrypted two messages with the same repeating XOR key. One plaintext is known because it was a fixed status template.

Evidence:
Known plaintext:
  status=ok;user=guest;id

Ciphertext of known plaintext (hex):
  383138553e36644e207e2c522e3764463e202a55702c3d

Second ciphertext (hex):
  0807224f2e333c5314373c54382006523f373c40263624

Both ciphertexts were encrypted with the same repeating key.

Your task:
Use the known plaintext and its ciphertext to recover the repeating key, then decrypt the second ciphertext. Submit the recovered message.

Safety boundary:
Offline byte exercise with synthetic data; no real encrypted traffic is supplied.', 'hard', 300, 65,
  array['xor','known-plaintext','stream-cipher']::text[], array['XOR operation','Hexadecimal bytes','Known-plaintext reasoning']::text[], 'published', '["For XOR, ciphertext XOR plaintext reveals the key byte at that position.","The key repeats, so bytes at positions separated by the key length share a key byte.","Apply the recovered repeating key to the second ciphertext."]'::jsonb
from public.challenge_categories as category
where category.slug = 'cryptography'
on conflict (slug) do update set
  title = excluded.title,
  summary = excluded.summary,
  description_md = excluded.description_md,
  difficulty = excluded.difficulty,
  points = excluded.points,
  estimated_minutes = excluded.estimated_minutes,
  tags = excluded.tags,
  prerequisites = excluded.prerequisites,
  status = excluded.status,
  hints = excluded.hints;

-- crypto-small-modulus
insert into public.challenges (
  id, category_id, slug, title, summary, description_md, difficulty,
  points, estimated_minutes, tags, prerequisites, status, hints
)
select
  'b9b9765f-8aac-503c-9a93-6c4b40a0563d'::uuid, category.id, 'crypto-small-modulus', 'The Small Modulus', 'Factor a deliberately tiny RSA modulus and recover an ASCII message block by block.',
  'A fictional legacy device used a tiny RSA modulus for a training-only message. Each character was encrypted as its ASCII integer using textbook RSA.

Evidence:
Public key:
  n = 11413
  e = 17

Ciphertext blocks (decimal, one ASCII character per block):
  6424, 6593, 1625, 2026, 2422, 5283, 10698, 10698, 6197, 1176,
  10706, 1861, 2026, 6197, 8234, 4521, 10706, 5283, 1176, 11216

Training constraint: n is intentionally small enough to factor with basic trial division.

Your task:
Factor n, calculate φ(n), find the modular inverse d of e, decrypt each block with m = c^d mod n, and join the resulting ASCII characters.

Safety boundary:
Small-number mathematics exercise; the key is intentionally insecure and is not used for real data.', 'expert', 500, 95,
  array['rsa','factorization','modular-arithmetic']::text[], array['Prime factorization','Euler''s totient','Modular inverses','RSA decryption']::text[], 'published', '["Search for the two prime factors of 11413; they are close to the square root.","Calculate φ(n) = (p − 1)(q − 1), then find d such that e·d ≡ 1 mod φ(n).","Decrypt each block separately and convert the result to its ASCII character."]'::jsonb
from public.challenge_categories as category
where category.slug = 'cryptography'
on conflict (slug) do update set
  title = excluded.title,
  summary = excluded.summary,
  description_md = excluded.description_md,
  difficulty = excluded.difficulty,
  points = excluded.points,
  estimated_minutes = excluded.estimated_minutes,
  tags = excluded.tags,
  prerequisites = excluded.prerequisites,
  status = excluded.status,
  hints = excluded.hints;

-- reverse-strings-static
insert into public.challenges (
  id, category_id, slug, title, summary, description_md, difficulty,
  points, estimated_minutes, tags, prerequisites, status, hints
)
select
  'acc2eb76-ff0f-5ef8-ab45-b9e613024a1f'::uuid, category.id, 'reverse-strings-static', 'Strings in the Static', 'Inspect a program''s embedded string and identify a simple representation layer.',
  'A fictional command-line utility prints a startup banner. A static string extractor found one encoded constant in its read-only data section.

Evidence:
Extracted constant:
  Q0J7c3RyaW5nc19hcmVfY2x1ZXN9

Disassembler note:
  The program calls a Base64 decoder before displaying this constant.

Your task:
Decode the constant from Base64 and submit the resulting string.

Safety boundary:
Static string puzzle only; no executable file is provided or run.', 'medium', 150, 35,
  array['static-analysis','base64','strings']::text[], array['Hexadecimal and Base64 basics','Strings in compiled programs']::text[], 'published', '["Base64 uses letters, numbers, + and /, with optional padding.","This is a representation change, not encryption.","Decode the complete constant as one Base64 value."]'::jsonb
from public.challenge_categories as category
where category.slug = 'reverse-engineering'
on conflict (slug) do update set
  title = excluded.title,
  summary = excluded.summary,
  description_md = excluded.description_md,
  difficulty = excluded.difficulty,
  points = excluded.points,
  estimated_minutes = excluded.estimated_minutes,
  tags = excluded.tags,
  prerequisites = excluded.prerequisites,
  status = excluded.status,
  hints = excluded.hints;

-- reverse-branch-table
insert into public.challenges (
  id, category_id, slug, title, summary, description_md, difficulty,
  points, estimated_minutes, tags, prerequisites, status, hints
)
select
  'ac25d654-53d5-5a2e-bb88-709afe5be461'::uuid, category.id, 'reverse-branch-table', 'The Branch Table', 'Reverse a simple byte transformation from a program''s loop and output buffer.',
  'A fictional checker transforms a candidate byte string before comparing it with an embedded constant. You have the loop and the transformed output, but not the original input.

Evidence:
Transformation loop:
  for i, b in enumerate(input):
      out[i] = ((b XOR 0x31) + 3*i) AND 0xff

Embedded output (hex):
  7276504c605666585a6f8c667d7b98807383958b958b

Your task:
Invert the operations in reverse order for every byte, then convert the recovered bytes to ASCII.

Safety boundary:
Offline pseudocode exercise; no binary or live target is involved.', 'hard', 300, 65,
  array['static-analysis','control-flow','byte-transform']::text[], array['XOR','Byte arithmetic','Reading simple pseudocode']::text[], 'published', '["Undo addition before undoing XOR.","Subtract 3*i from output[i] modulo 256.","XOR the result with 0x31 to recover the original byte."]'::jsonb
from public.challenge_categories as category
where category.slug = 'reverse-engineering'
on conflict (slug) do update set
  title = excluded.title,
  summary = excluded.summary,
  description_md = excluded.description_md,
  difficulty = excluded.difficulty,
  points = excluded.points,
  estimated_minutes = excluded.estimated_minutes,
  tags = excluded.tags,
  prerequisites = excluded.prerequisites,
  status = excluded.status,
  hints = excluded.hints;

-- reverse-opcode-breadcrumbs
insert into public.challenges (
  id, category_id, slug, title, summary, description_md, difficulty,
  points, estimated_minutes, tags, prerequisites, status, hints
)
select
  '0481b38d-d938-5fd2-a436-b6417c62a7a1'::uuid, category.id, 'reverse-opcode-breadcrumbs', 'Opcode Breadcrumbs', 'Reverse a composed byte transformation using XOR, rotation and index-dependent arithmetic.',
  'A fictional embedded checker uses a small transformation routine before comparing its input. The key and operation order are visible in a decompiler note.

Evidence:
Routine:
  x = (byte + 7*i) mod 256
  x = ROL8(x, 3)
  out[i] = x XOR key[i mod 4]

Key bytes:
  13 37 A5 5C

Output bytes (hex):
  097de9106713c9e8afaad0c98e49030ae56082fbe4371d

Your task:
For each byte, XOR with the repeating key, rotate right by 3 bits, subtract 7*i modulo 256, and decode the recovered ASCII.

Safety boundary:
Offline byte-transformation puzzle only; no executable or system interaction is required.', 'expert', 500, 95,
  array['reverse-engineering','bitwise-operations','transform-analysis']::text[], array['Bitwise XOR','8-bit rotate operations','Modular byte arithmetic']::text[], 'published', '["The last operation in the routine is XOR, so undo it first.","A left rotate by 3 is reversed by a right rotate by 3.","After rotation is undone, subtract the index contribution modulo 256."]'::jsonb
from public.challenge_categories as category
where category.slug = 'reverse-engineering'
on conflict (slug) do update set
  title = excluded.title,
  summary = excluded.summary,
  description_md = excluded.description_md,
  difficulty = excluded.difficulty,
  points = excluded.points,
  estimated_minutes = excluded.estimated_minutes,
  tags = excluded.tags,
  prerequisites = excluded.prerequisites,
  status = excluded.status,
  hints = excluded.hints;

-- pwn-stack-map
insert into public.challenges (
  id, category_id, slug, title, summary, description_md, difficulty,
  points, estimated_minutes, tags, prerequisites, status, hints
)
select
  '1f0f3d27-d9b8-5cea-bccc-07a29a57af73'::uuid, category.id, 'pwn-stack-map', 'The Stack Map', 'Read a simplified stack-frame layout and calculate the saved return-address offset.',
  'A training binary was compiled for a fictional 64-bit target. The debugger''s stack layout is supplied; no exploit needs to be executed.

Evidence:
Stack frame (addresses increase upward):
  buffer[32]       offsets 0–31
  saved RBP         offsets 32–39
  saved RIP         offsets 40–47

The input begins at offset 0 of buffer.

Your task:
How many bytes from the start of the buffer reach the first byte of saved RIP? Submit the decimal offset.

Safety boundary:
Static stack-layout exercise; no exploit payload is executed and no target binary is supplied.', 'medium', 150, 40,
  array['stack','memory-layout','buffer-overflow']::text[], array['Bytes and memory addresses','Stack frames','Saved frame pointer']::text[], 'published', '["The buffer occupies 32 bytes.","The saved frame pointer occupies the next 8 bytes.","Add both regions before the saved return address."]'::jsonb
from public.challenge_categories as category
where category.slug = 'binary-exploitation'
on conflict (slug) do update set
  title = excluded.title,
  summary = excluded.summary,
  description_md = excluded.description_md,
  difficulty = excluded.difficulty,
  points = excluded.points,
  estimated_minutes = excluded.estimated_minutes,
  tags = excluded.tags,
  prerequisites = excluded.prerequisites,
  status = excluded.status,
  hints = excluded.hints;

-- pwn-format-string-ledger
insert into public.challenges (
  id, category_id, slug, title, summary, description_md, difficulty,
  points, estimated_minutes, tags, prerequisites, status, hints
)
select
  'bec90394-c021-5457-bb64-a18697156c7b'::uuid, category.id, 'pwn-format-string-ledger', 'The Format-String Ledger', 'Reconstruct a leaked byte string from positional pointer values in a safe, synthetic trace.',
  'A fictional diagnostic program incorrectly treats user input as a format string. A sanitized debugger trace shows three positional values; the task is offline analysis only.

Evidence:
Sanitized output:
  %1$p -> 0x616d726f667b4243
  %2$p -> 0x676e697274735f74
  %3$p -> 0x00007d6b61656c5f

Target architecture: little-endian, 64-bit.

Your task:
Convert each 64-bit value to eight little-endian bytes, remove only trailing null bytes, concatenate in order and read the ASCII string.

Safety boundary:
Sanitized numeric trace only; no format-string payload is sent to a program.', 'hard', 300, 65,
  array['format-string','little-endian','memory-disclosure']::text[], array['Hexadecimal','Little-endian byte order','Format-string concept']::text[], 'published', '["A 64-bit value is eight bytes; write each byte from least significant to most significant.","Do not reverse the order of the three positional values.","Remove null terminators at the end of each displayed chunk, not printable characters."]'::jsonb
from public.challenge_categories as category
where category.slug = 'binary-exploitation'
on conflict (slug) do update set
  title = excluded.title,
  summary = excluded.summary,
  description_md = excluded.description_md,
  difficulty = excluded.difficulty,
  points = excluded.points,
  estimated_minutes = excluded.estimated_minutes,
  tags = excluded.tags,
  prerequisites = excluded.prerequisites,
  status = excluded.status,
  hints = excluded.hints;

-- pwn-heap-afterlife
insert into public.challenges (
  id, category_id, slug, title, summary, description_md, difficulty,
  points, estimated_minutes, tags, prerequisites, status, hints
)
select
  '9f792810-442f-56e9-8ab3-7019bb6e6e95'::uuid, category.id, 'pwn-heap-afterlife', 'Heap Afterlife', 'Trace a use-after-free caused by allocator reuse of a freed chunk.',
  'A fictional application stores references to heap objects. A debug allocator trace shows a freed chunk being reused by a later allocation of the same size class.

Evidence:
Trace:
  1. A = malloc(0x30) -> 0x55556000
  2. A->label = "PUBLIC"
  3. free(A)
  4. B = malloc(0x30) -> 0x55556000
  5. B->label = "ARCHIVE-REVIEW-27"
  6. legacy_view(A)->label -> "ARCHIVE-REVIEW-27"

The legacy_view reference was not cleared after free(A).

Your task:
Explain the lifetime error and submit the flag that names the memory-safety bug pattern.

Safety boundary:
Static allocator trace only; no heap corruption or executable exploit is performed.', 'expert', 500, 90,
  array['heap','use-after-free','memory-safety']::text[], array['Heap allocation and free','Pointers and object lifetime','Use-after-free']::text[], 'published', '["Compare the address returned for A and B.","The same chunk address is reused after A is freed.","The old reference still points to the reused chunk, so it now observes B''s label."]'::jsonb
from public.challenge_categories as category
where category.slug = 'binary-exploitation'
on conflict (slug) do update set
  title = excluded.title,
  summary = excluded.summary,
  description_md = excluded.description_md,
  difficulty = excluded.difficulty,
  points = excluded.points,
  estimated_minutes = excluded.estimated_minutes,
  tags = excluded.tags,
  prerequisites = excluded.prerequisites,
  status = excluded.status,
  hints = excluded.hints;

-- forensics-one-minute
insert into public.challenges (
  id, category_id, slug, title, summary, description_md, difficulty,
  points, estimated_minutes, tags, prerequisites, status, hints
)
select
  'ee663ae3-9d17-5496-b6ce-2f921de4e982'::uuid, category.id, 'forensics-one-minute', 'One Minute Missing', 'Build a short incident timeline from synthetic authentication logs.',
  'A fictional Linux training host reports an unusual login sequence. The log excerpt uses documentation-only IP addresses.

Evidence:
Nov 27 08:12:04 analyst-lab sshd: Failed password for invalid user admin from 192.0.2.44
Nov 27 08:12:11 analyst-lab sshd: Failed password for analyst from 192.0.2.44
Nov 27 08:12:19 analyst-lab sshd: Failed password for analyst from 192.0.2.44
Nov 27 08:14:02 analyst-lab sshd: Accepted publickey for analyst from 192.0.2.25

Your task:
Identify the source IP repeated across the failed attempts. Replace dots with underscores inside the CB{...} wrapper.

Safety boundary:
Synthetic log data only; 192.0.2.0/24 is reserved for documentation examples.', 'medium', 150, 35,
  array['linux-logs','timeline','incident-response']::text[], array['Log timestamps','IP address structure','Authentication events']::text[], 'published', '["Separate failed authentication events from the successful one.","Compare the source address on the three failed attempts.","The successful login uses a different address."]'::jsonb
from public.challenge_categories as category
where category.slug = 'forensics'
on conflict (slug) do update set
  title = excluded.title,
  summary = excluded.summary,
  description_md = excluded.description_md,
  difficulty = excluded.difficulty,
  points = excluded.points,
  estimated_minutes = excluded.estimated_minutes,
  tags = excluded.tags,
  prerequisites = excluded.prerequisites,
  status = excluded.status,
  hints = excluded.hints;

-- forensics-dns-breadcrumbs
insert into public.challenges (
  id, category_id, slug, title, summary, description_md, difficulty,
  points, estimated_minutes, tags, prerequisites, status, hints
)
select
  'ee1d5936-6306-5a67-8383-f7ffe64ae04c'::uuid, category.id, 'forensics-dns-breadcrumbs', 'DNS Breadcrumbs', 'Reassemble a Base32 data sequence from ordered synthetic DNS query labels.',
  'A fictional endpoint generated a burst of DNS queries to a training domain. The first label carries a sequence number and the remaining part carries encoded data.

Evidence:
DNS query labels (captured order is not guaranteed):
  03-gx3smvqxg4.exfil.lab.test
  01-inbhwzdoon.exfil.lab.test
  05-pu.exfil.lab.test
  02-pwg2dvnzvx.exfil.lab.test
  04-3fnvrgyzle.exfil.lab.test

Encoding: Base32, uppercase alphabet; padding omitted.

Your task:
Sort the fragments by their two-digit sequence number, remove each sequence prefix, concatenate the payload labels and Base32-decode the result.

Safety boundary:
Synthetic DNS names under the reserved training domain; no DNS lookups are required.', 'hard', 300, 65,
  array['dns','network-forensics','base32','exfiltration-detection']::text[], array['DNS query structure','Base32 encoding','Evidence ordering']::text[], 'published', '["The numeric prefix defines the fragment order.","Remove the prefix and separators before concatenating the payload.","Base32 padding may be omitted; restore it if your decoder requires it."]'::jsonb
from public.challenge_categories as category
where category.slug = 'forensics'
on conflict (slug) do update set
  title = excluded.title,
  summary = excluded.summary,
  description_md = excluded.description_md,
  difficulty = excluded.difficulty,
  points = excluded.points,
  estimated_minutes = excluded.estimated_minutes,
  tags = excluded.tags,
  prerequisites = excluded.prerequisites,
  status = excluded.status,
  hints = excluded.hints;

-- forensics-carved-header
insert into public.challenges (
  id, category_id, slug, title, summary, description_md, difficulty,
  points, estimated_minutes, tags, prerequisites, status, hints
)
select
  '6f6286c1-fe87-5621-827f-941d97e7eedb'::uuid, category.id, 'forensics-carved-header', 'Carved from Unallocated Space', 'Recover a deleted training artifact from a supplied hexadecimal byte sequence.',
  'A fictional disk image contains a deleted text artifact in unallocated space. The examiner has already established fragment order and extracted the bytes.

Evidence:
Fragment order from the allocation map:
  extent-02 -> 7b6361727665645f66726f6d5f
  extent-01 -> 4342
  extent-03 -> 756e616c6c6f63617465647d

All values are hexadecimal bytes. The fragments are intentionally listed out of order.

Your task:
Reorder the extents 01, 02, 03, concatenate their hex bytes, convert to ASCII and submit the recovered content.

Safety boundary:
Synthetic byte fragments only; no disk image or real user data is involved.', 'expert', 500, 90,
  array['file-carving','hexadecimal','disk-forensics']::text[], array['Hexadecimal bytes','File carving concepts','Evidence integrity']::text[], 'published', '["The allocation map gives the order, not the order in which the excerpts are displayed.","Concatenate the hex values before decoding.","Two hexadecimal characters represent one byte."]'::jsonb
from public.challenge_categories as category
where category.slug = 'forensics'
on conflict (slug) do update set
  title = excluded.title,
  summary = excluded.summary,
  description_md = excluded.description_md,
  difficulty = excluded.difficulty,
  points = excluded.points,
  estimated_minutes = excluded.estimated_minutes,
  tags = excluded.tags,
  prerequisites = excluded.prerequisites,
  status = excluded.status,
  hints = excluded.hints;

-- osint-poster-pier-nine
insert into public.challenges (
  id, category_id, slug, title, summary, description_md, difficulty,
  points, estimated_minutes, tags, prerequisites, status, hints
)
select
  'bfc2d4ab-3250-5979-afc2-73798db87d4d'::uuid, category.id, 'osint-poster-pier-nine', 'The Poster at Pier Nine', 'Correlate clues from fictional public event material without investigating a real person.',
  'A fictional city tourism office asks you to verify the venue printed on an old event poster. Every organization, venue and record in this exercise is invented.

Evidence:
Poster text:
  NORTHPORT COMMUNITY TECHNOLOGY FAIR
  Saturday · 14:00–18:00
  Waterfront district · Hall beside the old ferry clock

Archived city notice:
  The public event hall beside the old ferry clock is listed in the municipal venue index as Pier 9.

City: Northport (fictional).

Your task:
Combine the poster''s waterfront clue with the archived municipal notice. Submit the city and venue number in the flag wrapper, using underscores.

Safety boundary:
All people, places and records are fictional. Do not apply this workflow to identify or locate private individuals.', 'medium', 150, 40,
  array['osint','source-verification','fictional-investigation']::text[], array['Source verification','Cross-referencing public records','Ethical OSINT']::text[], 'published', '["The poster gives a landmark, not the formal venue name.","Use the archived municipal notice to map the landmark to the venue index.","The city name and venue number form the requested value."]'::jsonb
from public.challenge_categories as category
where category.slug = 'osint-misc'
on conflict (slug) do update set
  title = excluded.title,
  summary = excluded.summary,
  description_md = excluded.description_md,
  difficulty = excluded.difficulty,
  points = excluded.points,
  estimated_minutes = excluded.estimated_minutes,
  tags = excluded.tags,
  prerequisites = excluded.prerequisites,
  status = excluded.status,
  hints = excluded.hints;

-- osint-three-mirrors
insert into public.challenges (
  id, category_id, slug, title, summary, description_md, difficulty,
  points, estimated_minutes, tags, prerequisites, status, hints
)
select
  '8e3bda1f-fff5-5c55-b3a0-92d441c0e916'::uuid, category.id, 'osint-three-mirrors', 'The Three Mirrors', 'Correlate three fictional public records to identify a shared software build identifier.',
  'A fictional open-source project has inconsistent release labels across three public pages. Your task is to identify the stable build identifier, not to attribute activity to a person.

Evidence:
Archive snapshot:
  /releases/2026-11-20 -> build_id = bld-7e91

Status page:
  deployment = green
  artifact_ref = bld-7e91

Public release note:
  release channel = stable
  build identifier = bld-7e91
  display version = 2.4.0

Your task:
Identify the stable build identifier that appears in all three records. Submit it inside CB{...}.

Safety boundary:
Fictional project records only; no real domains, maintainers or accounts are investigated.', 'hard', 300, 65,
  array['osint','metadata-correlation','verification']::text[], array['Source correlation','Identifiers versus display labels','Evidence provenance']::text[], 'published', '["Do not assume the human-readable version is the unique artifact identifier.","Compare the identifier fields across all three sources.","The repeated value is the strongest cross-source match."]'::jsonb
from public.challenge_categories as category
where category.slug = 'osint-misc'
on conflict (slug) do update set
  title = excluded.title,
  summary = excluded.summary,
  description_md = excluded.description_md,
  difficulty = excluded.difficulty,
  points = excluded.points,
  estimated_minutes = excluded.estimated_minutes,
  tags = excluded.tags,
  prerequisites = excluded.prerequisites,
  status = excluded.status,
  hints = excluded.hints;

-- osint-signal-without-person
insert into public.challenges (
  id, category_id, slug, title, summary, description_md, difficulty,
  points, estimated_minutes, tags, prerequisites, status, hints
)
select
  '095c4415-dd2b-5dc9-a9ef-02c926ae04ec'::uuid, category.id, 'osint-signal-without-person', 'Signal Without a Person', 'Correlate synthetic infrastructure metadata while deliberately avoiding personal attribution.',
  'A fictional service owner wants to know which internal archive generated a test deployment. The evidence contains infrastructure metadata only; personal attribution is explicitly out of scope.

Evidence:
Build manifest:
  archive_region = east-archive
  package_digest = sha256:7f91...c204

Status event:
  package_digest = sha256:7f91...c204
  ready_at = 04:17 UTC

Mirror index:
  package_digest = sha256:7f91...c204
  source_region = east-archive

The digest is the same in all three records.

Your task:
Correlate the matching package digest, then combine the source region and ready time. Replace the hyphen and colon with underscores inside CB{...}.

Safety boundary:
Synthetic infrastructure metadata only. The challenge forbids identifying or profiling real people.', 'expert', 500, 90,
  array['osint','infrastructure-metadata','privacy']::text[], array['Evidence correlation','Timestamp normalization','Privacy-preserving OSINT']::text[], 'published', '["The package digest is the join key across the three records.","Use the region from the manifest/mirror index, not a guessed geographic location.","Use the UTC ready_at time exactly as shown."]'::jsonb
from public.challenge_categories as category
where category.slug = 'osint-misc'
on conflict (slug) do update set
  title = excluded.title,
  summary = excluded.summary,
  description_md = excluded.description_md,
  difficulty = excluded.difficulty,
  points = excluded.points,
  estimated_minutes = excluded.estimated_minutes,
  tags = excluded.tags,
  prerequisites = excluded.prerequisites,
  status = excluded.status,
  hints = excluded.hints;

