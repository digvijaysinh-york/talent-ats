# Lib (`client/src/lib`)

Small **non-UI** modules used by pages.

| File | Role |
|------|------|
| `limits.js` | `MAX_RESUMES_PER_REQUEST` — must match `server/src/config/limits.js` for UX hints and trimming |
| `rankSnapshot.js` | Save/load last rank JSON in `sessionStorage`; find candidate by `id` for detail page refresh |
| `experienceTemperature.js` | `previewScoringTemperature()` — mirrors server band→temperature for the HR filter alert |
