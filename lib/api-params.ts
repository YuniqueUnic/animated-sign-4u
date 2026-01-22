export type ApiParamGroup =
  | "core"
  | "layout"
  | "fill"
  | "stroke"
  | "background"
  | "texture"
  | "effects"
  | "hanzi"
  | "gif"
  | "meta";

const API_PARAM_GROUP_LABEL_ZH: Record<ApiParamGroup, string> = {
  core: "核心",
  layout: "布局",
  fill: "填充",
  stroke: "描边",
  background: "背景",
  texture: "纹理",
  effects: "特效",
  hanzi: "汉字",
  gif: "GIF",
  meta: "元信息",
};

export interface ApiParamDef {
  /** Canonical long key used in documentation and as the primary query key. */
  name: string;
  /** Optional short key for compact URLs. */
  shortKey?: string;
  /**
   * Additional aliases for backwards compatibility.
   * All aliases, the canonical name, and the shortKey share the same semantic meaning.
   */
  aliases?: string[];
  /** Short English description for README tables. */
  description: string;
  group: ApiParamGroup;
  /** Chinese display name for README.ZH tables. */
  zhName?: string;
  /** Chinese description for README.ZH tables. */
  zhDescription?: string;
  /** Chinese label for the group in README.ZH tables. */
  zhGroup?: string;
}

