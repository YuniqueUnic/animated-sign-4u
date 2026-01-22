# Animated Sign 4u

Animated Sign 4u 是一款交互式网页应用与 HTTP API，用于生成**动画签名
SVG**及**静态 PNG/GIF 导出**，具备以下功能：

- 手写字体/品牌字体及自定义字体上传
- 逐字符颜色与渐变效果
- 可选的汉字逐笔动画
- 卡片式背景与纹理（网格、圆点、田字格、米字格等）
- 填充/描边联动模式
- 响应式的桌面与移动端界面

本文档描述了基于本仓库实际源代码、版本 `0.2.4` 的**当前实现**。

---

## 1. 技术栈

- **框架**：Next.js 16（App Router）
- **语言**：TypeScript + React 19
- **样式与 UI**
  - Tailwind CSS 4、`tailwindcss-animate`
  - Radix UI 基础组件（Slider、Switch、Select、DropdownMenu 等）
  - `components/ui` 下的自定义 UI 基础组件（如 `Button`、`ResizablePanel`）
- **SVG 与字体**
  - `opentype.js` – 加载并度量字体，构建字形路径
  - `svg-path-properties` – 在 API 流程中计算路径长度
  - `lib/svg-generator.tsx` 中的自定义 SVG 生成器
- **光栅导出**
  - `sharp` – 在服务器端将 SVG 渲染为 PNG / GIF（单帧）
- **国际化与主题**
  - 自定义 i18n 提供器（`components/i18n-provider.tsx`、`lib/i18n.ts`）
  - 暗黑/浅色主题使用 `next-themes`
- **测试**
  - Vitest（`vitest`、`@vitest/ui`、`@vitest/coverage-v8`）

---

## 2. 高层架构

### 2.1 源代码结构

```text
app/
  layout.tsx         – 根布局（主题 + i18n 提供器）
  page.tsx           – Landing（快速模式）
  editor/page.tsx    – 高级编辑器（桌面 + 移动端）
  [text]/route.ts    – 根级短分享链接路由（按参数重定向到 landing/editor）
  api/sign/route.ts  – 签名生成 API（SVG / PNG / GIF / JSON）

components/
  i18n-provider.tsx          – 语言上下文 + `t(key)` 翻译辅助函数
  theme-provider.tsx         – 暗色/浅色主题提供器
  signature-builder/
    sidebar.tsx              – 桌面侧边栏（内容、参数、主题、样式）
    sidebar-content-section.tsx
    sidebar-params-section.tsx
    sidebar-themes-section.tsx
    sidebar-style-section.tsx
    preview-area.tsx         – 带缩放/卡片/阴影的 SVG 预览
    mobile-drawer-sidebar.tsx– 移动端侧边栏（可滑动抽屉）
    code-panel.tsx           – 带语法高亮的代码/API 面板

lib/
  constants.ts       – `INITIAL_STATE`、主题预设、字体列表
  types.ts           – 核心类型（`SignatureState`、`FillMode`、...）
  i18n.ts            – 翻译消息与 `translate()`
  svg-generator.tsx  – 生成 SVG 标记的纯函数
  hanzi-data.ts      – 获取并缓存汉字笔画数据
  state-from-query.ts – 将 URLSearchParams 解析为 `SignatureState`（API 与 UI 共用）
  api-url.ts         – 从 `SignatureState` 构建 `/api/sign` URL
  code-generators.tsx– 从 SVG 生成 React/Vue/JS 组件

tests/
  api/               – `buildStateFromQuery`、`buildPaths`、API URL 的测试
  lib/               – SVG 生成器、i18n、代码生成器的测试
```

### 2.2 职责与数据流

运行时，应用围绕单个 `SignatureState` 对象运作。

```text
+---------+        +-----------------+        +-----------------+
|  用户   | -----> |   React UI      | -----> | SignatureState  |
+---------+        | (app/page.tsx / |        +-----------------+
                   | app/editor/* )  |
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

HTTP 客户端：

  客户端 ----> GET /api/sign?... ----> buildStateFromQuery
                                       buildPaths (opentype.js)
                                       generateSVG
                                       （可选的 sharp 光栅化）
```

