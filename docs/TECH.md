# Animated Sign 4u

Animated Sign 4u is an interactive web app and HTTP API for generating
**animated signature SVGs** and **static PNG/GIF exports** with:

- Script / brand fonts and custom font upload
- Per-character colors and gradients
- Optional Hanzi stroke-by-stroke animation
- Card-style backgrounds and textures (grid, dots, tianzige, mizige, …)
- Fill/stroke linking mode
- Responsive desktop & mobile UI

This document describes the **current implementation** as of version `0.2.4`,
based on the actual source code in this repository.

---

## 1. Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript + React 19
- **Styling & UI**
  - Tailwind CSS 4, `tailwindcss-animate`
  - Radix UI primitives (Slider, Switch, Select, DropdownMenu, etc.)
  - Custom UI primitives under `components/ui` (e.g. `Button`, `ResizablePanel`)
- **SVG & Fonts**
  - `opentype.js` – load and measure fonts, build glyph paths
  - `svg-path-properties` – compute path lengths in the API pipeline
  - Custom SVG generator in `lib/svg-generator.tsx`
- **Raster Export**
  - `sharp` – render SVG to PNG / GIF (single-frame) on the server
- **Internationalization & Theming**
  - Custom i18n provider (`components/i18n-provider.tsx`, `lib/i18n.ts`)
  - `next-themes` for dark/light theme
- **Testing**
  - Vitest (`vitest`, `@vitest/ui`, `@vitest/coverage-v8`)

---

## 2. High-Level Architecture

### 2.1 Source Layout

```text
app/
  layout.tsx         – Root layout (theme + i18n providers)
  page.tsx           – Main signature builder page (desktop + mobile)
  [text]/route.ts    – Root-level short share URL redirect to builder UI
  api/sign/route.ts  – Signature generation API (SVG / PNG / GIF / JSON)

components/
  i18n-provider.tsx          – Locale context + `t(key)` translation helper
  theme-provider.tsx         – Dark/light theme provider
  signature-builder/
    sidebar.tsx              – Desktop sidebar (content, params, themes, style)
    sidebar-content-section.tsx
    sidebar-params-section.tsx
    sidebar-themes-section.tsx
    sidebar-style-section.tsx
    preview-area.tsx         – SVG preview with zoom/card/shadow
    mobile-drawer-sidebar.tsx– Mobile sidebar in a swipeable drawer
    code-panel.tsx           – Code/API panel with syntax highlighting

lib/
  constants.ts       – `INITIAL_STATE`, theme presets, font list
  types.ts           – Core types (`SignatureState`, `FillMode`, ...)
  i18n.ts            – Translation messages and `translate()`
  svg-generator.tsx  – Pure function to generate SVG markup
  hanzi-data.ts      – Fetch and cache Hanzi stroke data
  state-from-query.ts – Parse URLSearchParams into `SignatureState` (shared by API + UI)
  api-url.ts         – Build `/api/sign` URLs from a `SignatureState`
  code-generators.tsx– Generate React/Vue/JS components from the SVG

tests/
  api/               – Tests for `buildStateFromQuery`, `buildPaths`, API URL
  lib/               – Tests for SVG generator, i18n, code generators
```

### 2.2 Responsibilities & Data Flow

At runtime, the app operates around a single `SignatureState` object.

```text
+---------+        +-----------------+        +-----------------+
|  User   | -----> |   React UI      | -----> | SignatureState  |
+---------+        |  (app/page.tsx) |        +-----------------+
                       |        |                     |
                       |        |                     v
                       |        |             +---------------+
                       |        +-----------> | PreviewArea   |
                       |                      | svg-generator |
                       |                      +---------------+
                       v
                 +--------------+
                 | CodePanel    |
                 | buildSignApi |
                 +--------------+

HTTP clients:

  Client ----> GET /api/sign?... ----> buildStateFromQuery
                                       buildPaths (opentype.js)
                                       generateSVG
                                       (optional sharp raster)
```

- **UI layer (`app/page.tsx` + `components/signature-builder/*`)**
  - Holds a `SignatureState` in React state via `useState(INITIAL_STATE)`.
  - Mutates it through `updateState(partial)` callbacks passed into sidebar
    sections and preview.
  - Renders:
    - Desktop layout: left sidebar, center preview, bottom code panel.
    - Mobile layout: preview + bottom resizable drawer + fullscreen code
      overlay.

