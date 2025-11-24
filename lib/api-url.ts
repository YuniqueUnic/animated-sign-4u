import { SignatureState } from "./types";
import { getOutgoingKey } from "./api-params";

export interface BuildSignApiUrlOptions {
  format?: string;
  origin?: string;
  static?: boolean;
  shortKeys?: boolean;
}

interface BuildUrlParamsOptions {
  includeText?: boolean;
  includeFormat?: boolean;
  format?: string;
  shortKeys?: boolean;
}

function buildParamsFromState(
  state: SignatureState,
  options: BuildUrlParamsOptions = {},
): URLSearchParams {
  const params = new URLSearchParams();
  const useShort = options.shortKeys === true;

  const setParam = (name: string, value: string | number | boolean) => {
    const key = getOutgoingKey(name, useShort);
    params.set(key, String(value));
  };

  if (options.includeText !== false) {
    setParam("text", state.text);
  }

  setParam("font", state.font);

  // Core layout
  setParam("fontSize", state.fontSize);
  setParam("speed", state.speed);
  setParam("charSpacing", state.charSpacing);
  setParam("borderRadius", state.borderRadius);
  setParam("cardPadding", state.cardPadding);

  if (state.fillMode !== "single") {
    setParam("fill", state.fillMode);
  }

  // Fill & stroke colors/modes
  setParam("fill1", state.fill1.replace("#", ""));
  if (state.fill2) {
    setParam("fill2", state.fill2.replace("#", ""));
  }

  setParam("stroke", state.stroke.replace("#", ""));
  if (state.stroke2) {
    setParam("stroke2", state.stroke2.replace("#", ""));
  }
  setParam("strokeMode", state.strokeMode);
  setParam("strokeEnabled", state.strokeEnabled ? "1" : "0");

  // Background
  if (state.bgTransparent) {
    setParam("bg", "transparent");
  } else if (state.bg !== "#ffffff") {
    setParam("bg", state.bg.replace("#", ""));
  }

  setParam("bgMode", state.bgMode);
  if (state.bg2) {
    setParam("bg2", state.bg2.replace("#", ""));
  }

  if (state.bgSizeMode === "custom") {
    setParam("bgSizeMode", "custom");
    if (state.bgWidth) setParam("bgWidth", state.bgWidth);
    if (state.bgHeight) setParam("bgHeight", state.bgHeight);
  }

  // Texture and effects
  if (state.texture !== "none") {
    setParam("texture", state.texture);
  }
  setParam("texColor", state.texColor.replace("#", ""));
  setParam("texSize", state.texSize);
  setParam("texThickness", state.texThickness);
  setParam("texOpacity", state.texOpacity);

  if (state.fillMode === "multi" && state.text) {
    const colors = state.text.split("").map((_, idx) =>
      (state.charColors[idx] || state.fill1).replace("#", "")
    );
    setParam("colors", colors.join("-"));
  }
  if (state.useGlow) {
    setParam("useGlow", "1");
  }
  if (state.useShadow) {
    setParam("useShadow", "1");
  }

  if (state.useHanziData) {
    setParam("useHanziData", "true");
  }

  if (state.linkFillStroke) {
    setParam("linkFillStroke", "1");
  }

  if (state.eraseOnComplete) {
    setParam("eraseOnComplete", "1");
  }

  // GIF export settings (only add if not default values)
  if (state.gifFps && state.gifFps !== 30) {
    setParam("gifFps", state.gifFps);
  }
  if (state.gifQuality && state.gifQuality !== 5) {
    setParam("gifQuality", state.gifQuality);
  }

  if (options.includeFormat !== false && options.format) {
    setParam("format", options.format);
  }

  return params;
}

export function buildSignApiUrl(
  state: SignatureState,
  options: BuildSignApiUrlOptions = {},
): string {
  const origin = options.origin ??
    (typeof window !== "undefined"
      ? window.location.origin
      : "https://sign.yunique.top");

  const wantStatic = options.static === true;

  // Explicit override: caller decides whether to use short keys or not.
  if (options.shortKeys === true || options.shortKeys === false) {
    const useShort = options.shortKeys;
    const params = buildParamsFromState(state, {
      includeText: true,
      includeFormat: true,
      format: options.format,
      shortKeys: useShort,
    });
    if (wantStatic) {
      const key = getOutgoingKey("static", useShort);
      params.set(key, "1");
    }

    return `${origin}/api/sign?${params.toString()}`;
  }

  // Auto mode: prefer long keys for readability, but fall back to short keys
  // when the URL would become too long.
  const longParams = buildParamsFromState(state, {
    includeText: true,
    includeFormat: true,
    format: options.format,
    shortKeys: false,
  });
  if (wantStatic) {
    const key = getOutgoingKey("static", false);
    longParams.set(key, "1");
  }
  const longUrl = `${origin}/api/sign?${longParams.toString()}`;

  const MAX_URL_LENGTH = 1800;
  if (longUrl.length <= MAX_URL_LENGTH) {
    return longUrl;
  }

  const shortParams = buildParamsFromState(state, {
    includeText: true,
    includeFormat: true,
    format: options.format,
    shortKeys: true,
  });
  if (wantStatic) {
    const key = getOutgoingKey("static", true);
    shortParams.set(key, "1");
  }

  return `${origin}/api/sign?${shortParams.toString()}`;
}

export interface BuildShareUrlOptions {
  origin?: string;
}

export function buildShareUrl(
  state: SignatureState,
  options: BuildShareUrlOptions = {},
): string {
  const params = buildParamsFromState(state, {
    includeText: false,
    includeFormat: false,
    shortKeys: true,
  });

  const origin = options.origin ??
    (typeof window !== "undefined"
      ? window.location.origin
      : "https://sign.yunique.top");

  const rawText = (state.text || "").trim();
  const path = rawText ? `/${encodeURIComponent(rawText)}` : "/";
  const query = params.toString();

  return query ? `${origin}${path}?${query}` : `${origin}${path}`;
}
