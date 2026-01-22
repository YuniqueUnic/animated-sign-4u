<div align="center">
  <img src="https://sign.yunique.top/api/sign?text=Animated+Signature+4u&font=pacifico&fontSize=101&speed=7.6&charSpacing=0&borderRadius=4&cardPadding=24&fill=gradient&fill1=facc15&fill2=d946ef&stroke=facc15&stroke2=333333&strokeMode=single&strokeEnabled=1&bg=transparent&bgMode=gradient&bg2=1e293b&texture=cross&texColor=050910&texSize=38&texThickness=1&texOpacity=0.2&useGlow=1" align="center"  alt="Animated Sign 4u" />
  </br>
  <div style="display: flex; justify-content: center;">
    <a href="./README.md">English</a>
      <a style="margin-left: 8px; margin-right: 8px;">|</a>
    <a href="./README.ZH.md">中文介绍</a>
  </div>
  </br>
</div>

<a href="https://signature4u.vercel.app/%E4%B8%BA%E4%BD%A0%E7%AD%BE%E5%90%8D?font=ma-shan-zheng&fontSize=120&speed=0.6&charSpacing=-2&borderRadius=8&cardPadding=24&fill=multi&fill1=d9534f&fill2=ec4899&stroke=d9534f&stroke2=ec4899&strokeMode=multi&strokeEnabled=1&bg=transparent&bgMode=solid&bg2=f0f0f0&texture=lines&texColor=d24141&texSize=35&texThickness=1.5&texOpacity=0.4&colors=3e3737-d9534f-403a3a-d9534f&useHanziData=true&linkFillStroke=1">
  <img src="https://signature4u.vercel.app/api/sign?text=%E4%B8%BA%E4%BD%A0%E7%AD%BE%E5%90%8D&font=ma-shan-zheng&fontSize=120&speed=0.6&charSpacing=-2&borderRadius=8&cardPadding=24&fill=multi&fill1=d9534f&fill2=ec4899&stroke=d9534f&stroke2=ec4899&strokeMode=multi&strokeEnabled=1&bg=transparent&bgMode=solid&bg2=f0f0f0&texture=lines&texColor=d24141&texSize=35&texThickness=1.5&texOpacity=0.4&colors=3e3737-d9534f-403a3a-d9534f&useHanziData=true&linkFillStroke=1" align="right" width="320" alt="Animated Sign ZH" />
</a>

