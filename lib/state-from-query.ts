import { DEFAULT_CHAR_COLORS, INITIAL_STATE, THEMES } from "@/lib/constants";
import { FillMode, SignatureState, TextureType } from "@/lib/types";

export function buildStateFromQuery(params: URLSearchParams): SignatureState {
  let state: SignatureState = { ...INITIAL_STATE };

  const themeKey = params.get("theme");
  const theme = themeKey && themeKey in THEMES ? THEMES[themeKey] : undefined;
  if (theme) {
    state = { ...state, ...theme } as SignatureState;
  }

  const text = params.get("text");
  if (text) {
    state.text = text;
  }

  const font = params.get("font");
  if (font) {
    state.font = font;
  }

  const fontSizeParam = params.get("fontSize");
  if (fontSizeParam) {
    const v = Number(fontSizeParam);
    if (Number.isFinite(v) && v > 0) {
      state.fontSize = v;
    }
  }

  const speedParam = params.get("speed");
  if (speedParam) {
    const v = Number(speedParam);
    if (Number.isFinite(v) && v > 0) {
      state.speed = v;
    }
  }

  const fill = params.get("fill") as FillMode | null;
  if (fill === "single" || fill === "gradient" || fill === "multi") {
    state.fillMode = fill;
  }

  const colorsParam = params.get("colors");
  if (colorsParam) {
    const rawColors = colorsParam.split(/[,-]/);
    const parsed = rawColors
      .map((c) => c.trim())
      .filter(Boolean)
      .map((c) => (c.startsWith("#") ? c : `#${c}`));
    if (parsed.length > 0) {
      state.charColors = parsed;
      state.fillMode = "multi";
    }
  }

  const fill1Param = params.get("fill1");
  if (fill1Param) {
    state.fill1 = fill1Param.startsWith("#") ? fill1Param : `#${fill1Param}`;
  }

  const fill2Param = params.get("fill2");
  if (fill2Param) {
    state.fill2 = fill2Param.startsWith("#") ? fill2Param : `#${fill2Param}`;
  }

  const strokeParam = params.get("stroke");
  if (strokeParam) {
    state.stroke = strokeParam.startsWith("#") ? strokeParam : `#${strokeParam}`;
  }

  const stroke2Param = params.get("stroke2");
  if (stroke2Param) {
    state.stroke2 = stroke2Param.startsWith("#") ? stroke2Param : `#${stroke2Param}`;
  }

  const strokeModeParam = params.get("strokeMode") as
    | "single"
    | "gradient"
    | "multi"
    | null;
  if (
    strokeModeParam === "single" ||
    strokeModeParam === "gradient" ||
    strokeModeParam === "multi"
  ) {
    state.strokeMode = strokeModeParam;
  }

  const strokeEnabledParam = params.get("strokeEnabled");
  if (strokeEnabledParam === "0" || strokeEnabledParam === "false") {
    state.strokeEnabled = false;
  } else if (strokeEnabledParam === "1" || strokeEnabledParam === "true") {
    state.strokeEnabled = true;
  }

  const bgSizeMode = params.get("bgSizeMode");
  if (bgSizeMode === "auto" || bgSizeMode === "custom") {
    state.bgSizeMode = bgSizeMode as any;
  }

  const charSpacing = params.get("charSpacing");
  if (charSpacing) {
    const v = Number(charSpacing);
    if (Number.isFinite(v)) {
      state.charSpacing = v;
    }
  }

  const borderRadiusParam = params.get("borderRadius");
  if (borderRadiusParam) {
    const v = Number(borderRadiusParam);
    if (Number.isFinite(v) && v >= 0) {
      state.borderRadius = v;
    }
  }

  const cardPaddingParam = params.get("cardPadding");
  if (cardPaddingParam) {
    const v = Number(cardPaddingParam);
    if (Number.isFinite(v) && v >= 0) {
      state.cardPadding = v;
    }
  }

  const bgWidthParam = params.get("bgWidth");
  if (bgWidthParam) {
    const v = Number(bgWidthParam);
    if (Number.isFinite(v) && v > 0) {
      state.bgWidth = v;
    }
  }

  const bgHeightParam = params.get("bgHeight");
  if (bgHeightParam) {
    const v = Number(bgHeightParam);
    if (Number.isFinite(v) && v > 0) {
      state.bgHeight = v;
    }
  }

  const bgParam = params.get("bg");
  if (bgParam) {
    if (bgParam === "transparent") {
      state.bgTransparent = true;
    } else {
      state.bgTransparent = false;
      state.bg = bgParam.startsWith("#") ? bgParam : `#${bgParam}`;
    }
  }

  const bgModeParam = params.get("bgMode");
  if (bgModeParam === "solid" || bgModeParam === "gradient") {
    state.bgMode = bgModeParam as any;
  }

  const bg2Param = params.get("bg2");
  if (bg2Param) {
    state.bg2 = bg2Param.startsWith("#") ? bg2Param : `#${bg2Param}`;
  }

  const texture = params.get("texture") as TextureType | null;
  const allowedTextures: TextureType[] = [
    "none",
    "grid",
    "dots",
    "lines",
    "cross",
    "tianzige",
    "mizige",
  ];
  if (texture && allowedTextures.includes(texture)) {
    state.texture = texture;
  }

  const texColorParam = params.get("texColor");
  if (texColorParam) {
    state.texColor = texColorParam.startsWith("#")
      ? texColorParam
      : `#${texColorParam}`;
  }

  const texSizeParam = params.get("texSize");
  if (texSizeParam) {
    const v = Number(texSizeParam);
    if (Number.isFinite(v) && v > 0) {
      state.texSize = v;
    }
  }

  const texThicknessParam = params.get("texThickness");
  if (texThicknessParam) {
    const v = Number(texThicknessParam);
    if (Number.isFinite(v) && v > 0) {
      state.texThickness = v;
    }
  }

  const texOpacityParam = params.get("texOpacity");
  if (texOpacityParam) {
    const v = Number(texOpacityParam);
    if (Number.isFinite(v) && v >= 0 && v <= 1) {
      state.texOpacity = v;
    }
  }

  const useGlowParam = params.get("useGlow");
  if (useGlowParam === "true" || useGlowParam === "1") {
    state.useGlow = true;
  } else if (useGlowParam === "false" || useGlowParam === "0") {
    state.useGlow = false;
  }

  const useShadowParam = params.get("useShadow");
  if (useShadowParam === "true" || useShadowParam === "1") {
    state.useShadow = true;
  } else if (useShadowParam === "false" || useShadowParam === "0") {
    state.useShadow = false;
  }

  const linkFillStrokeParam = params.get("linkFillStroke");
  if (linkFillStrokeParam === "true" || linkFillStrokeParam === "1") {
    state.linkFillStroke = true;
  } else if (linkFillStrokeParam === "false" || linkFillStrokeParam === "0") {
    state.linkFillStroke = false;
  }

  const useHanziData = params.get("useHanziData");
  if (useHanziData === "true" || useHanziData === "1") {
    state.useHanziData = true;
  }

  if (
    state.fillMode === "multi" &&
    (!state.charColors || state.charColors.length === 0)
  ) {
    if (theme?.charColorsFn) {
      state.charColors = theme.charColorsFn(state.text);
    } else {
      const len = state.text.length;
      state.charColors = Array.from(
        { length: len },
        (_, i) => DEFAULT_CHAR_COLORS[i % DEFAULT_CHAR_COLORS.length],
      );
    }
  }

  if (
    state.strokeMode === "multi" &&
    (!state.strokeCharColors || state.strokeCharColors.length === 0)
  ) {
    if (theme?.strokeCharColorsFn) {
      state.strokeCharColors = theme.strokeCharColorsFn(state.text);
    } else if (theme?.charColorsFn && state.fillMode === "multi") {
      state.strokeCharColors = theme.charColorsFn(state.text);
    } else if (state.charColors && state.charColors.length > 0) {
      state.strokeCharColors = [...state.charColors];
    } else {
      const len = state.text.length;
      state.strokeCharColors = Array.from(
        { length: len },
        (_, i) => DEFAULT_CHAR_COLORS[i % DEFAULT_CHAR_COLORS.length],
      );
    }
  }

  return state;
}
