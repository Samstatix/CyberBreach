-- Idempotent seed for the six agreed CTF disciplines.
-- These are category records only; no challenge is published until its lab,
-- solve path, hints, flag digest and safety review are complete.

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

insert into public.challenge_secrets (challenge_id, release_version, flag_hash, is_active)
select id, 1, '4900ca35ae0284618395c8e60837b10109068e9b510bda82fb3f9cb350e74c73', true from public.challenges where slug = 'web-broken-badge'
on conflict (challenge_id, release_version) do update set flag_hash = excluded.flag_hash, is_active = true;

insert into public.challenge_solutions (challenge_id, walkthrough_md, defensive_notes_md, reflection_question)
select id, 'The active session belongs to learner-17. Record 5101 belongs to that user, while record 5102 belongs to learner-44 but is still returned with HTTP 200. Record 5103 is correctly denied. The broken object-level authorization is therefore on record 5102. The accepted flag identifies that record.', 'Authorize every object access against the authenticated principal and the object''s tenant/owner on the server. Do not rely on unpredictable IDs or on the fact that a user has logged in. Add tests that attempt cross-user reads and writes.', 'Why is authentication alone insufficient to protect an API resource?'
from public.challenges where slug = 'web-broken-badge'
on conflict (challenge_id) do update set
  walkthrough_md = excluded.walkthrough_md,
  defensive_notes_md = excluded.defensive_notes_md,
  reflection_question = excluded.reflection_question;


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

insert into public.challenge_secrets (challenge_id, release_version, flag_hash, is_active)
select id, 1, 'a5f2c85c4272e9aa6e4d03ef7194f433d8f97d0eee55e1cbc4e85a51ec1b34a7', true from public.challenges where slug = 'web-redirect-boundary'
on conflict (challenge_id, release_version) do update set flag_hash = excluded.flag_hash, is_active = true;

insert into public.challenge_solutions (challenge_id, walkthrough_md, defensive_notes_md, reflection_question)
select id, 'The prefix check sees the trusted text at the start and accepts the string. In URL syntax, however, the text before @ is user information. The parser identifies 127.0.0.1 as the hostname and 8443 as the port. The flag encodes those two parsed fields.', 'Parse the URL with a standards-compliant parser, reject user information, compare the normalized origin against an exact allow-list, and validate the resolved destination at connection time. Do not use startsWith or substring checks for URL trust decisions.', 'What should an allow-list compare: the raw URL string or the normalized origin?'
from public.challenges where slug = 'web-redirect-boundary'
on conflict (challenge_id) do update set
  walkthrough_md = excluded.walkthrough_md,
  defensive_notes_md = excluded.defensive_notes_md,
  reflection_question = excluded.reflection_question;


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

insert into public.challenge_secrets (challenge_id, release_version, flag_hash, is_active)
select id, 1, 'fd6ee019888cbccffe1f6108245ea2c1fd230460f6ea0f7df34ded9fdef0821f', true from public.challenges where slug = 'web-claims-wrong-place'
on conflict (challenge_id, release_version) do update set flag_hash = excluded.flag_hash, is_active = true;

insert into public.challenge_solutions (challenge_id, walkthrough_md, defensive_notes_md, reflection_question)
select id, 'The signed token says the user is an analyst and belongs to org-17. The path also requests org-17, so the tenant check passes. The role check then prefers the X-Role request header, which the caller controls, over the verified role claim. The request therefore supplies its own administrative role. The vulnerability is trusting a role header.', 'Derive roles only from verified server-side identity and authorization data. Ignore client-supplied privilege headers, enforce tenant and object ownership checks independently, and add negative tests for forged role headers.', 'Why should tenant membership and privileged role checks be separate authorization decisions?'
from public.challenges where slug = 'web-claims-wrong-place'
on conflict (challenge_id) do update set
  walkthrough_md = excluded.walkthrough_md,
  defensive_notes_md = excluded.defensive_notes_md,
  reflection_question = excluded.reflection_question;


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

insert into public.challenge_secrets (challenge_id, release_version, flag_hash, is_active)
select id, 1, 'da831f3e6f410b438312a45c2c1c80eb04cac4bae37221f8e1892603ed0d9478', true from public.challenges where slug = 'crypto-shifted-archive'
on conflict (challenge_id, release_version) do update set flag_hash = excluded.flag_hash, is_active = true;

