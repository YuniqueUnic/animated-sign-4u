# Animated Sign 4u

<div style="display: flex; justify-content: center;">
  <a href="./README.md">English</a>
    <a style="margin-left: 8px; margin-right: 8px;">|</a>
  <a href="./README.ZH.md">中文介绍</a>
</div>

<a href="https://signature4u.vercel.app/%E4%B8%BA%E4%BD%A0%E7%AD%BE%E5%90%8D?font=dancing-script&fontSize=120&speed=1.4&charSpacing=100&borderRadius=8&cardPadding=24&fill=multi&fill1=e56666&fill2=ec4899&stroke=e56666&stroke2=ec4899&strokeMode=multi&strokeEnabled=1&bg=transparent&bgMode=solid&bg2=e5e7eb&texture=lines&texColor=3b82f6&texSize=35&texThickness=3&texOpacity=0.2&colors=614c4c-e56666-462525-e56666&useHanziData=true&linkFillStroke=1">
  <img src="https://sign.yunique.top/api/sign?text=%E4%B8%BA%E4%BD%A0%E7%AD%BE%E5%90%8D&font=dancing-script&fontSize=120&speed=1.4&charSpacing=100&borderRadius=8&cardPadding=24&fill=multi&fill1=e56666&fill2=ec4899&stroke=e56666&stroke2=ec4899&strokeMode=multi&strokeEnabled=1&bg=transparent&bgMode=solid&bg2=e5e7eb&texture=lines&texColor=3b82f6&texSize=35&texThickness=3&texOpacity=0.2&colors=614c4c-e56666-462525-e56666&useHanziData=true&linkFillStroke=1" align="right" width="320" alt="Animated Sign ZH" />
</a>

> [!NOTE]
> website: [Animated Sign 4u](https://signature4u.vercel.app/)
>
> 你看到的动态签名正是本项目提供的!!!

Animated Sign 4u 是一款用于生成**动画签名 SVG**和**静态 PNG/GIF**图像的小型 Next.js 应用与 HTTP API。

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
  page.tsx           – 主构建器 UI（桌面 + 移动端）
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
UI（page.tsx）  --SignatureState-->  PreviewArea
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

### 3.2 预览渲染（UI）

`preview-area.tsx` 中的简化流程：

```ts
const glyphs = font.stringToGlyphs(state.text || "Demo");
const { paths, viewBox } = buildPathsInBrowser(glyphs, state);
const svg = generateSVG(state, paths, viewBox, { idPrefix: "desktop-" });
```

- 拉丁文本的字形路径来自 `opentype.js`。
- 当 `useHanziData=true` 时，中文文本的笔画数据通过 `hanzi-data.ts` 获取，每个笔画成为独立路径。
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
  case "json":  return { paths, viewBox };
  case "png":   return sharp(staticSvg).png();
  case "gif":   return sharp(staticSvg).gif();
  default:       return animatedSvg;
}
```

- `buildStateFromQuery` 合并 `INITIAL_STATE`、可选的 `theme` 和查询参数。
- `buildPaths` 使用 `svg-path-properties` 计算路径长度。
- `generateSVG` 在 PNG/GIF 情况下以 `staticRender=true` 调用（单帧快照）。

> **注意**：GIF 导出目前为**静态**（单帧）。动态 GIF 输出需要沿动画时间轴采样多帧，尚未实现。

---

## 4. HTTP API

### 4.1 端点

HTTP API 通过单一端点对外提供服务：

| 方法 | 路径        | 描述                                           |
| ---- | ----------- | ---------------------------------------------- |
| GET  | `/api/sign` | 通过查询参数生成签名（SVG / PNG / GIF / JSON） |

此外，应用还支持形如 `/{text}` 的短**分享链接**（例如
`http://domain.com/Signature?font=sacramento`）。这些链接始终重定向到前端构建器
页面 `/`，并使用相同的查询参数初始化 UI 状态，适合在浏览器中分享配置。但它们
本身不再作为 HTTP API 端点使用。