- **UI 层**
  - **Landing（`app/page.tsx`）**：快速模式——输入 → 预览 → 快捷主题 →
    复制嵌入代码。
  - **高级编辑器（`app/editor/page.tsx` + `components/signature-builder/*`）**
    - 通过 `useState(INITIAL_STATE)` 在 React state 中保存 `SignatureState`。
    - 通过传递给侧边栏各区域和预览的 `updateState(partial)` 回调进行变更。
    - 渲染内容：
      - 桌面布局：左侧边栏、中央预览、底部代码面板。
      - 移动端布局：预览 + 底部可调整抽屉 + 全屏代码覆盖层。

- **预览与渲染（`preview-area.tsx` + `lib/svg-generator.tsx`）**
  - 从字体数据和 `SignatureState` 构建字形或汉字笔画路径。
  - 计算紧贴文本的 `viewBox`，然后调用 `generateSVG()`。
  - 显示包含卡片背景、纹理与动画的 `<svg>`。

- **API（`app/api/sign/route.ts`）**
  - 将查询参数解析为 `SignatureState`（`buildStateFromQuery`）。
  - 加载字体、构建路径与 `viewBox`（`buildPaths`）。
  - 返回：
    - 动画 SVG 标记
    - 静态 PNG 或静态 GIF（最后一帧快照）
    - 调试 JSON，包含 `paths` + `viewBox`

- **短分享链接（`app/[text]/route.ts`）**
  - 处理 `/Signature` 或 `/Signature?font=...` 这类更友好的路径。
  - 默认发出 308 重定向到 `/`（landing），保留所有查询参数，并将路径段写入
    `text` 查询参数。
  - 当查询参数包含 `ui=editor` 时，改为重定向到
    `/editor`（便于分享高级编辑器链接）。
  - 这样保持 `/api/sign` 作为唯一 HTTP API 端点，同时为 UI 提供可分享的短链接。

- **API URL 辅助函数（`lib/api-url.ts`）**
  - 将当前 `SignatureState` 序列化为 `/api/sign` URL。
  - 确保可往返映射，并通过测试验证。

---

## 3. 核心数据模型：`SignatureState`

定义于 `lib/types.ts`：

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
  speed: number; // 速度系数：值越大 = 动画越快
  charSpacing: number; // 基础字符间距，支持语言感知

  // 背景卡片
  bg: string;
  bg2: string;
  bgMode: "solid" | "gradient";
  bgTransparent: boolean;
  borderRadius: number;
  cardPadding: number;
  bgSizeMode: "auto" | "custom";
  bgWidth: number | null;
  bgHeight: number | null;

  // 描边
  stroke: string;
  strokeEnabled: boolean;
  strokeMode: StrokeMode;
  stroke2: string;
  strokeCharColors: string[];

  // 填充
  fillMode: FillMode;
  fill1: string;
  fill2: string;
  charColors: string[];

  // 纹理叠加
  texture: TextureType;
  texColor: string;
  texSize: number;
  texThickness: number;
  texOpacity: number;

  // 特效
  useGlow: boolean;
  useShadow: boolean;

  // 为 true 时，描边跟随填充模式与颜色
  linkFillStroke: boolean;

  // 汉字逐笔模式
  useHanziData?: boolean;
}
```

- `lib/constants.ts` 中的 `INITIAL_STATE` 同时用于客户端 UI 与 API。
- 主题预设（`THEMES`）表示为部分 `SignatureState` 对象。

---

## 4. 路径构建与 SVG 生成

有两个紧密相关的流程用于构建文本/描边路径并渲染 SVG：

- **UI 流程** – 用于页面预览（`preview-area.tsx`）。
- **API 流程** – 用于 `/api/sign` 的服务端渲染（`route.ts`）。

两者使用相同的概念步骤：

1. 将文本转换为字形或汉字笔画。
2. 计算每条路径的几何信息（`d`、`len`、字符索引）。
3. 计算带内边距的边界框与 `viewBox`。
4. 将所有内容传入 `generateSVG(state, paths, viewBox, options)`。

### 4.1 UI 路径构建（`components/signature-builder/preview-area.tsx`）

来自 `buildSvg` 逻辑的简化伪代码：

```ts
const glyphs = fontObj.stringToGlyphs(state.text || "Demo");
const paths: PathData[] = [];
let cursorX = 10;
let [minX, minY, maxX, maxY] = [Infinity, Infinity, -Infinity, -Infinity];