insert into public.challenge_solutions (challenge_id, walkthrough_md, defensive_notes_md, reflection_question)
select id, 'A Caesar cipher moves each letter by a fixed number of alphabet positions. The note says the ciphertext was shifted forward by seven, so reverse it by moving each letter backward by seven. Keep punctuation and underscores unchanged. The decoded text is the flag.', 'A Caesar shift has only 26 possible keys and provides no meaningful confidentiality. Use modern, vetted authenticated encryption rather than substitution or encoding schemes.', 'What is the difference between encoding, obfuscation and encryption?'
from public.challenges where slug = 'crypto-shifted-archive'
on conflict (challenge_id) do update set
  walkthrough_md = excluded.walkthrough_md,
  defensive_notes_md = excluded.defensive_notes_md,
  reflection_question = excluded.reflection_question;


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

insert into public.challenge_secrets (challenge_id, release_version, flag_hash, is_active)
select id, 1, 'ed9968c5d9eb412b3975d3ea63bc8b378d588d9613812d0f89c8a543d7872428', true from public.challenges where slug = 'crypto-reused-stream'
on conflict (challenge_id, release_version) do update set flag_hash = excluded.flag_hash, is_active = true;

insert into public.challenge_solutions (challenge_id, walkthrough_md, defensive_notes_md, reflection_question)
select id, 'XOR the known plaintext bytes with the first ciphertext bytes to recover the keystream. The service repeats a short key, so the recovered bytes reveal the repeating pattern. XOR the second ciphertext with that same pattern to recover the flag. The weakness is key-stream reuse.', 'Never reuse a stream-cipher key/nonce pair. Prefer a modern authenticated-encryption construction such as AES-GCM or ChaCha20-Poly1305 with unique nonces, and enforce nonce uniqueness in the application.', 'Why does reusing a stream keystream allow information from one plaintext to help recover another?'
from public.challenges where slug = 'crypto-reused-stream'
on conflict (challenge_id) do update set
  walkthrough_md = excluded.walkthrough_md,
  defensive_notes_md = excluded.defensive_notes_md,
  reflection_question = excluded.reflection_question;


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

insert into public.challenge_secrets (challenge_id, release_version, flag_hash, is_active)
select id, 1, '9e9b23652394e407ca509561774644c6ff7f40d04fdfa5812b54013955a603b2', true from public.challenges where slug = 'crypto-small-modulus'
on conflict (challenge_id, release_version) do update set flag_hash = excluded.flag_hash, is_active = true;

insert into public.challenge_solutions (challenge_id, walkthrough_md, defensive_notes_md, reflection_question)
select id, 'The modulus factors into p = 101 and q = 113. Therefore φ(n) = 100 × 112 = 11200. The modular inverse of 17 modulo 11200 is d = 3953. Raise each ciphertext block to d modulo n, convert the resulting integers to ASCII and concatenate the characters. The recovered string is the flag.', 'RSA requires appropriately large keys and secure padding. Textbook RSA on raw small integers is deterministic and vulnerable to factoring and structural attacks. Use vetted libraries, modern key sizes and OAEP padding.', 'Why is a large RSA modulus necessary, and why is padding still required when the modulus is large?'
from public.challenges where slug = 'crypto-small-modulus'
on conflict (challenge_id) do update set
  walkthrough_md = excluded.walkthrough_md,
  defensive_notes_md = excluded.defensive_notes_md,
  reflection_question = excluded.reflection_question;


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

insert into public.challenge_secrets (challenge_id, release_version, flag_hash, is_active)
select id, 1, '358cbbd4b1c30c3f3bf6a174bf1169d9e22b5d19e620c2402426ad37de8eb530', true from public.challenges where slug = 'reverse-strings-static'
on conflict (challenge_id, release_version) do update set flag_hash = excluded.flag_hash, is_active = true;

insert into public.challenge_solutions (challenge_id, walkthrough_md, defensive_notes_md, reflection_question)
select id, 'The extracted constant is Base64. Decode it as a single value; the result is readable ASCII and begins with CB{. The program was not encrypting the message, only encoding it for storage.', 'Do not treat Base64 or other encodings as a security control. Avoid embedding secrets in client binaries or public executable resources.', 'Why can strings and encoded constants be useful during static analysis?'
from public.challenges where slug = 'reverse-strings-static'
on conflict (challenge_id) do update set
  walkthrough_md = excluded.walkthrough_md,
  defensive_notes_md = excluded.defensive_notes_md,
  reflection_question = excluded.reflection_question;


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

