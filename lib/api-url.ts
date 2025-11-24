import { SignatureState } from "./types";

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
    const k = (longKey: string, shortKey: string) =>
        useShort ? shortKey : longKey;

    if (options.includeText !== false) {
        params.set(k("text", "t"), state.text);
    }

    params.set(k("font", "f"), state.font);

    // Core layout
    params.set(k("fontSize", "fs"), String(state.fontSize));
    params.set(k("speed", "sp"), String(state.speed));
    params.set(k("charSpacing", "cs"), String(state.charSpacing));
    params.set(k("borderRadius", "br"), String(state.borderRadius));
    params.set(k("cardPadding", "cp"), String(state.cardPadding));

    if (state.fillMode !== "single") {
        params.set(k("fill", "fm"), state.fillMode);
    }

    // Fill & stroke colors/modes
    params.set(k("fill1", "f1"), state.fill1.replace("#", ""));
    if (state.fill2) {
        params.set(k("fill2", "f2"), state.fill2.replace("#", ""));
    }

    params.set(k("stroke", "st"), state.stroke.replace("#", ""));
    if (state.stroke2) {
        params.set(k("stroke2", "st2"), state.stroke2.replace("#", ""));
    }
    params.set(k("strokeMode", "sm"), state.strokeMode);
    params.set(k("strokeEnabled", "se"), state.strokeEnabled ? "1" : "0");

    // Background
    if (state.bgTransparent) {
        params.set(k("bg", "bg"), "transparent");
    } else if (state.bg !== "#ffffff") {
        params.set(k("bg", "bg"), state.bg.replace("#", ""));
    }

    params.set(k("bgMode", "bm"), state.bgMode);
    if (state.bg2) {
        params.set(k("bg2", "bg2"), state.bg2.replace("#", ""));
    }

    if (state.bgSizeMode === "custom") {
        params.set(k("bgSizeMode", "bgs"), "custom");
        if (state.bgWidth) {
            params.set(k("bgWidth", "bw"), String(state.bgWidth));
        }
        if (state.bgHeight) {
            params.set(k("bgHeight", "bh"), String(state.bgHeight));
        }
    }

    // Texture and effects
    if (state.texture !== "none") {
        params.set(k("texture", "tx"), state.texture);
    }
    params.set(k("texColor", "txc"), state.texColor.replace("#", ""));
    params.set(k("texSize", "txs"), String(state.texSize));
    params.set(k("texThickness", "txt"), String(state.texThickness));
    params.set(k("texOpacity", "txo"), String(state.texOpacity));

    if (state.fillMode === "multi" && state.text) {
        const colors = state.text.split("").map((_, idx) =>
            (state.charColors[idx] || state.fill1).replace("#", "")
        );
        params.set(k("colors", "cl"), colors.join("-"));
    }
    if (state.useGlow) {
        params.set(k("useGlow", "gl"), "1");
    }
    if (state.useShadow) {
        params.set(k("useShadow", "sh"), "1");
    }

    if (state.useHanziData) {
        params.set(k("useHanziData", "hz"), "true");
    }

    if (state.linkFillStroke) {
        params.set(k("linkFillStroke", "lfs"), "1");
    }

    if (state.eraseOnComplete) {
        params.set(k("eraseOnComplete", "eo"), "1");
    }

    // GIF export settings (only add if not default values)
    if (state.gifFps && state.gifFps !== 30) {
        params.set(k("gifFps", "gf"), String(state.gifFps));
    }
    if (state.gifQuality && state.gifQuality !== 5) {
        params.set(k("gifQuality", "gq"), String(state.gifQuality));
    }

    if (options.includeFormat !== false && options.format) {
        params.set(k("format", "fmt"), options.format);
    }

    return params;
}

export function buildSignApiUrl(
    state: SignatureState,
    options: BuildSignApiUrlOptions = {},
): string {
    const params = buildParamsFromState(state, {
        includeText: true,
        includeFormat: true,
        format: options.format,
        shortKeys: options.shortKeys ?? true,
    });

    if (options.static) {
        params.set(options.shortKeys ?? true ? "st" : "static", "1");
    }

    const origin = options.origin ??
        (typeof window !== "undefined"
            ? window.location.origin
            : "https://sign.yunique.top");

    return `${origin}/api/sign?${params.toString()}`;
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
