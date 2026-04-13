# Talent ATS (monorepo)

Local **Talent Intelligence & Ranking** proof of concept: upload many resumes (**PDF, DOCX, JPEG/PNG/WebP**, or scanned PDFs with little extractable text) plus a **text-based job description**, score with OpenAI (text or **vision** where needed), deduplicate by contact fields, and browse ranked results in the browser.

## Documentation

- **[design.md](./design.md)** — Architecture, pipeline, API, client design system, and extension points.
- **[docs/prompt-history.md](./docs/prompt-history.md)** — Exported user prompt history from AI-assisted development (for traceability).
- **Package READMEs** — [`server/README.md`](./server/README.md), [`client/README.md`](./client/README.md).
- **Core logic folders** — Each of `server/src/{config,routes,services,utils}` and `client/src/{pages,theme,lib,styles}` includes a **README.md** with a module map.

## Quick start

```bash
npm install
# Set OPENAI_API_KEY in server/.env
npm run dev
```

- App: http://localhost:5173  
- API: http://localhost:3001  

## Workspaces

- `client` — Vite + React + Ant Design  
- `server` — Express + pipeline + OpenAI  