### 4.2 核心查询参数

以下是重要参数的精简列表。所有参数均为可选；未指定的字段回退到 `INITIAL_STATE` 或主题默认值。

| 参数                   | 类型/值                                                        | 描述                                        |
| ---------------------- | -------------------------------------------------------------- | ------------------------------------------- |
| `text`                 | 字符串                                                         | 签名文本                                    |
| `font`                 | 字符串（字体 id）                                              | 来自 `lib/constants.ts` 中 `FONTS` 的字体键 |
| `theme`                | 字符串                                                         | 来自 `THEMES` 的主题键                      |
| `format`               | `svg`（默认）\|`png`\|`gif`\|`json`                            | 输出格式                                    |
| `fontSize`             | 大于 0 的数字                                                  | 字体大小                                    |
| `speed`                | 大于 0 的数字                                                  | 动画速度**系数**（值越大 = 越快）           |
| `charSpacing`          | 数字                                                           | 基础字符间距（语言感知缩放）                |
| `fill`                 | `single`\|`gradient`\|`multi`                                  | 填充模式                                    |
| `fill1` / `fill2`      | 颜色（如 `ff0000` 或 `#ff0000`）                               | 主/次填充颜色                               |
| `colors`               | `c1-c2-...`                                                    | 逐字符填充颜色（启用多色模式）              |
| `stroke` / `stroke2`   | 颜色                                                           | 描边颜色                                    |
| `strokeMode`           | `single`\|`gradient`\|`multi`                                  | 描边模式                                    |
| `strokeEnabled`        | `0`/`1`/`false`/`true`                                         | 开关描边                                    |
| `bg`                   | `transparent` 或颜色                                           | 背景颜色/透明度                             |
| `bgMode`               | `solid`\|`gradient`                                            | 背景模式                                    |
| `bg2`                  | 颜色                                                           | 渐变副色                                    |
| `bgSizeMode`           | `auto`\|`custom`                                               | 自动卡片尺寸或固定卡片尺寸                  |
| `bgWidth` / `bgHeight` | 大于 0 的数字                                                  | 自定义卡片尺寸（居中）                      |
| `borderRadius`         | 大于等于 0 的数字                                              | 卡片圆角半径                                |
| `cardPadding`          | 大于等于 0 的数字                                              | 纹理叠加使用的内边距                        |
| `texture`              | `none`\|`grid`\|`dots`\|`lines`\|`cross`\|`tianzige`\|`mizige` | 纹理叠加类型                                |
| `texColor`             | 颜色                                                           | 纹理颜色                                    |
| `texSize`              | 大于 0 的数字                                                  | 纹理缩放                                    |
| `texThickness`         | 大于 0 的数字                                                  | 纹理线宽                                    |
| `texOpacity`           | 0 到 1                                                         | 纹理透明度                                  |
| `useGlow`              | `0`/`1`/`false`/`true`                                         | 启用发光效果                                |
| `useShadow`            | `0`/`1`/`false`/`true`                                         | 启用阴影效果                                |
| `useHanziData`         | `0`/`1`/`false`/`true`                                         | 对汉字使用笔画数据                          |
| `linkFillStroke`       | `0`/`1`/`false`/`true`                                         | 使描边跟随填充模式/颜色                     |

> 关于完整的最新默认值，请参见 `lib/state-from-query.ts` 中的 `buildStateFromQuery`。

### 4.3 请求示例

- **简单 SVG（HTTP API）**

  ```text
  /api/sign?text=Alice&font=great-vibes
  ```

- **短分享链接（打开 Web 构建器）**

  ```text
  /Alice?font=great-vibes
  ```

  该链接会重定向到 `/`，并用相同的配置初始化交互式构建器。若只需要纯 HTTP API
  响应，请使用上面的 `/api/sign` 形式。在应用内，右上角的 **分享** 按钮会为当前
  配置生成并复制这类短分享链接。

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