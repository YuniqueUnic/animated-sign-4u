import { DEFAULT_CHAR_COLORS, INITIAL_STATE, THEMES } from "@/lib/constants";
import { FillMode, SignatureState, TextureType } from "@/lib/types";
import { getIncomingValue } from "@/lib/api-params";

export function buildStateFromQuery(params: URLSearchParams): SignatureState {
  let state: SignatureState = { ...INITIAL_STATE };

  const themeKey = getIncomingValue(params, "theme");
  const theme = themeKey && themeKey in THEMES ? THEMES[themeKey] : undefined;
  if (theme) {
    state = { ...state, ...theme } as SignatureState;
  }

  const text = getIncomingValue(params, "text");
  if (text) {
    state.text = text;
  }

  const font = getIncomingValue(params, "font");
  if (font) {
    state.font = font;
  }

  const fontSizeParam = getIncomingValue(params, "fontSize");
  if (fontSizeParam) {
    const v = Number(fontSizeParam);
    if (Number.isFinite(v) && v > 0) {
      state.fontSize = v;
    }
  }

  const speedParam = getIncomingValue(params, "speed");
  if (speedParam) {
    const v = Number(speedParam);
    if (Number.isFinite(v) && v > 0) {
      state.speed = v;
    }
  }

  const repeatParam = getIncomingValue(params, "repeat");
  if (repeatParam === "0" || repeatParam === "false") {
    state.repeat = false;
  } else if (repeatParam === "1" || repeatParam === "true") {
    state.repeat = true;
  }

  const eraseParam = getIncomingValue(params, "eraseOnComplete");
  if (eraseParam === "1" || eraseParam === "true") {
    state.eraseOnComplete = true;
  } else if (eraseParam === "0" || eraseParam === "false") {
    state.eraseOnComplete = false;
  }

  const fill = getIncomingValue(params, "fill") as FillMode | null;
  if (fill === "single" || fill === "gradient" || fill === "multi") {
    state.fillMode = fill;
  }

  const colorsParam = getIncomingValue(params, "colors");
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

  const fill1Param = getIncomingValue(params, "fill1");
  if (fill1Param) {
    state.fill1 = fill1Param.startsWith("#") ? fill1Param : `#${fill1Param}`;
  }

  const fill2Param = getIncomingValue(params, "fill2");
  if (fill2Param) {
    state.fill2 = fill2Param.startsWith("#") ? fill2Param : `#${fill2Param}`;
  }

  const strokeParam = getIncomingValue(params, "stroke");
  if (strokeParam) {
    state.stroke = strokeParam.startsWith("#")
      ? strokeParam
      : `#${strokeParam}`;
  }

  const stroke2Param = getIncomingValue(params, "stroke2");
  if (stroke2Param) {
    state.stroke2 = stroke2Param.startsWith("#")
      ? stroke2Param
      : `#${stroke2Param}`;
  }

  const strokeModeParam = getIncomingValue(params, "strokeMode") as
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

  const strokeEnabledParam = getIncomingValue(params, "strokeEnabled");
  if (strokeEnabledParam === "0" || strokeEnabledParam === "false") {
    state.strokeEnabled = false;
  } else if (strokeEnabledParam === "1" || strokeEnabledParam === "true") {
    state.strokeEnabled = true;
  }

  const bgSizeMode = getIncomingValue(params, "bgSizeMode");
  if (bgSizeMode === "auto" || bgSizeMode === "custom") {
    state.bgSizeMode = bgSizeMode as any;
  }

  const charSpacing = getIncomingValue(params, "charSpacing");
  if (charSpacing) {
    const v = Number(charSpacing);
    if (Number.isFinite(v)) {
      state.charSpacing = v;
    }
  }

  const borderRadiusParam = getIncomingValue(params, "borderRadius");
  if (borderRadiusParam) {
    const v = Number(borderRadiusParam);
    if (Number.isFinite(v) && v >= 0) {
      state.borderRadius = v;
    }
  }

  const cardPaddingParam = getIncomingValue(params, "cardPadding");
  if (cardPaddingParam) {
    const v = Number(cardPaddingParam);
    if (Number.isFinite(v) && v >= 0) {
      state.cardPadding = v;
    }
  }

  const bgWidthParam = getIncomingValue(params, "bgWidth");
  if (bgWidthParam) {
    const v = Number(bgWidthParam);
    if (Number.isFinite(v) && v > 0) {
      state.bgWidth = v;
    }
  }

  const bgHeightParam = getIncomingValue(params, "bgHeight");
  if (bgHeightParam) {
    const v = Number(bgHeightParam);
    if (Number.isFinite(v) && v > 0) {
      state.bgHeight = v;
    }
  }

  const bgParam = getIncomingValue(params, "bg");
  if (bgParam) {
    if (bgParam === "transparent") {
      state.bgTransparent = true;
    } else {
      state.bgTransparent = false;
      state.bg = bgParam.startsWith("#") ? bgParam : `#${bgParam}`;
    }
  }

  const bgModeParam = getIncomingValue(params, "bgMode");
  if (bgModeParam === "solid" || bgModeParam === "gradient") {
    state.bgMode = bgModeParam as any;
  }

  const bg2Param = getIncomingValue(params, "bg2");
  if (bg2Param) {
    state.bg2 = bg2Param.startsWith("#") ? bg2Param : `#${bg2Param}`;
  }

  const texture = getIncomingValue(params, "texture") as TextureType | null;
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

  const texColorParam = getIncomingValue(params, "texColor");
  if (texColorParam) {
    state.texColor = texColorParam.startsWith("#")
      ? texColorParam
      : `#${texColorParam}`;
  }

  const texSizeParam = getIncomingValue(params, "texSize");
  if (texSizeParam) {
    const v = Number(texSizeParam);
    if (Number.isFinite(v) && v > 0) {
      state.texSize = v;
    }
  }

  const texThicknessParam = getIncomingValue(params, "texThickness");
  if (texThicknessParam) {
    const v = Number(texThicknessParam);
    if (Number.isFinite(v) && v > 0) {
      state.texThickness = v;
    }
  }

  const texOpacityParam = getIncomingValue(params, "texOpacity");
  if (texOpacityParam) {
    const v = Number(texOpacityParam);
    if (Number.isFinite(v) && v >= 0 && v <= 1) {
      state.texOpacity = v;
    }
  }

  const useGlowParam = getIncomingValue(params, "useGlow");
  if (useGlowParam === "true" || useGlowParam === "1") {
    state.useGlow = true;
  } else if (useGlowParam === "false" || useGlowParam === "0") {
    state.useGlow = false;
  }

  const useShadowParam = getIncomingValue(params, "useShadow");
  if (useShadowParam === "true" || useShadowParam === "1") {
    state.useShadow = true;
  } else if (useShadowParam === "false" || useShadowParam === "0") {
    state.useShadow = false;
  }

  const linkFillStrokeParam = getIncomingValue(params, "linkFillStroke");
  if (linkFillStrokeParam === "true" || linkFillStrokeParam === "1") {
    state.linkFillStroke = true;
  } else if (linkFillStrokeParam === "false" || linkFillStrokeParam === "0") {
    state.linkFillStroke = false;
  }

  const useHanziData = getIncomingValue(params, "useHanziData");
  if (useHanziData === "true" || useHanziData === "1") {
    state.useHanziData = true;
  }

  // GIF export settings
  const gifFpsParam = getIncomingValue(params, "gifFps");
  if (gifFpsParam) {
    const v = Number(gifFpsParam);
    if (Number.isFinite(v) && v > 0 && v <= 60) {
      state.gifFps = v;
    }
  }

  const gifQualityParam = getIncomingValue(params, "gifQuality");
  if (gifQualityParam) {
    const v = Number(gifQualityParam);
    if (Number.isFinite(v) && v >= 1 && v <= 20) {
      state.gifQuality = v;
    }
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