for each glyph (idx, char) {
  if (state.useHanziData && isChinese(char)) {
    const hanziData = await fetchHanziData(char);

    for each stroke in hanziData.strokes {
      const d = stroke.path;          // 来自数据集的原始 SVG 路径
      const len = measureLength(d);   // 基于 DOM 的度量

      updateBoundingBox(d);
      paths.push({ d, len, index: idx, isHanzi: true, ... });
    }
  } else {
    const glyphPath = glyph.getPath(cursorX, baselineY, state.fontSize);
    const d = glyphPath.toPathData(2);
    const bbox = glyphPath.getBoundingBox();

    使用 bbox 更新全局 [minX, minY, maxX, maxY];
    const len = measureLength(d); // 通过隐藏的 <svg> + <path>

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

移动端预览使用类似的调用，但传递不同的 `idPrefix`（如
`"mobile-"`），以保持不同实例间 SVG `id` 属性的唯一性。

### 4.2 API 路径构建（`app/api/sign/route.ts`）

在服务端，`buildPaths(font, state)` 使用 `opentype.js` 与
`svg-path-properties`（无 DOM）执行相同的概念性工作。

- 计算每个字符的字形路径与长度。
- 应用与 UI 相同的**语言感知字符间距**规则。
- 生成包含文本与内边距的 `viewBox`。
- 返回供 API 路由中 `generateSVG` 使用的 `{ paths, viewBox }`。

### 4.3 `generateSVG`（`lib/svg-generator.tsx`）

`generateSVG` 是一个纯函数，接收当前视觉状态与路径数据，返回完整的 `<svg>`
字符串。

**输入**

```ts
function generateSVG(
  state: SignatureState,
  paths: PathData[],
  viewBox: { x: number; y: number; w: number; h: number },
  options?: { staticRender?: boolean; idPrefix?: string },
): string;
```

**输出**

- `<svg>` 根节点，包含计算出的 `viewBox` 与 width/height 属性。
- `<defs>` 包含：
  - 背景渐变（若 `bgMode === "gradient"`）。
  - 填充/描边渐变（若 `fillMode`/`strokeMode` 为 `"gradient"`）。
  - 发光与阴影的滤镜定义。
  - 纹理图案（`pattern`），支持 grid/dots/lines/cross/tianzige/mizige。
  - 按路径绘制与填充渐显动画的 `@keyframes`。
- 背景卡片 `<rect>`（可选透明或渐变填充）。
- 锚定在该卡片上的内部纹理叠加 `<rect>`。
- 一个 `<g>`，包含每条字形/笔画的一个 `<path>`，带有内联动画样式。

**关键步骤（伪代码）**

```ts
// 画布与文本偏移
let canvasWidth = viewBox.w;
let canvasHeight = viewBox.h;
let textOffsetX = 0;
let textOffsetY = 0;

const hasHanzi = paths.some((p) => p.isHanzi);
if (hasHanzi) {
  // 将汉字文本上移以获得更好的视觉居中效果
  textOffsetY -= canvasHeight * 0.04;
}

// 使纹理图案相对于 SVG 画布居中
let patternOffsetX = 0;
let patternOffsetY = 0;
if (state.texture !== "none") {
  const s = Math.max(1, state.texSize || 1);
  patternOffsetX = -((canvasWidth % s) / 2);
  patternOffsetY = -((canvasHeight % s) / 2);
}

// 构建 <defs>
if (state.fillMode === "gradient") defineFillGradient();
if (state.strokeEnabled && state.strokeMode === "gradient") defineStrokeGradient();
if (!state.bgTransparent && state.bgMode === "gradient") defineBackgroundGradient();
if (state.useGlow) defineGlowFilter();
if (state.useShadow) defineShadowFilter();
if (state.texture !== "none") defineTexturePatterns(patternOffsetX, patternOffsetY);

// 动画时间 – speed 是一个*系数*：越大 = 越快
const speedFactor = state.speed || 1;
const charDuration = 1 / Math.max(0.01, speedFactor); // 每字符秒数

// 按字符索引对路径分组，使同一字符的所有笔画一起动画
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

// 构建带填充/描边与动画的路径元素
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

// 背景卡片 – 居中且可选自定义尺寸
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

// 卡片内部的纹理叠加
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

### 4.4 汉字笔画方向与坐标系

- 汉字笔画路径来自一个 Y 轴为从上到下的数据集。
- 为了将其渲染在与拉丁字形相同的坐标系中，`generateSVG` 会应用：
  - 在适当原点的垂直翻转 `scale(1, -1)`。
  - 平移偏移（如 `translate(0, -1024)`）以匹配数据集的坐标空间。
- 对于动画方向：
  - 对于普通字形，`strokeDashoffset` 从 `+len` 动画到 `0`。
  - 对于汉字笔画，`strokeDashoffset` 从 `-len`
    开始，使感知到的绘制方向遵循自然笔顺。

---

## 5. API:`/api/sign`

实现文件：`app/api/sign/route.ts`。

该路由是一个 Next.js App Router 处理器，公开单个 `GET` 端点。

### 5.1 `buildStateFromQuery`

定义于 `lib/state-from-query.ts` 的 `buildStateFromQuery(params)` 负责：

1. 从 `INITIAL_STATE` 开始。
2. 可选地应用主题（`theme` 查询参数，从 `THEMES[...]` 合并）。
3. 根据传入的查询参数覆盖字段。

重要查询参数（名称与语义）：

- **内容与字体**
  - `text`：签名文本
  - `font`：供 `loadFont` 使用的字体 id

- **几何与动画**
  - `fontSize`：数字
  - `speed`：动画**速度因子**（`> 0`，越大 = 越快）
  - `charSpacing`：基础字符间距（后续应用语言感知缩放）
  - `borderRadius`：卡片圆角半径
  - `cardPadding`：文本与卡片边缘之间的内边距

- **填充与描边**
  - `fill`：`single | gradient | multi` 之一
  - `fill1`、`fill2`：主/次填充颜色
  - `colors`：逗号分隔的逐字符填充颜色（`#rrggbb`），隐含 `fillMode="multi"`
  - `stroke`、`stroke2`：描边颜色
  - `strokeMode`：`single | gradient | multi` 之一
  - `strokeEnabled`：`"true" | "1" | "false" | "0"`

- **背景**
  - `bg`：`"transparent"` 或十六进制颜色（`#rrggbb` 或 `rrggbb`）
  - `bgMode`：`solid | gradient`
  - `bg2`：渐变副色
  - `bgSizeMode`：`auto | custom`
  - `bgWidth`、`bgHeight`：自定义卡片尺寸（px，在 `viewBox` 内居中）

- **纹理**
  - `texture`：`none | grid | dots | lines | cross | tianzige | mizige`
  - `texColor`：纹理描边颜色
  - `texSize`：纹理缩放
  - `texThickness`：纹理线宽
  - `texOpacity`：0 到 1 的纹理透明度

- **特效与模式**
  - `useGlow`、`useShadow`：`"true" | "1" | "false" | "0"`
  - `useHanziData`：`"true" | "1"`
  - `linkFillStroke`：`"true" | "1" | "false" | "0"`

附加逻辑：

- 当 `fillMode === "multi"` 但 `charColors`
  为空时，从主题函数（`charColorsFn`）或默认调色板派生逐字符颜色。
- 当 `strokeMode === "multi"` 但 `strokeCharColors` 为空时，依次尝试：
  1. 若可用则使用 `theme.strokeCharColorsFn`。
  2. 若 `fillMode === "multi"` 则复用填充模式（`theme.charColorsFn`）。
  3. 从 `state.charColors` 复制。
  4. 回退到循环默认颜色。

### 5.2 `buildPaths` 与 `GET` 处理器

`GET` 处理器执行：

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
    // 静态（非动画）光栅导出
    const staticSvg = generateSVG(state, paths, viewBox, {
      staticRender: true,
    });
    const image = await sharp(Buffer.from(staticSvg))
      [formatParam]() // .png() 或 .gif()
      .toBuffer();
    return new Response(image, { headers: { "Content-Type": contentType } });
  }

  default: {
    // 动画 SVG
    const svg = generateSVG(state, paths, viewBox);
    return new Response(svg, { headers: { "Content-Type": "image/svg+xml" } });
  }
}
```

> **注意**：当前的 GIF 导出是**单帧静态
> GIF**（最终渲染状态的快照）。尚不支持生成动态 GIF。

### 5.3 API URL 构建器（`lib/api-url.ts`）

`buildSignApiUrl(state, options)` 将 `SignatureState` 转换为可复现相同视觉输出的
`/api/sign` URL。

关键细节：

- 序列化所有相关字段，包括：
  - 文本、字体、fontSize、speed、charSpacing
  - 背景颜色、模式、尺寸、透明度
  - 填充/描边模式、颜色、多色数组
  - 纹理类型与参数
  - 特效开关（`useGlow`、`useShadow`）
  - `useHanziData`、`linkFillStroke`
- 使用提供的 `origin` 或默认为：

  ```ts
  const origin = options.origin ??
    (typeof window !== "undefined"
      ? window.location.origin
      : "https://sign.yunique.top");
  ```

- 测试文件 `tests/api/api-url-roundtrip.test.ts` 验证：
  - 文档中的示例 URL 可被正确解析。
  - `state -> URL -> state` 可往返且不丢失核心字段。

---

## 6. UI 行为

### 6.1 顶部栏（桌面与移动端）

文件：`components/app-top-bar.tsx`（被 `app/page.tsx` 与 `app/editor/page.tsx`
复用）。

顶部栏在桌面与移动端布局中共享，包含：

- **左侧**
  - 内含 `4U` 的小方块 logo。
  - 本地化应用标题（`appTitle`）。

- **右侧**
  - 语言切换（`EN` / `中文`），由 `i18n-provider` 支持。
  - 主题切换（太阳/月亮），使用 `next-themes`。
  - GitHub 仓库按钮：

    ```tsx
    <Button
      asChild
      variant="ghost"
      size="icon-sm"
      className="h-8 w-8 text-xs inline-flex"
    >
      <a
        href="https://github.com/YuniqueUnic/animated-sign-4u "
        target="_blank"
        rel="noreferrer"
        aria-label={t("githubRepoLabel")}
      >
        <Github className="h-4 w-4" />
      </a>
    </Button>;
    ```

  - 桌面下载按钮：悬停打开包含所有下载选项的面板（React、Vue、JS、SVG、PNG、GIF）。
  - 移动端下载下拉框 + “代码”按钮，打开包含 `CodePanel` 的全屏覆盖层。

### 6.2 桌面布局

```text
+-------------------------------------------------------------+
| 顶部栏（logo、语言、主题、GitHub、下载）                       |
+----------------------+--------------------------------------+
| 侧边栏                | 预览与 CodePanel                      |
| - 内容与字体          | - PreviewArea（顶部，可调整大小）      |
| - 参数                | - CodePanel（底部，可调整大小）       |
| - 快速主题            |                                      |
| - 样式与颜色          |                                      |
+----------------------+--------------------------------------+
```

- `Sidebar`（`components/signature-builder/sidebar.tsx`）包含四个逻辑部分（每个单独成文件）：
  - **内容与字体** – 签名文本、字体选择、自定义字体上传。
  - **参数** – 字体大小、动画速度、字符间距、汉字笔画模式。
  - **快速主题** – 主题预设，带小卡片与纹理预览。
  - **样式与颜色** – 背景、纹理、填充/描边颜色、特效。

- `PreviewArea` 渲染带卡片、纹理与缩放控件的动画 SVG。
  - 缩放范围受限（如 0.1×–4×），并应用于整个卡片，包括阴影与纹理。

- `CodePanel` 显示：
  - 当前 SVG 标记
  - 由 `lib/code-generators.tsx` 生成的示例 React / Vue / JS 包装组件
  - 由 `buildSignApiUrl` 构建的 API URL

### 6.3 移动端布局

```text
+--------------------------------------------------+
| 顶部栏                                           |
+--------------------------------------------------+
| PreviewArea（缩放 + 动画 SVG）                   |
+--------------------------------------------------+
| 可调整底部面板（MobileDrawerSidebar）            |
|  - 水平滑动切换分区                              |
|  - 分区与桌面侧边栏标签对应                      |
+--------------------------------------------------+
```

移动端抽屉实现：

- 可拖动调整高度的底部面板。
- 左右滑动切换分区（内容、参数、主题、样式）。
- 特殊处理以避免水平滑动与滑块冲突：
  - 若指针/触摸起始于滑块（`[data-slot="slider"]`），则禁止滑动切换分区。

### 6.4 字符间距（语言感知）

UI 与 API 使用相同函数将 `state.charSpacing` 转换为实际间距：

```ts
const baseSpacing = state.charSpacing || 0;
let spacing = baseSpacing;