insert into public.challenge_secrets (challenge_id, release_version, flag_hash, is_active)
select id, 1, '40e64495ae22d7e3e23364085d43c68fdec8dfd14bc7002419ec857de6f65b01', true from public.challenges where slug = 'reverse-branch-table'
on conflict (challenge_id, release_version) do update set flag_hash = excluded.flag_hash, is_active = true;

insert into public.challenge_solutions (challenge_id, walkthrough_md, defensive_notes_md, reflection_question)
select id, 'The transformation first XORs each input byte with 0x31, then adds three times the byte index modulo 256. To reverse it, subtract 3*i modulo 256 from each output byte, then XOR with 0x31. Convert the recovered byte sequence to ASCII to obtain the flag.', 'Obfuscation is not a reliable protection for secrets. Keep signing keys, credentials and sensitive authorization data out of distributed binaries; validate security decisions on a trusted server.', 'Why must a reversible transformation be undone in the opposite order from which it was applied?'
from public.challenges where slug = 'reverse-branch-table'
on conflict (challenge_id) do update set
  walkthrough_md = excluded.walkthrough_md,
  defensive_notes_md = excluded.defensive_notes_md,
  reflection_question = excluded.reflection_question;


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

insert into public.challenge_secrets (challenge_id, release_version, flag_hash, is_active)
select id, 1, 'c15ef6d6704733f41708fd4d66e3a9bec43a3e30c8f2ffe49575f0d1ecd44c44', true from public.challenges where slug = 'reverse-opcode-breadcrumbs'
on conflict (challenge_id, release_version) do update set flag_hash = excluded.flag_hash, is_active = true;

insert into public.challenge_solutions (challenge_id, walkthrough_md, defensive_notes_md, reflection_question)
select id, 'The routine applies three operations in order: add 7*i, rotate left by three, then XOR with a repeating four-byte key. Reverse them in the opposite order: XOR with the key byte, rotate right by three, then subtract 7*i modulo 256. The recovered ASCII sequence is the flag.', 'Do not rely on custom obfuscation to protect secrets or enforce access. Use standard cryptographic primitives for confidentiality and keep trust decisions outside distributed clients.', 'What information would you need if the key bytes were not included in the decompiler note?'
from public.challenges where slug = 'reverse-opcode-breadcrumbs'
on conflict (challenge_id) do update set
  walkthrough_md = excluded.walkthrough_md,
  defensive_notes_md = excluded.defensive_notes_md,
  reflection_question = excluded.reflection_question;


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

insert into public.challenge_secrets (challenge_id, release_version, flag_hash, is_active)
select id, 1, 'e0489b0619a4cb0b6c4824c61a518cd84c187749c4505eff59e5e4cb2e6de211', true from public.challenges where slug = 'pwn-stack-map'
on conflict (challenge_id, release_version) do update set flag_hash = excluded.flag_hash, is_active = true;

insert into public.challenge_solutions (challenge_id, walkthrough_md, defensive_notes_md, reflection_question)
select id, 'The buffer occupies offsets 0 through 31, which is 32 bytes. The saved RBP occupies the next eight bytes, offsets 32 through 39. Saved RIP therefore begins at offset 40. The exercise is about reading a memory layout, not executing an overwrite.', 'Use bounds-checked input handling and memory-safe languages where practical. Compiler stack canaries, ASLR, PIE and non-executable memory add defense in depth but do not replace fixing the underlying memory error.', 'Why should a developer fix the out-of-bounds write instead of relying only on stack canaries?'
from public.challenges where slug = 'pwn-stack-map'
on conflict (challenge_id) do update set
  walkthrough_md = excluded.walkthrough_md,
  defensive_notes_md = excluded.defensive_notes_md,
  reflection_question = excluded.reflection_question;


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
  %3$p -> 0x0000007d6b61656c

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

insert into public.challenge_secrets (challenge_id, release_version, flag_hash, is_active)
select id, 1, '2d69637591757bc42fc8d6b066d223e7c7e14b4742d81e0de78a431d82c87657', true from public.challenges where slug = 'pwn-format-string-ledger'
on conflict (challenge_id, release_version) do update set flag_hash = excluded.flag_hash, is_active = true;