- **Preview & Rendering (`preview-area.tsx` + `lib/svg-generator.tsx`)**
  - Builds glyph or Hanzi stroke paths from font data and `SignatureState`.
  - Computes a `viewBox` that tightly fits the text, then calls `generateSVG()`.
  - Displays the resulting `<svg>` with card background, textures and animation.

- **API (`app/api/sign/route.ts`)**
  - Parses query parameters into a `SignatureState` (`buildStateFromQuery`).
  - Loads font, builds paths and `viewBox` (`buildPaths`).
  - Returns:
    - Animated SVG markup
    - Static PNG or static GIF (last frame snapshot)
    - Debug JSON with `paths` + `viewBox`

- **Short share URLs (`app/[text]/route.ts`)**
  - Handle human-friendly paths like `/Signature` or `/Signature?font=...`.
  - Issue a 308 redirect to `/` while preserving all query parameters and
    setting the `text` query value from the path segment.
  - This keeps `/api/sign` as the single HTTP API endpoint while providing
    shareable URLs for the interactive builder UI.

- **API URL helper (`lib/api-url.ts`)**
  - Serializes the current `SignatureState` into a `/api/sign` URL.
  - Ensures round-trippable mapping verified by tests.

---

## 3. Core Data Model: `SignatureState`

Defined in `lib/types.ts`:

```ts
export type FillMode = "single" | "gradient" | "multi";
export type StrokeMode = "single" | "gradient" | "multi";
export type TextureType =
  | "none"
  | "grid"
  | "dots"
  | "lines"
  | "cross"
  | "tianzige"
  | "mizige";

export interface SignatureState {
  text: string;
  font: string;
  fontSize: number;
  speed: number; // Speed factor: higher = faster animation
  charSpacing: number; // Base character spacing, language-aware

  // Background card
  bg: string;
  bg2: string;
  bgMode: "solid" | "gradient";
  bgTransparent: boolean;
  borderRadius: number;
  cardPadding: number;
  bgSizeMode: "auto" | "custom";
  bgWidth: number | null;
  bgHeight: number | null;

  // Stroke
  stroke: string;
  strokeEnabled: boolean;
  strokeMode: StrokeMode;
  stroke2: string;
  strokeCharColors: string[];

  // Fill
  fillMode: FillMode;
  fill1: string;
  fill2: string;
  charColors: string[];

  // Texture overlay
  texture: TextureType;
  texColor: string;
  texSize: number;
  texThickness: number;
  texOpacity: number;

  // Effects
  useGlow: boolean;
  useShadow: boolean;

  // When true, stroke follows fill mode and colors
  linkFillStroke: boolean;

  // Hanzi stroke-by-stroke mode
  useHanziData?: boolean;
}
```

- `INITIAL_STATE` in `lib/constants.ts` is used both by the client UI and the
  API.
- Theme presets (`THEMES`) are expressed as partial `SignatureState` objects.

---

## 4. Path Building & SVG Generation

There are two closely related pipelines that build text/stroke paths and render
SVG:

- **UI pipeline** – for the on-page preview (`preview-area.tsx`).
- **API pipeline** – for server-side rendering in `/api/sign` (`route.ts`).

Both use the same conceptual steps:

1. Convert text into glyphs or Hanzi strokes.
2. Compute per-path geometry (`d`, `len`, character index).
3. Compute a padded bounding box and `viewBox`.
4. Pass everything into `generateSVG(state, paths, viewBox, options)`.

### 4.1 UI path building (`components/signature-builder/preview-area.tsx`)

Simplified pseudo-code from the `buildSvg` logic:

