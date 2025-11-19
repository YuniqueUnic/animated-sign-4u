import { NextRequest } from "next/server";
import opentype from "opentype.js";
import { svgPathProperties } from "svg-path-properties";

import { FONTS, INITIAL_STATE, THEMES } from "@/lib/constants";
import { FillMode, SignatureState, TextureType } from "@/lib/types";
import { generateSVG, PathData } from "@/lib/svg-generator";

export function buildStateFromQuery(params: URLSearchParams): SignatureState {
    let state: SignatureState = { ...INITIAL_STATE };

    const themeKey = params.get("theme");
    if (themeKey && themeKey in THEMES) {
        state = { ...state, ...THEMES[themeKey] };
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
            // PNG support will be added later using Sharp or a similar library.
            return new Response("PNG format is not implemented yet", {
                status: 501,
                headers: {
                    "Content-Type": "text/plain; charset=utf-8",
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
