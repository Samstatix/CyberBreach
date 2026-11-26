# CyberBreach Learning and Challenge Quality Standard

## Learning experience
- Assume the learner may be new to the topic.
- Explain the concept in plain language before introducing dense terminology.
- Define essential technical terms at first use.
- Use small, worked examples and explain each step.
- Include a glossary and knowledge check for lessons.
- Connect the weakness, its impact and its mitigation.
- Keep explanations readable without removing technical accuracy.

## Challenge difficulty
- **Medium:** applies one core concept with a clear evidence trail.
- **Hard:** combines multiple concepts or requires the learner to adapt a technique.
- **Expert:** requires independent investigation, multi-step reasoning and validation.

Difficulty must come from reasoning, not missing instructions, arbitrary guessing or obscure flag formatting.

## Challenge package
Every published challenge includes:
- Stable ID and slug, category, difficulty, points and time estimate.
- Fictional scenario and explicit scope.
- Objective, task statement and supplied evidence or documented isolated environment.
- Prerequisites and three progressive hints.
- Reproducible intended solve path.
- Defensive explanation and reflection question.
- Tested flag digest and release/reset procedure.

## Scoring and solution security
- Never ship expected flags or full walkthroughs in the browser bundle.
- Store only flag digests in a private database table.
- Verify flags in a trusted database function using authenticated identity.
- Rate-limit submissions and make first-solve scoring atomic and idempotent.
- Store attempts without retaining plaintext submitted flags.
- Reveal walkthroughs only after the authenticated learner solves the challenge.
- Keep lesson completion separate from competitive points.

## Safety and privacy
- Use synthetic or explicitly licensed evidence.
- Never direct learners at real third-party targets.
- Keep OSINT subjects and places fictional; do not profile private individuals.
- Do not ask learners to submit personal credentials or confidential files.
- Real lab environments must be isolated, disposable and reviewed before public access.
- Include defensive lessons, not only offensive techniques.
