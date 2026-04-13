# Client source (`client/src`)

## Bootstrap

- **`main.jsx`** — Renders the app with React 18 `createRoot`, `BrowserRouter`, Ant Design `ConfigProvider` + `createAppTheme()`, global styles.

## Application shell

- **`App.jsx`** — Defines routes: `/` (home), `/candidates/:id` (detail), catch-all redirect.

## Feature areas

- **`pages/`** — Full-screen views (upload flow, results table, candidate profile).
- **`theme/`** — Design tokens and shared layout style objects.
- **`lib/`** — Small modules with no UI (session snapshot, limits mirror, temperature preview).
- **`styles/`** — CSS complements (tokens remain in JS for Ant Design integration).