export const API_PARAM_DEFS: ApiParamDef[] = [
  // Core text/font/theme/format
  {
    name: "text",
    shortKey: "t",
    description: "Signature text",
    group: "core",
    zhName: "文本",
    zhDescription: "签名文本内容",
    zhGroup: API_PARAM_GROUP_LABEL_ZH["core"],
  },
  {
    name: "font",
    shortKey: "f",
    description: "Font id from FONTS",
    group: "core",
    zhName: "字体",
    zhDescription: "要使用的字体 ID，来自 FONTS",
    zhGroup: API_PARAM_GROUP_LABEL_ZH["core"],
  },
  {
    name: "theme",
    description: "Optional theme key from THEMES",
    group: "core",
    zhName: "主题",
    zhDescription: "可选主题键，来自 THEMES",
    zhGroup: API_PARAM_GROUP_LABEL_ZH["core"],
  },
  {
    name: "repeat",
    shortKey: "r",
    description: "Whether the animation should loop",
    group: "core",
    zhName: "循环播放",
    zhDescription: "是否循环播放整个动画",
    zhGroup: API_PARAM_GROUP_LABEL_ZH["core"],
  },
  {
    name: "eraseOnComplete",
    shortKey: "eo",
    description: "Erase the signature after drawing (carousel mode)",
    group: "core",
    zhName: "动画结束后擦除",
    zhDescription: "绘制完成后擦除签名，并进入往返轮播模式",
    zhGroup: API_PARAM_GROUP_LABEL_ZH["core"],
  },

  // Layout / geometry
  {
    name: "fontSize",
    shortKey: "fs",
    description: "Font size (px)",
    group: "layout",
    zhName: "字体大小",
    zhDescription: "字体大小（像素）",
    zhGroup: API_PARAM_GROUP_LABEL_ZH["layout"],
  },
  {
    name: "speed",
    shortKey: "sp",
    description: "Animation speed factor (larger = faster)",
    group: "layout",
    zhName: "动画速度",
    zhDescription: "动画速度系数（值越大动画越快）",
    zhGroup: API_PARAM_GROUP_LABEL_ZH["layout"],
  },
  {
    name: "charSpacing",
    shortKey: "cs",
    description: "Base character spacing",
    group: "layout",
    zhName: "字符间距",
    zhDescription: "基础字符间距",
    zhGroup: API_PARAM_GROUP_LABEL_ZH["layout"],
  },
  {
    name: "borderRadius",
    shortKey: "br",
    description: "Card border radius",
    group: "layout",
    zhName: "卡片圆角",
    zhDescription: "卡片圆角半径",
    zhGroup: API_PARAM_GROUP_LABEL_ZH["layout"],
  },
  {
    name: "cardPadding",
    shortKey: "cp",
    description: "Inner padding used by texture overlay",
    group: "layout",
    zhName: "卡片内边距",
    zhDescription: "卡片内边距（纹理可用区域）",
    zhGroup: API_PARAM_GROUP_LABEL_ZH["layout"],
  },
  {
    name: "bgSizeMode",
    shortKey: "bgs",
    description: "Background sizing mode (auto/custom)",
    group: "layout",
    zhName: "背景尺寸模式",
    zhDescription: "背景尺寸模式（自动/自定义）",
    zhGroup: API_PARAM_GROUP_LABEL_ZH["layout"],
  },
  {
    name: "bgWidth",
    shortKey: "bw",
    description: "Custom background/card width",
    group: "layout",
    zhName: "背景宽度",
    zhDescription: "自定义背景/卡片宽度",
    zhGroup: API_PARAM_GROUP_LABEL_ZH["layout"],
  },
  {
    name: "bgHeight",
    shortKey: "bh",
    description: "Custom background/card height",
    group: "layout",
    zhName: "背景高度",
    zhDescription: "自定义背景/卡片高度",
    zhGroup: API_PARAM_GROUP_LABEL_ZH["layout"],
  },

  // Background
  {
    name: "bg",
    description: "Background color or 'transparent'",
    group: "background",
    zhName: "背景颜色",
    zhDescription: "背景颜色，或 transparent 表示透明",
    zhGroup: API_PARAM_GROUP_LABEL_ZH["background"],
  },
  {
    name: "bgMode",
    shortKey: "bm",
    description: "Background mode (solid/gradient)",
    group: "background",
    zhName: "背景模式",
    zhDescription: "背景模式（纯色/渐变）",
    zhGroup: API_PARAM_GROUP_LABEL_ZH["background"],
  },
  {
    name: "bg2",
    description: "Secondary background color for gradients",
    group: "background",
    zhName: "背景副色",
    zhDescription: "渐变背景的副颜色",
    zhGroup: API_PARAM_GROUP_LABEL_ZH["background"],
  },

  // Fill
  {
    name: "fill",
    shortKey: "fm",
    description: "Fill mode (single/gradient/multi)",
    group: "fill",
    zhName: "填充模式",
    zhDescription: "填充模式（单色/渐变/多色）",
    zhGroup: API_PARAM_GROUP_LABEL_ZH["fill"],
  },
  {
    name: "fill1",
    shortKey: "f1",
    description: "Primary fill color",
    group: "fill",
    zhName: "主填充颜色",
    zhDescription: "主填充颜色",
    zhGroup: API_PARAM_GROUP_LABEL_ZH["fill"],
  },
  {
    name: "fill2",
    shortKey: "f2",
    description: "Secondary fill color",
    group: "fill",
    zhName: "副填充颜色",
    zhDescription: "副填充颜色",
    zhGroup: API_PARAM_GROUP_LABEL_ZH["fill"],
  },
  {
    name: "colors",
    shortKey: "cl",
    description: "Per-character fill colors (enables multi mode)",
    group: "fill",
    zhName: "逐字符填充颜色",
    zhDescription: "逐字符填充颜色列表（启用多色模式）",
    zhGroup: API_PARAM_GROUP_LABEL_ZH["fill"],
  },

  // Stroke
  {
    name: "stroke",
    shortKey: "st",
    description: "Primary stroke color",
    group: "stroke",
    zhName: "主描边颜色",
    zhDescription: "主描边颜色",
    zhGroup: API_PARAM_GROUP_LABEL_ZH["stroke"],
  },
  {
    name: "stroke2",
    shortKey: "st2",
    description: "Secondary stroke color",
    group: "stroke",
    zhName: "副描边颜色",
    zhDescription: "副描边颜色",
    zhGroup: API_PARAM_GROUP_LABEL_ZH["stroke"],
  },
  {
    name: "strokeMode",
    shortKey: "sm",
    description: "Stroke mode (single/gradient/multi)",
    group: "stroke",
    zhName: "描边模式",
    zhDescription: "描边模式（单色/渐变/多色）",
    zhGroup: API_PARAM_GROUP_LABEL_ZH["stroke"],
  },
  {
    name: "strokeEnabled",
    shortKey: "se",
    description: "Toggle stroke on/off",
    group: "stroke",
    zhName: "启用描边",
    zhDescription: "是否启用描边",
    zhGroup: API_PARAM_GROUP_LABEL_ZH["stroke"],
  },
  {
    name: "linkFillStroke",
    shortKey: "lfs",
    description: "Link stroke behavior to fill mode/colors",
    group: "stroke",
    zhName: "填充/描边联动",
    zhDescription: "是否让描边跟随填充模式和颜色",
    zhGroup: API_PARAM_GROUP_LABEL_ZH["stroke"],
  },

  // Texture
  {
    name: "texture",
    shortKey: "tx",
    description: "Texture overlay type",
    group: "texture",
    zhName: "纹理类型",
    zhDescription: "背景纹理类型",
    zhGroup: API_PARAM_GROUP_LABEL_ZH["texture"],
  },
  {
    name: "texColor",
    shortKey: "txc",
    description: "Texture color",
    group: "texture",
    zhName: "纹理颜色",
    zhDescription: "纹理颜色",
    zhGroup: API_PARAM_GROUP_LABEL_ZH["texture"],
  },
  {
    name: "texSize",
    shortKey: "txs",
    description: "Texture scale",
    group: "texture",
    zhName: "纹理大小",
    zhDescription: "纹理网格尺寸",
    zhGroup: API_PARAM_GROUP_LABEL_ZH["texture"],
  },
  {
    name: "texThickness",
    shortKey: "txt",
    description: "Texture line thickness",
    group: "texture",
    zhName: "纹理线宽",
    zhDescription: "纹理线条粗细",
    zhGroup: API_PARAM_GROUP_LABEL_ZH["texture"],
  },
  {
    name: "texOpacity",
    shortKey: "txo",
    description: "Texture opacity (0..1)",
    group: "texture",
    zhName: "纹理不透明度",
    zhDescription: "纹理不透明度（0..1）",
    zhGroup: API_PARAM_GROUP_LABEL_ZH["texture"],
  },

  // Effects
  {
    name: "useGlow",
    shortKey: "gl",
    description: "Enable glow effect",
    group: "effects",
    zhName: "发光效果",
    zhDescription: "是否启用发光效果",
    zhGroup: API_PARAM_GROUP_LABEL_ZH["effects"],
  },
  {
    name: "useShadow",
    shortKey: "sh",
    description: "Enable shadow effect",
    group: "effects",
    zhName: "阴影效果",
    zhDescription: "是否启用阴影效果",
    zhGroup: API_PARAM_GROUP_LABEL_ZH["effects"],
  },

  // Hanzi / stroke data
  {
    name: "useHanziData",
    shortKey: "hz",
    description: "Use Hanzi stroke data for Chinese characters",
    group: "hanzi",
    zhName: "使用汉字笔画数据",
    zhDescription: "中文文本是否使用汉字笔画数据进行逐笔绘制",
    zhGroup: API_PARAM_GROUP_LABEL_ZH["hanzi"],
  },

  // GIF export
  {
    name: "gifFps",
    shortKey: "gf",
    description: "GIF frame rate (fps)",
    group: "gif",
    zhName: "GIF 帧率",
    zhDescription: "GIF 帧率（fps）",
    zhGroup: API_PARAM_GROUP_LABEL_ZH["gif"],
  },
  {
    name: "gifQuality",
    shortKey: "gq",
    description: "GIF quality (1-20, higher is better)",
    group: "gif",
    zhName: "GIF 画质",
    zhDescription: "GIF 画质（1–20，数值越小画质越好、体积越大）",
    zhGroup: API_PARAM_GROUP_LABEL_ZH["gif"],
  },

  // Meta / output
  {
    name: "ui",
    shortKey: "u",
    description: "UI hint for short-share redirects (landing/editor)",
    group: "meta",
    zhName: "UI 页面",
    zhDescription: "短分享链接重定向时选择 landing 或 editor",
    zhGroup: API_PARAM_GROUP_LABEL_ZH["meta"],
  },
  {
    name: "format",
    shortKey: "fmt",
    description: "Output format (svg/png/gif/json)",
    group: "meta",
    zhName: "输出格式",
    zhDescription: "输出格式（svg/png/gif/json）",
    zhGroup: API_PARAM_GROUP_LABEL_ZH["meta"],
  },
  {
    name: "static",
    shortKey: "sta",
    description: "Request a static snapshot when using SVG output",
    group: "meta",
    zhName: "静态 SVG 快照",
    zhDescription: "在使用 SVG 输出时请求静态快照（无动画）",
    zhGroup: API_PARAM_GROUP_LABEL_ZH["meta"],
  },
];

