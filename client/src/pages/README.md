# Pages (`client/src/pages`)

Route-level React components.

| File | Route | Role |
|------|-------|------|
| `HomePage.jsx` | `/` | Résumé + JD upload, optional experience filters, `POST /api/v1/rank`, results table with pagination |
| `CandidateDetailPage.jsx` | `/candidates/:id` | Full candidate profile; reads `location.state` or `sessionStorage` via `lib/rankSnapshot.js` |

Keep data-fetching and form submission logic colocated in these files unless it grows large enough to extract hooks.