> [!NOTE]
> website: [Animated Sign 4u](https://signature4u.vercel.app/)
>
> 你看到的动态签名正是本项目提供的!!!

Animated Sign 4u 是一款用于生成**动画签名 SVG**和**静态 PNG/GIF**图像的小型
Next.js 应用与 HTTP API。

你可以：

- 输入姓名/签名并选择手写字体/品牌字体
  <a href="https://signature4u.vercel.app/Signature?font=sacramento&fontSize=120&speed=3&charSpacing=0&borderRadius=8&cardPadding=24&fill1=d9534f&fill2=ec4899&stroke=d9534f&stroke2=333333&strokeMode=single&strokeEnabled=1&bg=transparent&bgMode=solid&bg2=f0f0f0&texture=mizige&texColor=d24141&texSize=84&texThickness=1.5&texOpacity=0.4&useHanziData=true">
  <img src="https://sign.yunique.top/api/sign?text=Signature&font=sacramento&fontSize=120&speed=3&charSpacing=0&borderRadius=8&cardPadding=24&fill1=d9534f&fill2=ec4899&stroke=d9534f&stroke2=333333&strokeMode=single&strokeEnabled=1&bg=transparent&bgMode=solid&bg2=f0f0f0&texture=mizige&texColor=d24141&texSize=84&texThickness=1.5&texOpacity=0.4&useHanziData=true" align="right" width="320" alt="Animated Sign EN" />
  </a>

- 应用主题（背景、纹理、发光/阴影）
- 使用逐字符颜色或渐变效果
- 启用汉字逐笔动画
- 导出 SVG / PNG / GIF 或复制 API 链接
- 通过顶部栏的分享按钮生成当前配置的短分享链接

---

## 1. 技术栈

- **框架**：Next.js 16（App Router）
- **语言**：TypeScript + React 19
- **UI**：Tailwind CSS 4、Radix UI、`lucide-react`
- **SVG 与字体**：`opentype.js`、`svg-path-properties`
- **光栅导出**：`sharp`（服务端 PNG/GIF）
- **测试**：Vitest

---

## 2. 项目结构

```text
app/
  layout.tsx         – 根布局（主题 + i18n 提供器）
  page.tsx           – Landing（快速模式）
  editor/page.tsx    – 高级编辑器 UI（桌面 + 移动端）
  [text]/route.ts    – 短分享链接重定向（landing/editor）
  api/sign/route.ts  – 签名生成 API

components/
  i18n-provider.tsx          – 语言环境 + 翻译辅助函数
  theme-provider.tsx         – 暗黑/浅色主题
  signature-builder/
    sidebar-*.tsx            – 内容、参数、主题、样式面板
    preview-area.tsx         – 带缩放功能的实时 SVG 预览
    mobile-drawer-sidebar.tsx– 移动端侧边栏抽屉
    code-panel.tsx           – 代码片段与 API 链接

lib/
  types.ts           – `SignatureState` 与枚举
  constants.ts       – `INITIAL_STATE`、主题、字体
  svg-generator.tsx  – 根据状态与路径生成纯 SVG
  hanzi-data.ts      – 汉字笔画数据辅助函数
  state-from-query.ts – 将 URLSearchParams 解析为 `SignatureState`（API 与 UI 共用）
  api-url.ts         – 从状态构建 `/api/sign` 与短分享链接
  code-generators.tsx– React/Vue/JS 组件生成器
```

高层数据流：

```text
UI (Landing: app/page.tsx) --SignatureState--> buildSignApiUrl --> <img src="/api/sign?...">

UI (Editor: app/editor/page.tsx)  --SignatureState-->  PreviewArea
   ^                                   |
   |                                   v
   +----------- CodePanel <--- buildSignApiUrl

HTTP 客户端 --> /api/sign --> buildStateFromQuery
                             loadFont + buildPaths
                             generateSVG
                             （可选的 sharp PNG/GIF）
```

---

## 3. 工作原理概览

### 3.1 状态

所有视觉选项存储在单个 `SignatureState` 中（见 `lib/types.ts`），包括：

- 文本与字体：`text`、`font`、`fontSize`、`speed`、`charSpacing`
- 背景：`bg`、`bg2`、`bgMode`、`bgTransparent`、`bgSizeMode`、`bgWidth`、`bgHeight`、`borderRadius`、`cardPadding`
- 填充：`fillMode`、`fill1`、`fill2`、`charColors[]`
- 描边：`strokeEnabled`、`strokeMode`、`stroke`、`stroke2`、`strokeCharColors[]`、`linkFillStroke`
- 纹理：`texture`、`texColor`、`texSize`、`texThickness`、`texOpacity`
- 特效：`useGlow`、`useShadow`
- 模式：`useHanziData`

UI 通过 `updateState(partial)` 变更此状态，并将其传递给：

- `PreviewArea` 进行实时渲染
- `CodePanel` 用于生成示例代码和 API 链接
  - Landing（快速模式）则直接使用 `/api/sign` 生成图片 URL 进行预览与嵌入

### 3.2 预览渲染（UI）

`preview-area.tsx` 中的简化流程：

```ts
const glyphs = font.stringToGlyphs(state.text || "Demo");
const { paths, viewBox } = buildPathsInBrowser(glyphs, state);
const svg = generateSVG(state, paths, viewBox, { idPrefix: "desktop-" });
```

- 拉丁文本的字形路径来自 `opentype.js`。
- 当 `useHanziData=true` 时，中文文本的笔画数据通过 `hanzi-data.ts`
  获取，每个笔画成为独立路径。
- `buildPaths` 计算所有字形周围的带内边距的 `viewBox`。
- `generateSVG` 随后：
  - 添加背景矩形（纯色或渐变）与可选纹理图案
  - 计算逐字符动画时间（速度是一个**系数**：值越大 = 越快）
  - 输出每个字形/笔画对应的 `<path>`，带描边-dash 动画
  - 启用时应用发光/阴影滤镜

### 3.3 服务端渲染（API）

API 使用相同概念，但完全在服务端运行：

```ts
const state = buildStateFromQuery(searchParams);
const font = await loadFont(state.font);
const { paths, viewBox } = await buildPaths(font, state);

switch (format) {
  case "json":
    return { paths, viewBox };
  case "png":
    return sharp(staticSvg).png();
  case "gif":
    return generateAnimatedGIF(state, paths, viewBox);
  default:
    return animatedSvg;
}
```

- `buildStateFromQuery` 合并 `INITIAL_STATE`、可选的 `theme` 和查询参数。
- `buildPaths` 使用 `svg-path-properties` 计算路径长度。
- `generateSVG` 在 PNG 情况下以 `staticRender=true` 调用（单帧快照）。
- GIF 导出使用专门的时间轴采样实现（见 `lib/gif-generator.ts`）。

---

## 4. HTTP API

### 4.1 端点

HTTP API 通过单一端点对外提供服务：

| 方法 | 路径        | 描述                                           |
| ---- | ----------- | ---------------------------------------------- |
| GET  | `/api/sign` | 通过查询参数生成签名（SVG / PNG / GIF / JSON） |

此外，应用还支持形如 `/{text}` 的短**分享链接**（例如
`http://domain.com/Signature?font=sacramento`）。这些链接默认重定向到前端
landing 页面 `/`，并使用相同的查询参数初始化 UI 状态；当查询参数包含 `ui=editor`
时会改为 重定向到 `/editor`。它们适合在浏览器中分享配置，但本身不作为 HTTP API
端点使用。

### 4.2 参数与短 key 映射

> 下表由 `lib/api-params.ts` 中的配置通过 `pnpm generate:api-docs` 自动生成，
> 请勿手动修改表格内容。如需调整，请编辑映射定义并重新运行脚本。

<!-- API_PARAM_MAPPING_ZH:START -->

| 参数名             | 短 key | 分组   | 描述                                         |
| ------------------ | ------ | ------ | -------------------------------------------- |
| `文本`             | `t`    | 核心   | 签名文本内容                                 |
| `字体`             | `f`    | 核心   | 要使用的字体 ID，来自 FONTS                  |
| `主题`             | `-`    | 核心   | 可选主题键，来自 THEMES                      |
| `循环播放`         | `r`    | 核心   | 是否循环播放整个动画                         |
| `动画结束后擦除`   | `eo`   | 核心   | 绘制完成后擦除签名，并进入往返轮播模式       |
| `字体大小`         | `fs`   | 布局   | 字体大小（像素）                             |
| `动画速度`         | `sp`   | 布局   | 动画速度系数（值越大动画越快）               |
| `字符间距`         | `cs`   | 布局   | 基础字符间距                                 |
| `卡片圆角`         | `br`   | 布局   | 卡片圆角半径                                 |
| `卡片内边距`       | `cp`   | 布局   | 卡片内边距（纹理可用区域）                   |
| `背景尺寸模式`     | `bgs`  | 布局   | 背景尺寸模式（自动/自定义）                  |
| `背景宽度`         | `bw`   | 布局   | 自定义背景/卡片宽度                          |
| `背景高度`         | `bh`   | 布局   | 自定义背景/卡片高度                          |
| `背景颜色`         | `-`    | 背景   | 背景颜色，或 transparent 表示透明            |
| `背景模式`         | `bm`   | 背景   | 背景模式（纯色/渐变）                        |
| `背景副色`         | `-`    | 背景   | 渐变背景的副颜色                             |
| `填充模式`         | `fm`   | 填充   | 填充模式（单色/渐变/多色）                   |
| `主填充颜色`       | `f1`   | 填充   | 主填充颜色                                   |
| `副填充颜色`       | `f2`   | 填充   | 副填充颜色                                   |
| `逐字符填充颜色`   | `cl`   | 填充   | 逐字符填充颜色列表（启用多色模式）           |
| `主描边颜色`       | `st`   | 描边   | 主描边颜色                                   |
| `副描边颜色`       | `st2`  | 描边   | 副描边颜色                                   |
| `描边模式`         | `sm`   | 描边   | 描边模式（单色/渐变/多色）                   |
| `启用描边`         | `se`   | 描边   | 是否启用描边                                 |
| `填充/描边联动`    | `lfs`  | 描边   | 是否让描边跟随填充模式和颜色                 |
| `纹理类型`         | `tx`   | 纹理   | 背景纹理类型                                 |
| `纹理颜色`         | `txc`  | 纹理   | 纹理颜色                                     |
| `纹理大小`         | `txs`  | 纹理   | 纹理网格尺寸                                 |
| `纹理线宽`         | `txt`  | 纹理   | 纹理线条粗细                                 |
| `纹理不透明度`     | `txo`  | 纹理   | 纹理不透明度（0..1）                         |
| `发光效果`         | `gl`   | 特效   | 是否启用发光效果                             |
| `阴影效果`         | `sh`   | 特效   | 是否启用阴影效果                             |
| `使用汉字笔画数据` | `hz`   | 汉字   | 中文文本是否使用汉字笔画数据进行逐笔绘制     |
| `GIF 帧率`         | `gf`   | GIF    | GIF 帧率（fps）                              |
| `GIF 画质`         | `gq`   | GIF    | GIF 画质（1–20，数值越小画质越好、体积越大） |
| `UI 页面`          | `u`    | 元信息 | 短分享链接重定向时选择 landing 或 editor     |
| `输出格式`         | `fmt`  | 元信息 | 输出格式（svg/png/gif/json）                 |
| `静态 SVG 快照`    | `sta`  | 元信息 | 在使用 SVG 输出时请求静态快照（无动画）      |

<!-- API_PARAM_MAPPING_ZH:END -->

#### 4.2.1 动画循环与擦除行为

有两个核心参数共同控制动画时间轴：

- **循环播放** (`repeat` / `r`)
  - 为 `true` 时：动画时间轴会不断循环。
  - 为 `false` 时：时间轴只播放一轮后停止。
- **动画结束后擦除** (`eraseOnComplete` / `eo`)
  - 启用后，每一轮动画会按以下顺序执行：
    - 路径绘制（stroke 动画）
    - 停留在完整绘制的最终画面
    - 擦除签名，回到初始状态

当 **同时** 开启 `repeat=true` 和 `eraseOnComplete=true` 时：

- 动态 SVG 会持续执行「路径绘制 → 停留 → 擦除」的往复轮播效果。

说明：

- 静态 SVG（`format=svg&static=1`）以及 PNG 静态快照都只导出单帧，
  因此不会受这两个参数影响。
- 动画 GIF 会采样同一条时间轴（路径绘制 → 停留 → 擦除 → 空白），但始终
  循环播放，与 `repeat` 无关；编码器被配置为「永久循环」，以便在聊天窗口
  和浏览器中获得更好的观看体验。

### 4.3 请求示例

- **简单 SVG（HTTP API）**

  ```text
  /api/sign?text=Alice&font=great-vibes
  ```

- **短分享链接（打开 Web 构建器）**

  ```text
  /Alice?font=great-vibes
  ```

  该链接默认会重定向到 `/`（landing / 快速模式），并用相同的配置初始化 UI。
  若查询参数包含 `ui=editor`，则会改为重定向到 `/editor`。

  若只需要纯 HTTP API 响应，请使用上面的 `/api/sign` 形式。在高级编辑器内，
  右上角的 **分享** 按钮会为当前配置生成短分享链接，并附带 `ui=editor`，确保
  接收方直接打开高级编辑器。

- **JSON（路径与 viewBox）**

  ```text
  /api/sign?text=Alice&theme=laser&format=json
  ```

- **自定义背景尺寸与纹理（HTTP API）**

  ```text
  /api/sign?text=Demo&bgSizeMode=custom&bgWidth=800&bgHeight=400&texture=grid&texColor=ffffff&texSize=40&texOpacity=0.4
  ```

- **中文字符与汉字笔画模式（HTTP API）**

  ```text
  /api/sign?text=你好世界&font=ma-shan-zheng&useHanziData=1&fontSize=150
  ```

---

## 5. 开发

```bash
# 安装依赖
pnpm install   # 或 npm install / yarn

# 开发服务器（http://localhost:3000）
pnpm dev

# 生产构建
pnpm build
pnpm start

# 测试
pnpm test
```

---

本 README 有意保持简洁且面向 GitHub。如需深入了解内部机制，请参考：

- `lib/svg-generator.tsx` 了解 SVG 结构与动画时间
- `app/api/sign/route.ts` 了解查询解析与响应格式
- `tests/api/*.test.ts` 与 `tests/lib/*.test.ts` 了解预期行为的可执行示例
