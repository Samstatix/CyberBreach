# CyberBreach Learning and Challenge Standard

**Applies to:** Cyber Academy, Operations, CTF Arena, Cyber Labs and AI Security Research  
**Status:** Product standard for content authors

## 1. The promise

Make the explanation easy to follow, but do not make the skill artificially easy. A learner should be able to understand the lesson in plain language and still face a demanding assessment that requires independent reasoning.

Never call a learner dumb. Assume no prior knowledge unless the course explicitly lists prerequisites.

## 2. Learning unit structure

Every course module should use this repeatable sequence:

1. **Why this matters** — one short real-world scenario that explains the purpose.
2. **Plain-language explanation** — define the idea using familiar words and one analogy where helpful.
3. **Correct technical terms** — introduce the professional vocabulary after the learner understands the basic idea.
4. **How it works** — show the process step by step, with diagrams or small examples.
5. **See it happen** — demonstrate a safe, reproducible example with expected output.
6. **Guided practice** — learner follows a worked example with checkpoints.
7. **Independent practice** — learner solves a new problem without step-by-step instructions.
8. **Knowledge check** — short questions that test understanding, not memorization.
9. **Challenge bridge** — explain which skills are needed for the related medium/hard CTF.
10. **Recap and glossary** — concise summary and definitions of unfamiliar terms.

Use short paragraphs, meaningful headings, annotated screenshots/diagrams, command explanations and expected outputs. Explain what a command does, why it is used, what a normal result looks like, and what a suspicious result might mean. Never present a command as magic.

## 3. Challenge difficulty policy

Difficulty describes the reasoning and independence required, not how obscure the flag is.

- **Medium:** combines multiple taught concepts; clear scope; requires investigation and a few logical steps; minimal hand-holding.
- **Hard:** requires chaining techniques, interpreting imperfect evidence, choosing tools and adapting when an initial path fails.
- **Expert:** open-ended, multi-stage and realistic; requires independent hypothesis formation, tool selection, careful validation and often more than one viable route.

The platform may offer an introductory guided exercise before a category's first medium challenge. Do not label a trivial quiz as a medium CTF.

Every challenge must have an internal author rubric: intended learning outcomes, prerequisites, environment, solve path, alternative valid paths, flag validation, hints, expected time range, difficulty rationale, reset behavior and safety constraints.

## 4. Hint and solution ladder

Hints should be progressive and should preserve the learning value:

- Hint 1 — point to the relevant concept or evidence source.
- Hint 2 — narrow the search space or suggest a class of tool/technique.
- Hint 3 — provide a concrete next step without giving the final answer.
- Full walkthrough — explain the reasoning, commands, output interpretation, mistakes and remediation.

If hints affect points, show the penalty before the learner reveals the hint. Full solutions should be available after completion or under a clearly disclosed learning setting.

## 5. Post-challenge learning

After a challenge, explain:
- What the objective tested.
- Which clues mattered and why.
- The intended reasoning chain.
- Common wrong turns and why they fail.
- A defensive or remediation perspective.
- What to learn next.

A successful flag submission alone is not proof of understanding. Add a short reflection or follow-up question for important skills.

## 6. Assessment and progression

- Teach concepts before expecting them in a scored challenge.
- Use prerequisite tags and recommend a lesson when a learner repeatedly struggles.
- Do not block exploration unnecessarily; explain prerequisites and let users choose.
- Award points for verified challenge completion, not repeated guessing.
- Keep XP and scoring server-authoritative.
- Track learning progress separately from competitive rank.
- Use separate practice and competition modes so learners can explore without damaging event standings.

## 7. CTF Arena taxonomy

Keep the six agreed top-level categories:

1. Web Exploitation
2. Cryptography
3. Reverse Engineering
4. Binary Exploitation (Pwn)
5. Forensics and Network Forensics
6. OSINT & Misc

Use subcategory tags and skill prerequisites beneath these. AI security challenges can be cross-tagged into relevant categories and surfaced in the AI Security Research area; they do not require a seventh permanent CTF category at this stage.

## 8. Safety and content integrity

- All targets must be owned by CollabCircle, explicitly authorized, or supplied by a trusted lab provider under terms that permit the intended use.
- No challenge should instruct learners to attack real third-party systems.
- Keep vulnerable services isolated from production data and infrastructure.
- Do not provide unrestricted outbound network access from lab workloads.
- Use fictional organizations, accounts and data in scenarios.
- Verify that each challenge can be reset and that its intended solve path works.
- Maintain provenance and license notes for every external reference, dataset, tool, image and challenge asset.
- Do not copy proprietary TryHackMe or Hack The Box room text, flags, walkthroughs, challenge files or solution content. Use them to understand learning structure and difficulty progression; author original CollabCircle content or use openly licensed material under its terms.

## 9. External reference library

Use external platforms and standards as research references, not as content to scrape or republish:

- TryHackMe: beginner-friendly paths, rooms, interactive exercises and challenge practice.
- Hack The Box Academy: digestible modules, sequential sections, practical checkpoints, skill assessments and role-based paths.
- OWASP Web Security Testing Guide: methodology and test coverage for web security topics.
- NIST NICE Framework: vocabulary for cybersecurity work roles, tasks, knowledge and skills.

Record the specific reference, access date, relevant concept and how the CollabCircle lesson differs or adds original practice.

## 10. Content quality gate

A module cannot be published until a reviewer confirms:

- A complete beginner can explain the core concept after the lesson.
- All jargon is defined before it is required.
- Commands and examples are tested in the documented environment.
- The challenge is genuinely at its assigned difficulty.
- Hints guide rather than reveal.
- The walkthrough is accurate and teaches the reasoning.
- The challenge is safe, resettable and reproducible.
- External content and licenses are attributed correctly.