```ts
const glyphs = fontObj.stringToGlyphs(state.text || "Demo");
const paths: PathData[] = [];
let cursorX = 10;
let [minX, minY, maxX, maxY] = [Infinity, Infinity, -Infinity, -Infinity];

for each glyph (idx, char) {
  if (state.useHanziData && isChinese(char)) {
    const hanziData = await fetchHanziData(char);

    for each stroke in hanziData.strokes {
      const d = stroke.path;          // raw SVG path from dataset
      const len = measureLength(d);   // DOM-based measurement

      updateBoundingBox(d);
      paths.push({ d, len, index: idx, isHanzi: true, ... });
    }
  } else {
    const glyphPath = glyph.getPath(cursorX, baselineY, state.fontSize);
    const d = glyphPath.toPathData(2);
    const bbox = glyphPath.getBoundingBox();

    update global [minX, minY, maxX, maxY] with bbox;
    const len = measureLength(d); // via hidden <svg> + <path>

    paths.push({ d, len, index: idx });
  }

  const spacing = computeLanguageAwareSpacing(state.charSpacing, char);
  cursorX += glyph.advanceWidth * (state.fontSize / fontObj.unitsPerEm) + spacing;
}

if (paths.length === 0) return empty SVG;

const padding = 40;
const viewBox = {
  x: minX - padding,
  y: minY - padding,
  w: (maxX - minX) + 2 * padding,
  h: (maxY - minY) + 2 * padding,
};

const svg = generateSVG(state, paths, viewBox, { idPrefix: "desktop-" });
```

The mobile preview uses a similar call but passes a different `idPrefix` (e.g.
`"mobile-"`) to keep SVG `id` attributes unique across instances.

### 4.2 API path building (`app/api/sign/route.ts`)

On the server side, `buildPaths(font, state)` performs the same conceptual work
using `opentype.js` and `svg-path-properties` (no DOM).

- Computes glyph paths and lengths for each character.
- Applies **language-aware character spacing** with the same rules as the UI.
- Produces a `viewBox` that encloses the text with padding.
- Returns `{ paths, viewBox }` used by `generateSVG` in the API route.

### 4.3 `generateSVG` (`lib/svg-generator.tsx`)

`generateSVG` is a pure function that takes the current visual state and path
data and returns a complete `<svg>` string.

**Inputs**

```ts
function generateSVG(
  state: SignatureState,
  paths: PathData[],
  viewBox: { x: number; y: number; w: number; h: number },
  options?: { staticRender?: boolean; idPrefix?: string },
): string;
```

**Outputs**

- `<svg>` root with computed `viewBox` and width/height attributes.
- `<defs>` with:
  - Background gradient (if `bgMode === "gradient"`).
  - Fill/stroke gradients (if `fillMode`/`strokeMode` is `"gradient"`).
  - Filter definitions for glow and shadow.
  - Texture patterns (`pattern`) for grid/dots/lines/cross/tianzige/mizige.
  - `@keyframes` for per-path draw and fill-fade animations.
- Background card `<rect>` (optionally transparent or gradient-filled).
- Inner texture overlay `<rect>` anchored to that card.
- A `<g>` containing one `<path>` per glyph/stroke, with inline animation
  styles.

**Key steps (pseudo-code)**

