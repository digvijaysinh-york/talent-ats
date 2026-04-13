# Client (`@talent-ats/client`)

Vite + React 18 + Ant Design 5 SPA for uploading résumés (**PDF, DOCX, JPEG, PNG, WebP**), optional HR experience filters, ranked results (paginated), and candidate detail pages. Job descriptions must be pasted text or a text-based file (not an image-only JD).

## Scripts

- `npm run dev` — Vite dev server (port `5173`, proxies `/api` to backend)
- `npm run build` / `npm run preview` — Production bundle

## Source map

| Path | Role |
|------|------|
| `src/main.jsx` | `BrowserRouter`, Ant Design `ConfigProvider`, theme |
| `src/App.jsx` | Route table |
| `src/pages/` | Screen components |
| `src/theme/` | Design tokens + Ant Design theme mapping + layout styles |
| `src/lib/` | Client-only helpers (limits, snapshot, temperature preview) |
| `src/styles/` | Global CSS and feature CSS (e.g. upload tiles) |

See **README.md** in each subdirectory for specifics.