insert into public.challenge_solutions (challenge_id, walkthrough_md, defensive_notes_md, reflection_question)
select id, 'Each pointer value represents eight bytes in little-endian order. Convert the first value to bytes, then the second, then the third. Remove trailing null bytes from the final chunk and concatenate the printable ASCII. The result is the flag.', 'Use constant format strings such as printf("%s", user_input) rather than passing untrusted input as the format argument. Treat compiler warnings and format-security checks as release blockers.', 'Why can a format-string bug disclose memory even when the program never writes outside a buffer?'
from public.challenges where slug = 'pwn-format-string-ledger'
on conflict (challenge_id) do update set
  walkthrough_md = excluded.walkthrough_md,
  defensive_notes_md = excluded.defensive_notes_md,
  reflection_question = excluded.reflection_question;


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
  5. B->label = "CB{stale_pointer_reuse}"
  6. legacy_view(A)->label -> "CB{stale_pointer_reuse}"

The legacy_view reference was not cleared after free(A).

Your task:
Explain the lifetime error and submit the string observed through the stale reference.

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

insert into public.challenge_secrets (challenge_id, release_version, flag_hash, is_active)
select id, 1, '0c8502d77050389721c1dd77d1e41ae36b1ed51c5439fbc23d5235f4cc97c59f', true from public.challenges where slug = 'pwn-heap-afterlife'
on conflict (challenge_id, release_version) do update set flag_hash = excluded.flag_hash, is_active = true;

insert into public.challenge_solutions (challenge_id, walkthrough_md, defensive_notes_md, reflection_question)
select id, 'A and B receive the same address because the allocator reuses the freed chunk. The legacy reference A was not invalidated, so reading through it after B is allocated observes B''s label. This is a use-after-free caused by an object-lifetime error. The observed label is the flag.', 'Use clear ownership and lifetime rules, invalidate references after free, prefer memory-safe abstractions, and test with sanitizers such as AddressSanitizer. Avoid retaining aliases to released objects.', 'What design change would prevent the old A reference from being used after the object is released?'
from public.challenges where slug = 'pwn-heap-afterlife'
on conflict (challenge_id) do update set
  walkthrough_md = excluded.walkthrough_md,
  defensive_notes_md = excluded.defensive_notes_md,
  reflection_question = excluded.reflection_question;


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

insert into public.challenge_secrets (challenge_id, release_version, flag_hash, is_active)
select id, 1, '04585328d33de3925cec0d6b4f7270ca180ca261df4030395832da6b772cc27a', true from public.challenges where slug = 'forensics-one-minute'
on conflict (challenge_id, release_version) do update set flag_hash = excluded.flag_hash, is_active = true;

insert into public.challenge_solutions (challenge_id, walkthrough_md, defensive_notes_md, reflection_question)
select id, 'The first three entries are failed SSH authentication attempts and all originate from 192.0.2.44. The final successful public-key login originates from 192.0.2.25 and is not part of the repeated failed sequence. Replace the dots in the repeated address with underscores to form the flag.', 'Centralize authentication logs, alert on repeated failures, use rate limiting and MFA, and investigate whether successful activity follows suspicious attempts. Preserve timestamps and time-zone context.', 'Why should investigators distinguish a failed login burst from a later successful login?'
from public.challenges where slug = 'forensics-one-minute'
on conflict (challenge_id) do update set
  walkthrough_md = excluded.walkthrough_md,
  defensive_notes_md = excluded.defensive_notes_md,
  reflection_question = excluded.reflection_question;


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

insert into public.challenge_secrets (challenge_id, release_version, flag_hash, is_active)
select id, 1, '6a3bc9cce8567bfc032c418ab15b9b4381621c5d33cd68ca46a8dbedeff938f8', true from public.challenges where slug = 'forensics-dns-breadcrumbs'
on conflict (challenge_id, release_version) do update set flag_hash = excluded.flag_hash, is_active = true;

insert into public.challenge_solutions (challenge_id, walkthrough_md, defensive_notes_md, reflection_question)
select id, 'Sort the fragments 01 through 05. Remove the sequence prefixes and join the payloads in order to obtain the Base32 string. Restore padding only if required by the decoder, then decode it as UTF-8. The recovered text is the flag.', 'Monitor unusual DNS label length, entropy, query volume and newly observed domains. Apply egress controls, DNS logging and data-loss prevention appropriate to the environment.', 'Which DNS telemetry fields would help distinguish normal lookups from encoded data transfer?'
from public.challenges where slug = 'forensics-dns-breadcrumbs'
on conflict (challenge_id) do update set
  walkthrough_md = excluded.walkthrough_md,
  defensive_notes_md = excluded.defensive_notes_md,
  reflection_question = excluded.reflection_question;


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

