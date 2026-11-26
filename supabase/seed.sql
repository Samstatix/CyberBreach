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
