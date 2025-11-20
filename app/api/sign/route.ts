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
import { fetchHanziData, isChinese, mergeHanziStrokes } from "@/lib/hanzi-data";

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

    const charSpacing = params.get("charSpacing");
    if (charSpacing) {
        const v = Number(charSpacing);
        if (Number.isFinite(v)) {
            state.charSpacing = v;
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

export async function buildPaths(font: any, state: SignatureState): Promise<{
    paths: PathData[];
    viewBox: { x: number; y: number; w: number; h: number };
}> {
    const text = state.text || "Demo";
    const glyphs = font.stringToGlyphs(text);

    const paths: PathData[] = [];
    let cursorX = 10;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (let idx = 0; idx < glyphs.length; idx++) {
        const glyph = glyphs[idx];
        const char = text[idx];
        let d = "";
        let isHanziPath = false;
        const pathX = cursorX;

        // Check if we should use hanzi-writer-data for this character
        if (state.useHanziData && char && isChinese(char)) {
            try {
                const hanziData = await fetchHanziData(char);
                if (hanziData && hanziData.strokes.length > 0) {
                    isHanziPath = true;
                    
                    // Update bounding box for the character
                    const baseline = 150;
                    const x1 = pathX;
                    const y1 = baseline - state.fontSize;
                    const x2 = x1 + state.fontSize;
                    const y2 = baseline;
                    minX = Math.min(minX, x1);
                    minY = Math.min(minY, y1);
                    maxX = Math.max(maxX, x2);
                    maxY = Math.max(maxY, y2);

                    // Create a separate path for each stroke
                    for (let strokeIdx = 0; strokeIdx < hanziData.strokes.length; strokeIdx++) {
                        const strokePath = hanziData.strokes[strokeIdx];
                        const properties = new svgPathProperties(strokePath);
                        const scale = state.fontSize / 1024;
                        const len = Math.ceil(properties.getTotalLength() * scale);

                        paths.push({
                            d: strokePath,
                            len,
                            index: idx,
                            isHanzi: true,
                            x: pathX,
                            fontSize: state.fontSize,
                            strokeIndex: strokeIdx,
                            totalStrokes: hanziData.strokes.length,
                        });
                    }
                }
            } catch (e) {
                console.warn(`Failed to fetch hanzi data for ${char}, falling back to font`);
            }
        }

        // Fallback to regular font path if not using hanzi data
        if (!isHanziPath) {
            const path = glyph.getPath(cursorX, 150, state.fontSize);
            d = path.toPathData(2);

            if (d) {
                const bbox = path.getBoundingBox();
                minX = Math.min(minX, bbox.x1);
                minY = Math.min(minY, bbox.y1);
                maxX = Math.max(maxX, bbox.x2);
                maxY = Math.max(maxY, bbox.y2);

                const properties = new svgPathProperties(d);
                const len = Math.ceil(properties.getTotalLength());

                paths.push({
                    d,
                    len,
                    index: idx,
                });
            }
        }

        cursorX += glyph.advanceWidth * (state.fontSize / font.unitsPerEm) + (state.charSpacing || 0);
    }

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
        const { paths, viewBox } = await buildPaths(font, state);

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

        if (format === "gif") {
            const staticSvg = generateSVG(state, paths, viewBox, {
                staticRender: true,
            });
            const gifBuffer = await sharp(Buffer.from(staticSvg)).gif()
                .toBuffer();
            const gifArray = new Uint8Array(gifBuffer);

            return new Response(gifArray, {
                status: 200,
                headers: {
                    "Content-Type": "image/gif",
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
