import { SignatureState } from "./types";

export interface BuildSignApiUrlOptions {
    format?: string;
    origin?: string;
}

export function buildSignApiUrl(
    state: SignatureState,
    options: BuildSignApiUrlOptions = {},
): string {
    const params = new URLSearchParams();

    params.set("text", state.text);
    params.set("font", state.font);

    // Core layout
    params.set("fontSize", String(state.fontSize));
    params.set("speed", String(state.speed));
    params.set("charSpacing", String(state.charSpacing));
    params.set("borderRadius", String(state.borderRadius));
    params.set("cardPadding", String(state.cardPadding));

    if (state.fillMode !== "single") {
        params.set("fill", state.fillMode);
    }

    // Fill & stroke colors/modes
    params.set("fill1", state.fill1.replace("#", ""));
    if (state.fill2) {
        params.set("fill2", state.fill2.replace("#", ""));
    }

    params.set("stroke", state.stroke.replace("#", ""));
    if (state.stroke2) {
        params.set("stroke2", state.stroke2.replace("#", ""));
    }
    params.set("strokeMode", state.strokeMode);
    params.set("strokeEnabled", state.strokeEnabled ? "1" : "0");

    // Background
    if (state.bgTransparent) {
        params.set("bg", "transparent");
    } else if (state.bg !== "#ffffff") {
        params.set("bg", state.bg.replace("#", ""));
    }

    params.set("bgMode", state.bgMode);
    if (state.bg2) {
        params.set("bg2", state.bg2.replace("#", ""));
    }

    if (state.bgSizeMode === "custom") {
        params.set("bgSizeMode", "custom");
        if (state.bgWidth) params.set("bgWidth", String(state.bgWidth));
        if (state.bgHeight) params.set("bgHeight", String(state.bgHeight));
    }

    // Texture and effects
    if (state.texture !== "none") {
        params.set("texture", state.texture);
    }
    params.set("texColor", state.texColor.replace("#", ""));
    params.set("texSize", String(state.texSize));
    params.set("texThickness", String(state.texThickness));
    params.set("texOpacity", String(state.texOpacity));

    if (state.fillMode === "multi" && state.text) {
        const colors = state.text.split("").map((_, idx) =>
            (state.charColors[idx] || state.fill1).replace("#", "")
        );
        params.set("colors", colors.join("-"));
    }
    if (state.useGlow) {
        params.set("useGlow", "1");
    }
    if (state.useShadow) {
        params.set("useShadow", "1");
    }

    if (state.useHanziData) {
        params.set("useHanziData", "true");
    }

    if (state.linkFillStroke) {
        params.set("linkFillStroke", "1");
    }

    if (options.format) {
        params.set("format", options.format);
    }

    const origin = options.origin ??
        (typeof window !== "undefined"
            ? window.location.origin
            : "https://sign.yunique.cc");

    return `${origin}/api/sign?${params.toString()}`;
}
