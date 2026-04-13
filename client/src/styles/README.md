# Styles (`client/src/styles`)

CSS that complements the **JS design tokens** (Ant Design theme cannot cover every layout edge case).

| File | Role |
|------|------|
| `global.css` | Document baseline (`body`, `html` text-size adjust) |
| `uploadTiles.css` | Equal-height Ant Design `Upload.Dragger` tiles on the home page (class `talent-upload-tile`) |

Prefer **`theme/designTokens.js`** + **`theme/appShell.js`** for spacing; add CSS here when targeting third-party class names (e.g. `.ant-upload-drag`).
