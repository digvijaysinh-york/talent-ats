# Server source (`server/src`)

## Entry

- **`index.js`** — Creates the Express app, registers middleware, mounts `rankRouter` at `/api/v1`, global error handler.

## Flow

HTTP request → **`routes/rankRoutes.js`** (Multer) → **`services/pipelineService.js`** → JSON response.

## Subpackages

- **`config/`** — Constants (e.g. max résumés per request).
- **`routes/`** — Route definitions only; keep thin.
- **`services/`** — All business logic for ranking.
- **`utils/`** — Pure helpers (no Express/OpenAI singletons), including PDF rasterization and vision MIME handling for multimodal scoring.
