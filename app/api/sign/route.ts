import { NextRequest } from "next/server";
import opentype from "opentype.js";
import { svgPathProperties } from "svg-path-properties";
import sharp from "sharp";

import {
    DEFAULT_CHAR_COLORS,
    FONTS,
    INITIAL_STATE,
    THEMES,
} from "@/lib/constants";
import { FillMode, SignatureState, TextureType } from "@/lib/types";
import { generateSVG, PathData } from "@/lib/svg-generator";

export function buildStateFromQuery(params: URLSearchParams): SignatureState {
    let state: SignatureState = { ...INITIAL_STATE };

    const themeKey = params.get("theme");
    const theme = themeKey && themeKey in THEMES ? THEMES[themeKey] : undefined;
    if (theme) {
        state = { ...state, ...theme };
    }

    const text = params.get("text");
    if (text) {
        state.text = text;
    }

    const font = params.get("font");
    if (font) {
        state.font = font;
    }

    const fill = params.get("fill") as FillMode | null;
    if (fill === "single" || fill === "gradient" || fill === "multi") {
        state.fillMode = fill;
    }

    const colorsParam = params.get("colors");
    if (colorsParam) {
        const rawColors = colorsParam.split(/[,-]/);
        const parsed = rawColors.map((c) => c.trim())
            .filter(Boolean)
            .map((c) => c.startsWith("#") ? c : `#${c}`);
        if (parsed.length > 0) {
            state.charColors = parsed;
            state.fillMode = "multi";
        }
    }

    const bgSizeMode = params.get("bgSizeMode");
    if (bgSizeMode === "auto" || bgSizeMode === "custom") {
        state.bgSizeMode = bgSizeMode as any;
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

    const texture = params.get("texture") as TextureType | null;
    const allowedTextures: TextureType[] = [
        "none",
        "grid",
        "dots",
        "lines",
        "cross",
    ];
    if (texture && allowedTextures.includes(texture)) {
        state.texture = texture;
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
            // Reuse fill pattern when only charColorsFn is defined.
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

export async function loadFont(fontId: string): Promise<any> {
    const fallbackId = INITIAL_STATE.font;
    const fontEntry = FONTS.find((f) => f.value === fontId) ??
        FONTS.find((f) => f.value === fallbackId);

    if (!fontEntry) {
        throw new Error("Font is not configured");
    }

    const res = await fetch(fontEntry.url);
    if (!res.ok) {
        throw new Error(`Failed to load font: ${res.status}`);
    }

    const buffer = await res.arrayBuffer();
    return opentype.parse(buffer);
}

export function buildPaths(font: any, state: SignatureState): {
    paths: PathData[];
    viewBox: { x: number; y: number; w: number; h: number };
} {
    const text = state.text || "Demo";
    const glyphs = font.stringToGlyphs(text);

    const paths: PathData[] = [];
    let cursorX = 10;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    glyphs.forEach((glyph: any, idx: number) => {
        const path = glyph.getPath(cursorX, 150, state.fontSize);
        const d = path.toPathData(2);

        if (d) {
            const properties = new svgPathProperties(d);
            const len = Math.ceil(properties.getTotalLength());
            const bbox = path.getBoundingBox();

            minX = Math.min(minX, bbox.x1);
            minY = Math.min(minY, bbox.y1);
            maxX = Math.max(maxX, bbox.x2);
            maxY = Math.max(maxY, bbox.y2);

            paths.push({ d, len, index: idx });
        }

        cursorX += glyph.advanceWidth * (state.fontSize / font.unitsPerEm);
    });

    if (paths.length === 0) {
        return {
            paths,
            viewBox: { x: 0, y: 0, w: 100, h: 100 },
        };
    }

    const padding = 40;

    if (
        !Number.isFinite(minX) || !Number.isFinite(minY) ||
        !Number.isFinite(maxX) || !Number.isFinite(maxY)
    ) {
        minX = 0;
        minY = 0;
        maxX = 100;
        maxY = 100;
    }

    const viewBox = {
        x: minX - padding,
        y: minY - padding,
        w: maxX - minX + padding * 2,
        h: maxY - minY + padding * 2,
    };

    return { paths, viewBox };
}

export async function GET(req: NextRequest): Promise<Response> {
    try {
        const url = new URL(req.url);
        const params = url.searchParams;

        const state = buildStateFromQuery(params);
        const font = await loadFont(state.font);
        const { paths, viewBox } = buildPaths(font, state);

        if (paths.length === 0) {
            return new Response("No paths generated", { status: 400 });
        }

        const format = params.get("format") || "svg";

        if (format === "json") {
            const body = JSON.stringify({ paths, viewBox });
            return new Response(body, {
                status: 200,
                headers: {
                    "Content-Type": "application/json; charset=utf-8",
                    "Cache-Control": "s-maxage=86400, immutable",
                },
            });
        }

        if (format === "png") {
            const staticSvg = generateSVG(state, paths, viewBox, {
                staticRender: true,
            });
            const pngBuffer = await sharp(Buffer.from(staticSvg)).png()
                .toBuffer();
            const pngArray = new Uint8Array(pngBuffer);

            return new Response(pngArray, {
                status: 200,
                headers: {
                    "Content-Type": "image/png",
                    "Cache-Control": "s-maxage=86400, immutable",
                },
            });
        }

        const svg = generateSVG(state, paths, viewBox);

        return new Response(svg, {
            status: 200,
            headers: {
                "Content-Type": "image/svg+xml; charset=utf-8",
                "Cache-Control": "s-maxage=86400, immutable",
            },
        });
    } catch (error) {
        console.error("Error in /api/sign", error);
        return new Response("Failed to generate signature", { status: 500 });
    }
}