insert into public.challenge_secrets (challenge_id, release_version, flag_hash, is_active)
select id, 1, 'f646275429116e9b222188a58bd1bfa1692815243eb43b207689876a5893eb67', true from public.challenges where slug = 'forensics-carved-header'
on conflict (challenge_id, release_version) do update set flag_hash = excluded.flag_hash, is_active = true;

insert into public.challenge_solutions (challenge_id, walkthrough_md, defensive_notes_md, reflection_question)
select id, 'The correct order is extent-01, extent-02, extent-03. Concatenate the hex bytes in that order and decode them as ASCII. The result is the recovered deleted text and the flag.', 'Preserve the original evidence, work from verified forensic copies, document hashes and chain of custody, and avoid writing to the source media during acquisition.', 'Why should a forensic analyst hash evidence before and after analysis?'
from public.challenges where slug = 'forensics-carved-header'
on conflict (challenge_id) do update set
  walkthrough_md = excluded.walkthrough_md,
  defensive_notes_md = excluded.defensive_notes_md,
  reflection_question = excluded.reflection_question;


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

insert into public.challenge_secrets (challenge_id, release_version, flag_hash, is_active)
select id, 1, '1029d051d5ac3b6f77c01c691eb3c127dee1b366238e1d6668587552667475c5', true from public.challenges where slug = 'osint-poster-pier-nine'
on conflict (challenge_id, release_version) do update set flag_hash = excluded.flag_hash, is_active = true;

insert into public.challenge_solutions (challenge_id, walkthrough_md, defensive_notes_md, reflection_question)
select id, 'The poster places the event beside the old ferry clock in Northport''s waterfront district. The archived municipal notice maps that landmark to Pier 9. Combining the fictional city and venue number produces the flag.', 'Verify claims with independent sources, record provenance and timestamps, minimize collection of personal information, and stop when a task would expose a private individual.', 'What makes a source independent enough to strengthen an OSINT conclusion?'
from public.challenges where slug = 'osint-poster-pier-nine'
on conflict (challenge_id) do update set
  walkthrough_md = excluded.walkthrough_md,
  defensive_notes_md = excluded.defensive_notes_md,
  reflection_question = excluded.reflection_question;


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

insert into public.challenge_secrets (challenge_id, release_version, flag_hash, is_active)
select id, 1, '8c60aec7386878d0d30ad14cc5dc0ba03423471c1a399729fd67a59f0c560b78', true from public.challenges where slug = 'osint-three-mirrors'
on conflict (challenge_id, release_version) do update set flag_hash = excluded.flag_hash, is_active = true;

insert into public.challenge_solutions (challenge_id, walkthrough_md, defensive_notes_md, reflection_question)
select id, 'The archive snapshot, status page and release note all contain the same artifact reference: bld-7e91. The display version 2.4.0 is not the stable build identifier. The repeated build ID is the flag.', 'Use immutable artifact digests or signed provenance for software releases. Display versions are useful labels but should not replace cryptographic artifact identity.', 'Why is a build identifier more useful than a display version when correlating deployments?'
from public.challenges where slug = 'osint-three-mirrors'
on conflict (challenge_id) do update set
  walkthrough_md = excluded.walkthrough_md,
  defensive_notes_md = excluded.defensive_notes_md,
  reflection_question = excluded.reflection_question;


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

insert into public.challenge_secrets (challenge_id, release_version, flag_hash, is_active)
select id, 1, 'a8de2445958d3d8f59ad826c13f49dae2a284ee16117dbea7c92b7a44962a7b0', true from public.challenges where slug = 'osint-signal-without-person'
on conflict (challenge_id, release_version) do update set flag_hash = excluded.flag_hash, is_active = true;

insert into public.challenge_solutions (challenge_id, walkthrough_md, defensive_notes_md, reflection_question)
select id, 'The matching digest confirms that all three records describe the same package. The manifest and mirror index agree on east-archive, and the status event gives 04:17 UTC. Combining those two fields with underscores produces the flag. No personal attribution is necessary.', 'Limit build metadata exposure where it creates risk, sign release manifests, normalize timestamps and document the join keys used in an investigation. Keep infrastructure analysis separate from personal attribution.', 'How can an investigator answer an infrastructure question while minimizing collection of personal data?'
from public.challenges where slug = 'osint-signal-without-person'
on conflict (challenge_id) do update set
  walkthrough_md = excluded.walkthrough_md,
  defensive_notes_md = excluded.defensive_notes_md,
  reflection_question = excluded.reflection_question;