```ts
// Canvas & text offsets
let canvasWidth = viewBox.w;
let canvasHeight = viewBox.h;
let textOffsetX = 0;
let textOffsetY = 0;

const hasHanzi = paths.some((p) => p.isHanzi);
if (hasHanzi) {
  // Move Hanzi text up for better optical centering
  textOffsetY -= canvasHeight * 0.04;
}

// Center texture patterns relative to the SVG canvas
let patternOffsetX = 0;
let patternOffsetY = 0;
if (state.texture !== "none") {
  const s = Math.max(1, state.texSize || 1);
  patternOffsetX = -((canvasWidth % s) / 2);
  patternOffsetY = -((canvasHeight % s) / 2);
}

// Build <defs>
if (state.fillMode === "gradient") defineFillGradient();
if (state.strokeEnabled && state.strokeMode === "gradient") defineStrokeGradient();
if (!state.bgTransparent && state.bgMode === "gradient") defineBackgroundGradient();
if (state.useGlow) defineGlowFilter();
if (state.useShadow) defineShadowFilter();
if (state.texture !== "none") defineTexturePatterns(patternOffsetX, patternOffsetY);

// Animation timing – speed is a *factor*: larger = faster
const speedFactor = state.speed || 1;
const charDuration = 1 / Math.max(0.01, speedFactor); // seconds per character

// Group paths by character index so all strokes of a character animate together
const charGroups = groupPathsByIndex(paths);
const timings = new Map<PathData, { duration: number; delay: number }>();

let globalCharStart = 0;
for each charIndex in sorted(charGroups.keys()) {
  const group = charGroups.get(charIndex);
  const totalLen = sum(p.len for p in group);
  let localStart = 0;

  if (!totalLen || totalLen <= 0) {
    const per = group.length > 0 ? charDuration / group.length : charDuration;
    for each p in group {
      timings.set(p, { duration: per, delay: globalCharStart + localStart });
      localStart += per;
    }
  } else {
    for each p in group {
      const d = (p.len / totalLen) * charDuration;
      timings.set(p, { duration: d, delay: globalCharStart + localStart });
      localStart += d;
    }
  }

  globalCharStart += charDuration;
}

// Build path elements with fill/stroke and animation
for each path p in paths {
  const { duration, delay } = timings.get(p) ?? fallbackTiming(p, charDuration);

  const fillColor =
    state.fillMode === "single"
      ? state.fill1
      : state.fillMode === "gradient"
      ? `url(#${idPrefix}grad-fill)`
      : state.charColors[p.index] ?? state.fill1;

  let strokeColor = "none";
  if (state.strokeEnabled) {
    strokeColor =
      state.strokeMode === "single"
        ? state.stroke
        : state.strokeMode === "gradient"
        ? `url(#${idPrefix}grad-stroke)`
        : state.strokeCharColors[p.index] ?? state.stroke;
  }

  const dashLen = p.len || 0;
  const dashOffset = options?.staticRender
    ? 0
    : p.isHanzi
    ? -dashLen
    : dashLen;

  const fillOpacity = options?.staticRender ? 1 : 0;

  const animStyle = options?.staticRender
    ? ""
    : `animation:
         ${idPrefix}draw-${p.uid} ${duration}s ease-out forwards ${delay}s,
         ${idPrefix}fill-${p.uid} 0.8s ease-out forwards ${delay + duration * 0.6}s;`;

  const transform = p.isHanzi
    ? computeHanziTransform(state, viewBox)
    : "";

  append <path
    d={p.d}
    fill={fillColor}
    stroke={strokeColor}
    strokeDasharray={dashLen}
    strokeDashoffset={dashOffset}
    fillOpacity={fillOpacity}
    style={animStyle}
    transform={transform}
  />;
}

// Background card – centered and optionally custom-sized
if (!state.bgTransparent) {
  const { rectX, rectY, rectW, rectH } = computeCenteredBackgroundRect(state, viewBox);
  append <rect
    x={rectX}
    y={rectY}
    width={rectW}
    height={rectH}
    rx={state.borderRadius}
    fill={bgFillOrGradient}
    filter={shadowOrGlowFilter}
  />;
}

// Texture overlay inside the card
if (state.texture !== "none") {
  const inner = shrinkRectForTexture(cardRect, state.cardPadding);
  append <rect
    x={inner.x}
    y={inner.y}
    width={inner.w}
    height={inner.h}
    fill={texturePatternUrl}
  />;
}

return <svg ...>{defs}{background}{texture}{groupOfPaths}</svg>;
```

### 4.4 Hanzi stroke direction & coordinate system

- Hanzi stroke paths come from a dataset where the Y axis is top-down.
- To render them in the same coordinate system as Latin glyphs, `generateSVG`
  applies:
  - A vertical flip `scale(1, -1)` at the appropriate origin.
  - A translate offset (e.g. `translate(0, -1024)`) to match the dataset’s
    coordinate space.
- For animation direction:
  - For normal glyphs, `strokeDashoffset` starts at `+len` and animates to `0`.
  - For Hanzi strokes, `strokeDashoffset` starts at `-len` so the perceived draw
    direction follows the natural stroke order.

---

## 5. API: `/api/sign`

Implementation: `app/api/sign/route.ts`.

The route is a Next.js App Router handler that exposes a single `GET` endpoint.

### 5.1 `buildStateFromQuery`

Defined in `lib/state-from-query.ts`, `buildStateFromQuery(params)` is
responsible for:

1. Starting from `INITIAL_STATE`.
2. Optionally applying a theme (`theme` query param, merged from `THEMES[...]`).
3. Overriding fields based on incoming query parameters.

Important query parameters (names and semantics):

- **Content & font**
  - `text`: signature text
  - `font`: font id used by `loadFont`

- **Geometry & animation**
  - `fontSize`: number
  - `speed`: animation **speed factor** (`> 0`, larger = faster)
  - `charSpacing`: base character spacing (language-aware scaling is applied
    later)
  - `borderRadius`: card corner radius
  - `cardPadding`: inner padding between text and card edges

- **Fill & stroke**
  - `fill`: one of `single | gradient | multi`
  - `fill1`, `fill2`: primary / secondary fill colors
  - `colors`: comma-separated per-character fill colors (`#rrggbb`), implies
    `fillMode="multi"`
  - `stroke`, `stroke2`: stroke colors
  - `strokeMode`: one of `single | gradient | multi`
  - `strokeEnabled`: `"true" | "1" | "false" | "0"`

