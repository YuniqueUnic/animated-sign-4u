import { svgPathProperties } from "svg-path-properties";
import { fetchHanziData, isChinese } from "@/lib/hanzi-data";
import { SignatureState } from "@/lib/types";
import { PathData } from "@/lib/svg-generator";

export interface BuildPathsResult {
  paths: PathData[];
  viewBox: { x: number; y: number; w: number; h: number };
}

/**
 * Shared path builder used by:
 * - API (`app/api/sign/route.ts`)
 * - Client preview (`components/signature-builder/preview-area.tsx`)
 *
 * It intentionally avoids DOM APIs so output stays consistent between server
 * and browser (especially path length calculations).
 */
export async function buildPaths(
  font: any,
  state: SignatureState,
): Promise<BuildPathsResult> {
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
    let isHanziPath = false;
    const pathX = cursorX;

    if (state.useHanziData && char && isChinese(char)) {
      try {
        const hanziData = await fetchHanziData(char);
        if (hanziData && hanziData.strokes.length > 0) {
          isHanziPath = true;

          const baseline = 150;
          const x1 = pathX;
          const y1 = baseline - state.fontSize;
          const x2 = x1 + state.fontSize;
          const y2 = baseline;
          minX = Math.min(minX, x1);
          minY = Math.min(minY, y1);
          maxX = Math.max(maxX, x2);
          maxY = Math.max(maxY, y2);

          for (
            let strokeIdx = 0;
            strokeIdx < hanziData.strokes.length;
            strokeIdx++
          ) {
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
      } catch {
        // fall back to font glyph path
      }
    }

    if (!isHanziPath) {
      const path = glyph.getPath(cursorX, 150, state.fontSize);
      const d = path.toPathData(2);

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
    !Number.isFinite(minX) ||
    !Number.isFinite(minY) ||
    !Number.isFinite(maxX) ||
    !Number.isFinite(maxY)
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
