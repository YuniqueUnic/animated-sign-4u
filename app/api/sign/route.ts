import { NextRequest } from "next/server";
import opentype from "opentype.js";
import sharp from "sharp";

import { FONTS, INITIAL_STATE } from "@/lib/constants";
import { generateSVG } from "@/lib/svg-generator";
import { buildStateFromQuery } from "@/lib/state-from-query";
import { generateAnimatedGIF } from "@/lib/gif-generator";
import { getIncomingValue } from "@/lib/api-params";
import { buildPaths } from "@/lib/build-paths";

export const runtime = "nodejs";

const FONT_CACHE = new Map<string, any>();

function createFallbackFont(): any {
  const unitsPerEm = 1000;
  return {
    unitsPerEm,
    stringToGlyphs(text: string) {
      return Array.from(text).map(() => {
        return {
          advanceWidth: unitsPerEm / 2,
          getPath(x: number, y: number, fontSize: number) {
            const left = x;
            const right = x + fontSize / 2;
            const top = y - fontSize / 2;
            const bottom = y + fontSize / 2;
            return {
              toPathData: () =>
                `M${left} ${top}L${right} ${top}L${right} ${bottom}L${left} ${bottom}Z`,
              getBoundingBox: () => ({
                x1: left,
                y1: top,
                x2: right,
                y2: bottom,
              }),
            };
          },
        };
      });
    },
  };
}

const FALLBACK_FONT = createFallbackFont();

export async function loadFont(fontId: string): Promise<any> {
  const fallbackId = INITIAL_STATE.font;
  const fontEntry = FONTS.find((f) => f.value === fontId) ??
    FONTS.find((f) => f.value === fallbackId);

  if (!fontEntry) {
    console.error("[/api/sign] Font is not configured", { fontId, fallbackId });
    return FALLBACK_FONT;
  }

  const cacheKey = fontEntry.value;
  const cached = FONT_CACHE.get(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetch(fontEntry.url);
    if (!res.ok) {
      throw new Error(`Failed to load font: ${res.status}`);
    }

    const buffer = await res.arrayBuffer();
    const font = opentype.parse(buffer);
    FONT_CACHE.set(cacheKey, font);
    return font;
  } catch (error) {
    console.error("[/api/sign] Failed to fetch font, using fallback font", {
      fontId: fontEntry.value,
      url: fontEntry.url,
      error,
    });

    // Prefer any previously cached font as a graceful fallback.
    const cachedFallback = Array.from(FONT_CACHE.values())[0];
    if (cachedFallback) {
      return cachedFallback;
    }

    // Last resort: use a simple in-memory box font so we can still render
    // a signature instead of returning a 500 error.
    return FALLBACK_FONT;
  }
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

    const formatParam = getIncomingValue(params, "format");
    const format = formatParam || "svg";

    if (format === "json") {
      const body = JSON.stringify({ paths, viewBox });
      return new Response(body, {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });
    }

    // Generate animated GIF with stroke-by-stroke animation
    if (format === "gif") {
      const gifBuffer = await generateAnimatedGIF(state, paths, viewBox, {
        fps: state.gifFps ?? 30, // Use state parameter or default to 30 fps
        quality: state.gifQuality ?? 5, // Use state parameter or default to 5 (higher quality)
      });

      const gifArray = new Uint8Array(gifBuffer);

      return new Response(gifArray, {
        status: 200,
        headers: {
          "Content-Type": "image/gif",
          "Cache-Control": "no-cache, no-store, must-revalidate",
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
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });
    }

    // Check if static SVG is requested
    const staticParam = getIncomingValue(params, "static");
    const isStaticSvg = staticParam === "1" || staticParam === "true";

    const svg = generateSVG(state, paths, viewBox, {
      staticRender: isStaticSvg,
    });

    return new Response(svg, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Error in /api/sign", error);
    return new Response("Failed to generate signature", { status: 500 });
  }
}