- **Background**
  - `bg`: `"transparent"` or a hex color (`#rrggbb` or `rrggbb`)
  - `bgMode`: `solid | gradient`
  - `bg2`: secondary background color for gradients
  - `bgSizeMode`: `auto | custom`
  - `bgWidth`, `bgHeight`: custom card size in px (centered inside `viewBox`)

- **Texture**
  - `texture`: `none | grid | dots | lines | cross | tianzige | mizige`
  - `texColor`: texture stroke color
  - `texSize`: texture scale
  - `texThickness`: texture line thickness
  - `texOpacity`: 0..1 texture opacity

- **Effects & modes**
  - `useGlow`, `useShadow`: `"true" | "1" | "false" | "0"`
  - `useHanziData`: `"true" | "1"`
  - `linkFillStroke`: `"true" | "1" | "false" | "0"`

Additional logic:

- When `fillMode === "multi"` but `charColors` is empty, it derives
  per-character colors from theme functions (`charColorsFn`) or a default
  palette.
- When `strokeMode === "multi"` but `strokeCharColors` is empty, it tries:
  1. `theme.strokeCharColorsFn` if available.
  2. Reuse fill pattern (`theme.charColorsFn`) if `fillMode === "multi"`.
  3. Copy from `state.charColors`.
  4. Fallback to cycling default colors.

### 5.2 `buildPaths` and `GET` handler

The `GET` handler performs:

```ts
const url = new URL(req.url);
const params = url.searchParams;

const state = buildStateFromQuery(params);
const font = await loadFont(state.font);
const { paths, viewBox } = await buildPaths(font, state);

switch (formatParam) {
  case "json":
    return Response.json({ paths, viewBox });

  case "png":
  case "gif": {
    // Static (non-animated) raster export
    const staticSvg = generateSVG(state, paths, viewBox, {
      staticRender: true,
    });
    const image = await sharp(Buffer.from(staticSvg))
      [formatParam]() // .png() or .gif()
      .toBuffer();
    return new Response(image, { headers: { "Content-Type": contentType } });
  }

  default: {
    // Animated SVG
    const svg = generateSVG(state, paths, viewBox);
    return new Response(svg, { headers: { "Content-Type": "image/svg+xml" } });
  }
}
```

> **Note**: The current GIF export is a **single-frame static GIF** (snapshot of
> the final rendered state). It does not yet produce an animated GIF.

### 5.3 API URL Builder (`lib/api-url.ts`)

`buildSignApiUrl(state, options)` converts a `SignatureState` into a `/api/sign`
URL that can reproduce the same visual output.

Key details:

- Serializes all relevant fields, including:
  - Text, font, fontSize, speed, charSpacing
  - Background colors, mode, size, transparency
  - Fill / stroke modes, colors, multi-color arrays
  - Texture type and parameters
  - Effects flags (`useGlow`, `useShadow`)
  - `useHanziData`, `linkFillStroke`
- Uses the provided `origin` or defaults to:

  ```ts
  const origin = options.origin ??
    (typeof window !== "undefined"
      ? window.location.origin
      : "https://sign.yunique.top");
  ```

- Tests in `tests/api/api-url-roundtrip.test.ts` verify that:
  - A documented example URL is parsed correctly.
  - `state -> URL -> state` roundtrips without losing core fields.

---

## 6. UI Behaviour

### 6.1 Top Bar (Desktop & Mobile)

File: `app/page.tsx`.

The top bar is shared by both desktop and mobile layouts and includes:

- **Left side**
  - A small logo square with `4U` inside.
  - The localized app title (`appTitle`).