if (baseSpacing !== 0 && char && isChinese(char)) {
  // 汉字视觉上更宽；调整缩放
  spacing = baseSpacing > 0 ? baseSpacing / 5 : baseSpacing * 5;
}
```

- **拉丁文本**间距按原样应用。
- **汉字**：
  - 间距为负时放大（×5），以便快速压缩文本。
  - 间距为正时缩小（÷5），避免间隙过大。

`tests/api/char-spacing.test.ts` 中的单元测试确保此逻辑按预期工作。

### 6.5 动画速度（越大 = 越快）

- UI 将速度标记为 `X.XXx`（如 `1.00x`、`2.00x`）。
- 滑块范围：约 `0.25`–`3.00`。
- 在 SVG 生成器中，速度被解释为**速度因子**：

  ```ts
  const speedFactor = state.speed || 1;
  const charDuration = 1 / Math.max(0.01, speedFactor); // 每字符秒数
  ```

  - `speed = 1.0` → 约每秒每字符。
  - `speed = 2.0` → 约每半秒每字符。
  - `speed = 0.5` → 约每 2 秒每字符。

### 6.6 填充/描边联动模式

在“样式与颜色”部分，有一个开关用于启用**填充/描边联动模式**：

- 当 `linkFillStroke` 为 `true` 时：
  - `strokeMode` 镜像 `fillMode`。
  - `stroke` 与 `stroke2` 镜像 `fill1` 与 `fill2`。
  - 在多色模式下，`strokeCharColors` 镜像 `charColors`。
  - 描边控件在视觉上被禁用（降低透明度与指针事件），表示描边由填充派生。

`sidebar-style-section.tsx` 中的辅助函数 `withLinkedStroke(patch)`
在以下情况应用正确的描边设置：

- 填充模式变更（single/gradient/multi）。
- 填充颜色（`fill1`、`fill2`）变更。
- 在多色模式下更新逐字符颜色。

`linkFillStroke` 也通过 API 与 URL 构建器往返，使服务端渲染输出与预览一致。

---

## 7. 主题与纹理

### 7.1 主题（`lib/constants.ts`）

- `THEMES` 是从主题键到部分 `SignatureState` 值的映射。
- 典型主题字段：
  - `bg`、`bg2`、`bgMode`、`bgTransparent`、`borderRadius`、`texture`
  - `fillMode`、`fill1`、`fill2`、`stroke`、`strokeMode`、`strokeEnabled`
  - `cardPadding`、`bgSizeMode`、`speed` 等。
- 部分主题提供函数：
  - `charColorsFn(text: string): string[]`
  - `strokeCharColorsFn(text: string): string[]`

当填充或描边处于多色模式且未提供显式的逐字符数组时，会使用这些函数。

### 7.2 纹理（`lib/svg-generator.tsx`）

纹理在 `<defs>` 中实现为 `<pattern>` 定义，并通过在背景卡片内的叠加 `<rect>`
上使用 `fill="url(#pattern-id)"` 来应用。

支持的纹理（`TextureType`）：

- `grid`
- `dots`
- `lines`
- `cross`
- `tianzige`（方形练习格）
- `mizige`（对角线练习格）

附加参数：

- `texColor`：描边颜色
- `texSize`：图案瓦片尺寸
- `texThickness`：线宽
- `texOpacity`：叠加层透明度

快速主题侧边栏使用 CSS `background-image` 可视化这些纹理，而实际 SVG 输出使用
`getTextureDefs` 辅助函数生成真正的矢量图案。

---

## 8. 测试

主要测试套件包括：

- `tests/api/buildStateFromQuery.test.ts`
  - 验证所有主要查询参数可正确解析为 `SignatureState`。
  - 覆盖主题、默认值、背景尺寸、纹理、特效与多色数组。

- `tests/api/buildPaths.test.ts`
  - 确保路径与 `viewBox` 构建的一致性。
  - 验证 `charSpacing` 如何影响总宽度。

- `tests/api/char-spacing.test.ts`
  - 专注于英文与中文文本的语言特定间距。

- `tests/api/api-url-roundtrip.test.ts`
  - 测试长示例 URL 以确保完整状态重建。
  - 验证 `state -> URL -> state` 可往返且不丢失核心字段。

- `tests/lib/svg-generator.test.ts`
  - 覆盖纹理图案、渐变与描边 dashoffset 逻辑。
  - 检查基于 `idPrefix` 的作用域隔离，避免多 SVG
    实例冲突（如桌面与移动端预览）。

运行测试：

```bash
pnpm test
# 或
npm test
```

---

## 9. 开发环境与本地运行

### 9.1 安装与开发服务器

```bash
pnpm install          # 或 npm install / yarn
pnpm dev              # 或 npm run dev

# 应用默认运行在 http://localhost:3000
```

### 9.2 生产构建

```bash
pnpm build
pnpm start
```

### 9.3 包脚本（`package.json`）

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

## 10. 限制与未来工作

- **动态 GIF 导出**
  - 当前 `format=gif` 返回从最终 SVG 状态生成的单帧静态 GIF。
  - 真正的动态 GIF 流程需要：
    - 沿动画时间轴采样多帧 SVG。
    - 使用 `sharp` 或其他编码器将其编码为多帧动态 GIF。
    - 仔细平衡帧数、分辨率与文件大小。

- **字体**
  - 应用内置若干拉丁字体与中文字体。
  - 可在 `FONTS` 中扩展字体列表（位于 `app/api/sign/route.ts` 与相应 UI
    选项中）。

- **汉字笔画数据**
  - 汉字模式依赖 `lib/hanzi-data.ts` 获取的外部数据集。
  - 数据加载失败时，应用会优雅地回退到标准字形轮廓。

本 README 旨在作为当前实现的动态技术文档，应作为未来重构、功能开发（如动态 GIF
导出）、新增主题/纹理以及更广泛语言支持的参考。
