# Theme (`client/src/theme`)

**Design system** for spacing, typography, colors, and Ant Design alignment.

| File | Role |
|------|------|
| `designTokens.js` | Single source: `space`, `fontSize`, `fontFamily`, `layout`, `colors`, etc. |
| `antdTheme.js` | `createAppTheme()` — maps tokens to Ant Design v5 `token` overrides |
| `appShell.js` | Reusable inline style factories for header/content/detail layouts |
| `index.js` | Barrel exports for convenient imports |

Changing visual scale: edit **`designTokens.js`** first, then adjust **`antdTheme.js`** if Ant components need matching `token` keys.
