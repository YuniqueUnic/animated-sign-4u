import { NextRequest } from "next/server";
import opentype from "opentype.js";
import { svgPathProperties } from "svg-path-properties";
import sharp from "sharp";

import { FONTS, INITIAL_STATE } from "@/lib/constants";
import { SignatureState } from "@/lib/types";
import { generateSVG, PathData } from "@/lib/svg-generator";
import { fetchHanziData, isChinese } from "@/lib/hanzi-data";
import { buildStateFromQuery } from "@/lib/state-from-query";
import { generateAnimatedGIF } from "@/lib/gif-generator";
import { getIncomingValue } from "@/lib/api-params";

export const runtime = "nodejs";

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
          for (
            let strokeIdx = 0;
            strokeIdx < hanziData.strokes.length;
            strokeIdx++
          ) {
            const strokePath = hanziData.strokes[strokeIdx];
            const properties = new svgPathProperties(strokePath);
            const scale = state.fontSize / 1024;
            const len = Math.ceil(
              properties.getTotalLength() * scale,
            );

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
      } catch {
        console.warn(
          `Failed to fetch hanzi data for ${char}, falling back to font`,
        );
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

    const baseSpacing = state.charSpacing || 0;
    let spacing = baseSpacing;
    if (baseSpacing !== 0 && char) {
      if (isChinese(char)) {
        spacing = baseSpacing > 0 ? baseSpacing / 5 : baseSpacing * 5;
      }
    }

    cursorX += glyph.advanceWidth * (state.fontSize / font.unitsPerEm) +
      spacing;
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