- **Right side**
  - Locale toggle (`EN` / `中文`), backed by `i18n-provider`.
  - Theme toggle (Sun/Moon) using `next-themes`.
  - GitHub repo button:

    ```tsx
    <Button
      asChild
      variant="ghost"
      size="icon-sm"
      className="h-8 w-8 text-xs inline-flex"
    >
      <a
        href="https://github.com/YuniqueUnic/animated-sign-4u"
        target="_blank"
        rel="noreferrer"
        aria-label={t("githubRepoLabel")}
      >
        <Github className="h-4 w-4" />
      </a>
    </Button>;
    ```

  - Desktop download button: hover opens a panel with all download options
    (React, Vue, JS, SVG, PNG, GIF).
  - Mobile download dropdown + “Code” button that opens a fullscreen overlay
    containing the `CodePanel`.

### 6.2 Desktop Layout

```text
+-------------------------------------------------------------+
| Top bar (logo, locale, theme, GitHub, download)             |
+----------------------+--------------------------------------+
| Sidebar              | Preview & CodePanel                  |
| - Content & Font     | - PreviewArea (top, resizable)      |
| - Parameters         | - CodePanel (bottom, resizable)     |
| - Quick Themes       |                                      |
| - Style & Color      |                                      |
+----------------------+--------------------------------------+
```

- `Sidebar` (`components/signature-builder/sidebar.tsx`) contains four logical
  sections (each in its own file):
  - **Content & Font** – signature text, font selection, custom font upload.
  - **Parameters** – font size, animation speed, character spacing, Hanzi stroke
    mode.
  - **Quick Themes** – theme presets with small cards and texture previews.
  - **Style & Color** – background, texture, fill/stroke colors, effects.

- `PreviewArea` renders the animated SVG with card, textures, and a zoom
  control.
  - Zoom ranges are clamped (e.g. 0.1×–4×) and applied to the whole card,
    including shadow and textures.

- `CodePanel` shows:
  - The current SVG markup
  - Example React / Vue / JS wrapper components generated by
    `lib/code-generators.tsx`
  - The API URL built by `buildSignApiUrl`

### 6.3 Mobile Layout

```text
+--------------------------------------------------+
| Top bar                                          |
+--------------------------------------------------+
| PreviewArea (zoom + animated SVG)                |
+--------------------------------------------------+
| Resizable bottom panel (MobileDrawerSidebar)     |
|  - Swipe horizontally to switch sections         |
|  - Sections mirror desktop sidebar tabs          |
+--------------------------------------------------+
```

The mobile drawer implements:

- A resizable bottom panel whose height can be dragged.
- Swipe left/right to change between sections (Content, Params, Themes, Style).
- Special handling to avoid conflicts between horizontal swipes and sliders:
  - If a pointer/touch starts on a slider (`[data-slot="slider"]`),
    swipe-to-change-section is suppressed.

### 6.4 Character Spacing (Language-Aware)

Both UI and API use the same function to transform `state.charSpacing` into
actual spacing per character:

```ts
const baseSpacing = state.charSpacing || 0;
let spacing = baseSpacing;

if (baseSpacing !== 0 && char && isChinese(char)) {
  // Chinese characters are visually wider; adjust scaling
  spacing = baseSpacing > 0 ? baseSpacing / 5 : baseSpacing * 5;
}
```

- For **Latin text**, spacing is applied as-is.
- For **Chinese characters**:
  - When spacing is negative, it is magnified (×5) so you can quickly compress
    the text.
  - When spacing is positive, it is reduced (÷5) to avoid overly large gaps.

Unit tests in `tests/api/char-spacing.test.ts` ensure this logic behaves as
intended.

### 6.5 Animation Speed (Larger = Faster)

- UI labels speed as `X.XXx` (e.g. `1.00x`, `2.00x`).
- Slider range: approximately `0.25`–`3.00`.
- In the SVG generator, speed is interpreted as a **speed factor**:

  ```ts
  const speedFactor = state.speed || 1;
  const charDuration = 1 / Math.max(0.01, speedFactor); // seconds per character
  ```

  - `speed = 1.0` → ~1 second per character.
  - `speed = 2.0` → ~0.5 seconds per character.
  - `speed = 0.5` → ~2 seconds per character.

### 6.6 Fill / Stroke Linking Mode

In the Style & Color section, there is a toggle that enables **linked
fill/stroke mode**:

- When `linkFillStroke` is `true`:
  - `strokeMode` mirrors `fillMode`.
  - `stroke` and `stroke2` mirror `fill1` and `fill2`.
  - In multi-color mode, `strokeCharColors` mirrors `charColors`.
  - Stroke controls are visually disabled (reduced opacity and pointer-events)
    to indicate that stroke is derived from fill.

