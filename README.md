# Animated Sign 4u

Animated Sign 4u is a small Next.js app and HTTP API for generating **animated signature SVGs** and **static PNG/GIF** images.

You can:

- Type a name/signature and pick a script/brand font
- Apply themes (backgrounds, textures, glow/shadow)
- Use per-character colors or gradients
- Enable Hanzi stroke-by-stroke animation
- Export SVG / PNG / GIF or copy an API URL
- Share the current configuration as a short URL for the builder UI

---

## 1. Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript + React 19
- **UI**: Tailwind CSS 4, Radix UI, `lucide-react`
- **SVG & Fonts**: `opentype.js`, `svg-path-properties`
- **Raster Export**: `sharp` (server-side PNG/GIF)
- **Tests**: Vitest

---

## 2. Project Structure

```text
app/
  layout.tsx         – Root layout (theme + i18n providers)
  page.tsx           – Main builder UI (desktop + mobile)
  api/sign/route.ts  – Signature generation API

components/
  i18n-provider.tsx          – locale + translate helper
  theme-provider.tsx         – dark/light theme
  signature-builder/
    sidebar-*.tsx            – content, params, themes, style panels
    preview-area.tsx         – live SVG preview with zoom
    mobile-drawer-sidebar.tsx– mobile sidebar drawer
    code-panel.tsx           – code snippets & API URL

lib/
  types.ts           – `SignatureState` and enums
  constants.ts       – `INITIAL_STATE`, themes, fonts
  svg-generator.tsx  – pure SVG generator from state + paths
  hanzi-data.ts      – Hanzi stroke data helpers
  state-from-query.ts – parse URLSearchParams into `SignatureState` (shared by API + UI)
  api-url.ts         – build `/api/sign` and short share URLs from state
  code-generators.tsx– React/Vue/JS component generators
```

High-level data flow:

```text
UI (page.tsx)  --SignatureState-->  PreviewArea
   ^                                   |
   |                                   v
   +----------- CodePanel <--- buildSignApiUrl

HTTP client --> /api/sign --> buildStateFromQuery
                             loadFont + buildPaths
                             generateSVG
                             (optional sharp PNG/GIF)
```

---

## 3. How It Works (High Level)

### 3.1 State

All visual options are stored in a single `SignatureState` (see `lib/types.ts`), including:

- Text & font: `text`, `font`, `fontSize`, `speed`, `charSpacing`
- Background: `bg`, `bg2`, `bgMode`, `bgTransparent`, `bgSizeMode`, `bgWidth`, `bgHeight`, `borderRadius`, `cardPadding`
- Fill: `fillMode`, `fill1`, `fill2`, `charColors[]`
- Stroke: `strokeEnabled`, `strokeMode`, `stroke`, `stroke2`, `strokeCharColors[]`, `linkFillStroke`
- Texture: `texture`, `texColor`, `texSize`, `texThickness`, `texOpacity`
- Effects: `useGlow`, `useShadow`
- Modes: `useHanziData`

The UI mutates this state via `updateState(partial)` and passes it to:

- `PreviewArea` for live rendering
- `CodePanel` for generating example code and API URLs

### 3.2 Preview Rendering (UI)

Simplified flow in `preview-area.tsx`:

```ts
const glyphs = font.stringToGlyphs(state.text || "Demo");
const { paths, viewBox } = buildPathsInBrowser(glyphs, state);
const svg = generateSVG(state, paths, viewBox, { idPrefix: "desktop-" });
```

- For Latin text, glyph paths come from `opentype.js`.
- For Chinese text with `useHanziData=true`, stroke data is fetched via `hanzi-data.ts` and each stroke becomes its own path.
- `buildPaths` computes a padded `viewBox` around all glyphs.
- `generateSVG` then:
  - Adds background rect (solid or gradient) and optional texture pattern
  - Computes per-character animation timing (speed is a **factor**: larger = faster)
  - Emits one `<path>` per glyph/stroke, with stroke-dash animations
  - Applies filters for glow/shadow when enabled

### 3.3 Server-Side Rendering (API)

The API uses the same concepts but runs fully on the server:

```ts
const state = buildStateFromQuery(searchParams);
const font = await loadFont(state.font);
const { paths, viewBox } = await buildPaths(font, state);

switch (format) {
  case "json":  return { paths, viewBox };
  case "png":   return sharp(staticSvg).png();
  case "gif":   return sharp(staticSvg).gif();
  default:       return animatedSvg;
}
```

- `buildStateFromQuery` merges `INITIAL_STATE`, optional `theme`, and query parameters.
- `buildPaths` uses `svg-path-properties` for path lengths.
- `generateSVG` is called with `staticRender=true` for PNG/GIF (single-frame snapshot).

> **Note**: GIF export is currently **static** (one frame). Animated GIF output would require sampling multiple frames and is not implemented yet.

---

## 4. HTTP API

### 4.1 Endpoints

The HTTP API is exposed via a single endpoint:

| Method | Path         | Description                                                |
|--------|--------------|------------------------------------------------------------|
| GET    | `/api/sign`  | Generate signature (SVG / PNG / GIF / JSON) via query parameters |

In addition, the app supports short **share URLs** of the form `/{text}` (for example,
`http://domain.com/Signature?font=sacramento`). These always redirect to the main
builder page `/`, using the same query parameters to initialize the UI state. They are
ideal for sharing configurations with other people, but they are not HTTP API endpoints
themselves.

### 4.2 Core Query Parameters

Below is a compact list of the most important parameters. All are optional; unspecified fields fall back to `INITIAL_STATE` or theme defaults.

| Param          | Type / Values                          | Description                                      |
|----------------|----------------------------------------|--------------------------------------------------|
| `text`         | string                                 | Signature text                                   |
| `font`         | string (font id)                       | Font key from `FONTS` in `lib/constants.ts`      |
| `theme`        | string                                 | Theme key from `THEMES`                          |
| `format`       | `svg` (default) \| `png` \| `gif` \| `json` | Output format                                    |
| `fontSize`     | number > 0                             | Font size                                        |
| `speed`        | number > 0                             | Animation speed **factor** (larger = faster)     |
| `charSpacing`  | number                                 | Base character spacing (language-aware scaling)  |
| `fill`         | `single` \| `gradient` \| `multi`     | Fill mode                                        |
| `fill1` / `fill2` | color (e.g. `ff0000` or `#ff0000`) | Primary / secondary fill colors                  |
| `colors`       | `c1-c2-...`                            | Per-character fill colors (enables multi mode)   |
| `stroke` / `stroke2` | color                            | Stroke colors                                    |
| `strokeMode`   | `single` \| `gradient` \| `multi`     | Stroke mode                                      |
| `strokeEnabled`| `0`/`1`/`false`/`true`                 | Toggle stroke                                    |
| `bg`           | `transparent` or color                 | Background color / transparency                  |
| `bgMode`       | `solid` \| `gradient`                 | Background mode                                  |
| `bg2`          | color                                  | Secondary background color for gradients         |
| `bgSizeMode`   | `auto` \| `custom`                    | Auto card size or a fixed card size             |
| `bgWidth` / `bgHeight` | number > 0                    | Custom card size (centered)                      |
| `borderRadius` | number >= 0                            | Card corner radius                               |
| `cardPadding`  | number >= 0                            | Inner padding used by texture overlay           |
| `texture`      | `none` \| `grid` \| `dots` \| `lines` \| `cross` \| `tianzige` \| `mizige` | Texture overlay type |
| `texColor`     | color                                  | Texture color                                    |
| `texSize`      | number > 0                             | Texture scale                                    |
| `texThickness` | number > 0                             | Texture line thickness                           |
| `texOpacity`   | 0..1                                   | Texture opacity                                  |
| `useGlow`      | `0`/`1`/`false`/`true`                 | Enable glow effect                               |
| `useShadow`    | `0`/`1`/`false`/`true`                 | Enable shadow effect                             |
| `useHanziData` | `0`/`1`/`false`/`true`                 | Use Hanzi stroke data for Chinese characters     |
| `linkFillStroke` | `0`/`1`/`false`/`true`               | Make stroke follow fill mode/colors              |

> For full, up-to-date defaults, see `buildStateFromQuery` in `lib/state-from-query.ts`.

### 4.3 Example Requests

- **Simple SVG (HTTP API)**

  ```text
  /api/sign?text=Alice&font=great-vibes
  ```

- **Short share URL (opens the web builder)**

  ```text
  /Alice?font=great-vibes
  ```

  This URL redirects to `/` and initializes the interactive builder with the same
  configuration. Use the `/api/sign` form above when you need a pure HTTP API response.
  Inside the app, the top-right **Share** button generates and copies exactly this
  kind of short URL for the current configuration.

- **JSON (paths and viewBox)**

  ```text
  /api/sign?text=Alice&theme=laser&format=json
  ```

- **Custom background size and texture (HTTP API)**

  ```text
  /api/sign?text=Demo&bgSizeMode=custom&bgWidth=800&bgHeight=400&texture=grid&texColor=ffffff&texSize=40&texOpacity=0.4
  ```

- **Chinese characters with Hanzi stroke mode (HTTP API)**

  ```text
  /api/sign?text=你好世界&font=ma-shan-zheng&useHanziData=1&fontSize=150
  ```

---

## 5. Development

```bash
# install deps
pnpm install   # or npm install / yarn

# dev server (http://localhost:3000)
pnpm dev

# production build
pnpm build
pnpm start

# tests
pnpm test
```

---

This README is intentionally concise and GitHub-oriented. For deeper internals, refer to:

- `lib/svg-generator.tsx` for SVG structure and animation timing
- `app/api/sign/route.ts` for query parsing and response formats
- `tests/api/*.test.ts` and `tests/lib/*.test.ts` for executable examples of expected behavior.