export const API_PARAM_BY_NAME: Record<string, ApiParamDef> = {};
export const API_PARAM_BY_KEY: Record<string, ApiParamDef> = {};

(function initMappings() {
  const nameSet = new Set<string>();
  const keySet = new Set<string>();

  for (const def of API_PARAM_DEFS) {
    if (nameSet.has(def.name)) {
      throw new Error(
        `[api-params] Duplicate param name detected: "${def.name}"`,
      );
    }
    nameSet.add(def.name);
    API_PARAM_BY_NAME[def.name] = def;

    const keys: string[] = [def.name];
    if (def.shortKey) keys.push(def.shortKey);
    if (def.aliases && def.aliases.length > 0) {
      keys.push(...def.aliases);
    }

    for (const key of keys) {
      if (keySet.has(key)) {
        throw new Error(
          `[api-params] Duplicate param key "${key}" used by "${def.name}"`,
        );
      }
      keySet.add(key);
      API_PARAM_BY_KEY[key] = def;
    }
  }
})();

/**
 * Resolve the outgoing query key for a given canonical parameter name.
 * Falls back to the name itself when no definition is registered.
 */
export function getOutgoingKey(name: string, useShort: boolean): string {
  const def = API_PARAM_BY_NAME[name];
  if (!def) return name;
  if (useShort && def.shortKey) return def.shortKey;
  return def.name;
}

/**
 * Read a value from URLSearchParams for a given canonical parameter name.
 * It will try the canonical name, all aliases, and the short key.
 */
export function getIncomingValue(
  params: URLSearchParams,
  name: string,
): string | null {
  const def = API_PARAM_BY_NAME[name];
  if (!def) return params.get(name);

  const keys: string[] = [def.name];
  if (def.aliases && def.aliases.length > 0) {
    keys.push(...def.aliases);
  }
  if (def.shortKey) {
    keys.push(def.shortKey);
  }

  for (const key of keys) {
    const v = params.get(key);
    if (v !== null) return v;
  }

  return null;
}