The helper `withLinkedStroke(patch)` in `sidebar-style-section.tsx` applies the
correct stroke settings whenever:

- The fill mode changes (single/gradient/multi).
- The fill colors (`fill1`, `fill2`) change.
- Per-character colors are updated in multi mode.

`linkFillStroke` is also round-tripped through the API and URL builder so
server-rendered outputs match the preview.

---

## 7. Theming & Textures

### 7.1 Themes (`lib/constants.ts`)

- `THEMES` is a map of theme keys to partial `SignatureState` values.
- Typical theme fields:
  - `bg`, `bg2`, `bgMode`, `bgTransparent`, `borderRadius`, `texture`
  - `fillMode`, `fill1`, `fill2`, `stroke`, `strokeMode`, `strokeEnabled`
  - `cardPadding`, `bgSizeMode`, `speed`, etc.
- Some themes provide functions:
  - `charColorsFn(text: string): string[]`
  - `strokeCharColorsFn(text: string): string[]`

These functions are used when fill or stroke operates in multi-color mode and no
explicit per-character array has been provided.

### 7.2 Textures (`lib/svg-generator.tsx`)

Textures are implemented as `<pattern>` definitions in `<defs>` and applied
using `fill="url(#pattern-id)"` to an overlay `<rect>` inside the background
card.

Supported textures (`TextureType`):

- `grid`
- `dots`
- `lines`
- `cross`
- `tianzige` (square practice grid)
- `mizige` (diagonal practice grid)

Additional parameters:

- `texColor`: stroke color
- `texSize`: pattern tile size
- `texThickness`: line thickness
- `texOpacity`: opacity of the overlay

The quick themes sidebar visualizes these textures using CSS `background-image`,
while the actual SVG output uses the `getTextureDefs` helper for true vector
patterns.

---

## 8. Testing

Key test suites include:

- `tests/api/buildStateFromQuery.test.ts`
  - Verifies parsing of all major query parameters into a correct
    `SignatureState`.
  - Covers themes, defaults, background sizes, textures, effects, and
    multi-color arrays.

- `tests/api/buildPaths.test.ts`
  - Ensures path and `viewBox` construction is consistent.
  - Validates how `charSpacing` affects total width.

- `tests/api/char-spacing.test.ts`
  - Focuses on language-specific spacing for English vs. Chinese text.

- `tests/api/api-url-roundtrip.test.ts`
  - Tests a long example URL to ensure full state reconstruction.
  - Verifies `state -> URL -> state` roundtrips without losing key fields.

- `tests/lib/svg-generator.test.ts`
  - Covers texture patterns, gradients, and stroke dashoffset logic.
  - Checks `idPrefix`-based scoping to avoid collisions between multiple SVG
    instances (e.g., desktop vs. mobile previews).

Run tests with:

```bash
pnpm test
# or
npm test
```

---

## 9. Development & Running Locally

### 9.1 Install & Dev Server

```bash
pnpm install          # or npm install / yarn
pnpm dev              # or npm run dev

# App runs at http://localhost:3000 by default
```

### 9.2 Production Build

```bash
pnpm build
pnpm start
```

### 9.3 Package Scripts (`package.json`)

```json
{
  "scripts": {
    "build": "next build",
    "dev": "next dev",
    "lint": "eslint .",
    "start": "next start",
    "test": "vitest",
    "test:watch": "vitest --watch"
  }
}
```

---

## 10. Limitations & Future Work

- **Animated GIF export**
  - Currently, `format=gif` returns a single-frame static GIF generated from the
    final SVG state.
  - A true animated GIF pipeline would need to:
    - Sample multiple SVG frames along the animation timeline.
    - Encode them as a multi-frame animated GIF using `sharp` or another
      encoder.
    - Carefully balance frame count, resolution, and file size.

- **Fonts**
  - The app ships with several Latin fonts and a Chinese script font.
  - You can extend the font list in `FONTS` (in `app/api/sign/route.ts` and
    corresponding UI options).

- **Hanzi stroke data**
  - Hanzi mode relies on an external dataset fetched by `lib/hanzi-data.ts`.
  - When data loading fails, the app gracefully falls back to standard glyph
    outlines.

This README is intended as a living technical document of the current
implementation and should serve as a reference for future refactors, feature
work (such as animated GIF export), additional themes/textures, and broader
language support.
