import { INITIAL_STATE } from "@/lib/constants";
import { getOutgoingKey } from "@/lib/api-params";
import { SignatureState } from "@/lib/types";

export interface BuildBuilderSearchParamsOptions {
  /**
   * Use short keys (e.g. `t`, `f`) to keep the URL compact.
   * Default: true
   */
  shortKeys?: boolean;
}

function normalizeHexNoHash(value: string): string {
  return value.replace(/^#/, "");
}

export function buildBuilderSearchParams(
  state: SignatureState,
  options: BuildBuilderSearchParamsOptions = {},
): URLSearchParams {
  const params = new URLSearchParams();
  const useShort = options.shortKeys !== false;
  const base = INITIAL_STATE;

  const setParam = (name: string, value: string | number | boolean) => {
    const key = getOutgoingKey(name, useShort);
    params.set(key, String(value));
  };

  const setIfDifferent = (
    name: string,
    value: unknown,
    baseline: unknown,
    serialize?: (v: any) => string | number | boolean,
  ) => {
    if (value === baseline) return;
    if (value === undefined || value === null) return;
    setParam(name, serialize ? serialize(value) : (value as any));
  };

  // Core
  setIfDifferent("text", state.text, base.text);
  setIfDifferent("font", state.font, base.font);
  setIfDifferent("fontSize", state.fontSize, base.fontSize);
  setIfDifferent("speed", state.speed, base.speed);
  setIfDifferent("repeat", state.repeat, base.repeat, (v) => (v ? "1" : "0"));
  setIfDifferent(
    "eraseOnComplete",
    state.eraseOnComplete,
    base.eraseOnComplete,
    (v) => (v ? "1" : "0"),
  );

  // Layout / geometry
  setIfDifferent("charSpacing", state.charSpacing, base.charSpacing);
  setIfDifferent("borderRadius", state.borderRadius, base.borderRadius);
  setIfDifferent("cardPadding", state.cardPadding, base.cardPadding);
  setIfDifferent("bgSizeMode", state.bgSizeMode, base.bgSizeMode);
  setIfDifferent("bgWidth", state.bgWidth, base.bgWidth);
  setIfDifferent("bgHeight", state.bgHeight, base.bgHeight);

  // Background
  setIfDifferent("bgMode", state.bgMode, base.bgMode);
  if (state.bgTransparent) {
    setParam("bg", "transparent");
  } else {
    setIfDifferent("bg", state.bg, base.bg, normalizeHexNoHash);
    setIfDifferent("bg2", state.bg2, base.bg2, normalizeHexNoHash);
  }

  // Fill
  setIfDifferent("fill", state.fillMode, base.fillMode);
  setIfDifferent("fill1", state.fill1, base.fill1, normalizeHexNoHash);
  setIfDifferent("fill2", state.fill2, base.fill2, normalizeHexNoHash);

  if (state.fillMode === "multi" && state.text) {
    const baseColors = base.fillMode === "multi"
      ? base.charColors
      : ([] as string[]);
    const colors = state.text.split("").map((_, idx) =>
      normalizeHexNoHash((state.charColors[idx] || state.fill1) ?? state.fill1)
    );
    if (colors.length > 0 && colors.join("-") !== baseColors.join("-")) {
      setParam("colors", colors.join("-"));
    }
  }

  // Stroke
  setIfDifferent(
    "strokeEnabled",
    state.strokeEnabled,
    base.strokeEnabled,
    (v) => v ? "1" : "0",
  );
  setIfDifferent("strokeMode", state.strokeMode, base.strokeMode);
  setIfDifferent("stroke", state.stroke, base.stroke, normalizeHexNoHash);
  setIfDifferent("stroke2", state.stroke2, base.stroke2, normalizeHexNoHash);

  // Texture / effects
  setIfDifferent("texture", state.texture, base.texture);
  setIfDifferent("texColor", state.texColor, base.texColor, normalizeHexNoHash);
  setIfDifferent("texSize", state.texSize, base.texSize);
  setIfDifferent("texThickness", state.texThickness, base.texThickness);
  setIfDifferent("texOpacity", state.texOpacity, base.texOpacity);
  setIfDifferent(
    "useGlow",
    state.useGlow,
    base.useGlow,
    (v) => (v ? "1" : "0"),
  );
  setIfDifferent(
    "useShadow",
    state.useShadow,
    base.useShadow,
    (v) => (v ? "1" : "0"),
  );
  setIfDifferent(
    "linkFillStroke",
    state.linkFillStroke,
    base.linkFillStroke,
    (v) => (v ? "1" : "0"),
  );

  // Hanzi
  setIfDifferent(
    "useHanziData",
    state.useHanziData,
    base.useHanziData,
    (v) => v ? "1" : "0",
  );

  // GIF export settings (include only when non-default)
  setIfDifferent("gifFps", state.gifFps, base.gifFps);
  setIfDifferent("gifQuality", state.gifQuality, base.gifQuality);

  return params;
}
