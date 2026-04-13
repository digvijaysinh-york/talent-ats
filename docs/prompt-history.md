# AI prompt history (export)

This file records **user prompts** from a Cursor AI working session on this repository, for traceability and onboarding. It is safe to commit; it does not contain secrets.

**Session context:** Talent ATS monorepo — Talent Intelligence & Ranking PoC (Express + Vite/React).  
**First export:** 2026-04-13. **Last updated:** 2026-04-13 (§15–18 appended).

---

## How to use

- Treat this as a **decision log of questions and goals** posed to the assistant, not as executable instructions.
- For architecture and implementation detail, prefer [`design.md`](../design.md) and per-folder `README.md` files.

---

## Chronological prompts

### 1 — Rules, agents, and original product brief

**User request (summary):** Create Cursor rules and agents for the project.

**Embedded product brief (referenced as the basis for the monorepo):**

> You are helping me build a Proof of Concept for a Talent Intelligence & Ranking Engine.
>
> Constraints:
> - Time limit: 2 hours
> - Must run locally
> - Input: 8–10 resumes (PDF/DOCX) + 1 Job Description
> - Output: Top 10 ranked candidates
> - Use OpenAI API for scoring
> - No need for production-level infra, but design should be extensible
>
> Tech stack:
> - Node.js (Express)
> - File parsing: pdf-parse, mammoth
> - In-memory processing (no DB)
>
> Requirements:
> 1. Support PDF and DOCX parsing
> 2. Build a clear pipeline: ingest → parse → score → rank
> 3. Use concurrency (Promise.all)
> 4. Return structured JSON output
> 5. Keep code clean and modular
>
> Generate:
> - Project folder structure
> - package.json
> - Basic Express server setup
> - Clear separation of concerns (routes, services, utils)
>
> Keep it minimal but production-minded.

---

### 2 — Responsive UI, candidate detail, dedupe, scoring, HR filters

Make landing screen responsive. Create and design a detail page of candidate with all details. Avoid duplication of candidates by email, mobile number, optimize the prompt for analyzing logic. Also optional filter components for HR according to years of experience map it with temperature ratio with AI modal.

---

### 3 — Design tokens

There should be universal style tokens used across the app. Follow system design approach for margins, padding, fonts, fontsize.

---

### 4 — Layout fix (overlapping sections)

Avoid overlapping of component Job description (plain text) is overlapping to Resumes component

---

### 5 — Resume count and HR copy

There should not be bar of 10 resume system to able to analyze through n number of resumes. Also make HR filters — years of experience user friendly and update Descriptions, titles, labels accordingly

---

### 6 — Equal-height upload tiles

Job description file (optional if you paste below) tile and Candidate resumes tile should same in height

---

### 7 — Documentation and comments

Add readme md at each required folders where the core logics are defined. Add proper commenting to the functions. Create main design.md file at root

---

### 8 — Commit message

Create a github friendly commit message and descriptions for uncommit files.

---

### 9 — Prompt history file (first export)

Create a prompt history file for AI chat / prompt history export committed to the repository from initial of this thread

---

### 10 — Vision / images for unscannable PDFs and JPEG résumés

support even if pdf is not available for evaluation as it appears to be a screenshot file without readable content. Enable jpeg parse too.

---

### 11 — READMEs and commit text (post–vision changes)

Update readmes and give commit message and description

---

### 12 — Architecture document scope (`design.md`)

Update @design.md with purpose of an Architecture document covering: system design, data flow, how you would scale to production (e.g. S3, queuing, distributed workers), and known failure modes.

---

### 13 — Diagrams without Mermaid

remove mermaid diagram insted create diagrams in text version only

---

### 14 — Backfill prompt history

Update @docs/prompt-history.md file with prompts that are not mentioned

---

### 15 — Back from candidate detail clears results

On back action from details screen scanned resumes are cleared out fix it

*(Implementation note: `HomePage` remounts when returning from `/candidates/:id`; restored last rank payload from `sessionStorage` via `loadLastRankPayload()` on mount so the results table repopulates. Upload `File` objects still reset on remount unless the shell is kept mounted or blobs are persisted separately.)*

---

### 16 — Libraries section in `design.md`

in @design.md also add liberaries used for which purpose

*(Added §1.4 table mapping root/client/server dependencies to roles in the PoC.)*

---

### 17 — 50k résumés, remove 500 cap, batch or queue processing

There can be 50000 resumes in the system. Remove cap of 500 also update UI to remove cap of 500, make queries in batch or queue

*(Raised `MAX_RESUMES_PER_REQUEST` to 50,000 (client + server); replaced unbounded `Promise.all` for parse/score with `mapWithConcurrency` and env-tunable `PARSE_CONCURRENCY` / `SCORE_CONCURRENCY`; exposed `meta.batching` and updated UI copy, table pagination options, and related docs.)*

---

### 18 — Prompt history maintenance

update @docs/prompt-history.md

*(This entry: appended §15–17 and §18; refreshed last-updated line.)*

---

## Maintenance

When you run significant new AI sessions, append new sections (dated) or add rows to a table if you prefer a compact format. Keep PII and API keys out of this file.
