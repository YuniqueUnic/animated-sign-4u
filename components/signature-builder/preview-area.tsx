import React, { useEffect, useRef, useState } from "react";
import { SignatureState } from "@/lib/types";
import { generateSVG, PathData } from "@/lib/svg-generator";
import { FONTS } from "@/lib/constants";
import opentype from "opentype.js";
import { Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchHanziData, isChinese, mergeHanziStrokes } from "@/lib/hanzi-data";
import { useDebouncedCallback } from "@/lib/hooks/use-debounced-state";

interface PreviewAreaProps {
  state: SignatureState;
  onSvgGenerated: (svg: string) => void;
  uploadedFont: ArrayBuffer | null;
  idPrefix?: string;
}

export function PreviewArea(
  { state, onSvgGenerated, uploadedFont, idPrefix = "" }: PreviewAreaProps,
) {
  const [loading, setLoading] = useState(false);
  const [svgContent, setSvgContent] = useState("");
  const [fontObj, setFontObj] = useState<any | null>(null);
  const [zoom, setZoom] = useState(1);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const measureRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced preview state to avoid regenerating SVG on every tiny change
  const [previewState, setPreviewState] = useState<SignatureState>(state);
  const debouncedUpdatePreviewState = useDebouncedCallback(
    (next: SignatureState) => {
      setPreviewState(next);
    },
    200,
  );

  useEffect(() => {
    debouncedUpdatePreviewState(state);
  }, [state, debouncedUpdatePreviewState]);

  // Update container size using ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;

    const updateSize = () => {
      if (containerRef.current) {
        // Get the size of the container element itself
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
      }
    };

    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(containerRef.current);

    // Also observe the SVG content if it exists (for accurate shadow on content)
    // We need to find the inner div that scales
    const innerDiv = containerRef.current.querySelector("div");
    if (innerDiv) {
      observer.observe(innerDiv);
    }

    return () => observer.disconnect();
  }, [svgContent, zoom]); // Re-bind when content changes to observe new inner elements

  // Load Font
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        if (state.font === "custom" && uploadedFont) {
          const font = opentype.parse(uploadedFont);
          setFontObj(font);
        } else {
          const fontUrl = FONTS.find((f) => f.value === state.font)?.url;
          if (fontUrl) {
            const font = await opentype.load(fontUrl);
            setFontObj(font);
          }
        }
      } catch (e) {
        console.error("Font load error", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [state.font, uploadedFont]);

  // Generate SVG
  useEffect(() => {
    if (!fontObj || !measureRef.current) return;

    const s = previewState;

    const generate = async () => {
      try {
        const glyphs = fontObj.stringToGlyphs(s.text || "Demo");
        const paths: PathData[] = [];
        let cursorX = 10;
        let minX = Infinity,
          minY = Infinity,
          maxX = -Infinity,
          maxY = -Infinity;

        // Clear measure SVG
        while (measureRef.current?.firstChild) {
          measureRef.current.removeChild(measureRef.current.firstChild);
        }

        // Process each glyph and check if we should use hanzi stroke data
        for (let idx = 0; idx < glyphs.length; idx++) {
          const glyph = glyphs[idx];
          const char = s.text[idx];
          let d = "";
          let isHanziPath = false;
          const pathX = cursorX;

          // Check if we should use hanzi-writer-data for this character
          if (s.useHanziData && char && isChinese(char)) {
            try {
              const hanziData = await fetchHanziData(char);
              if (hanziData && hanziData.strokes.length > 0) {
                isHanziPath = true;

                // Update bounding box for the character
                const scale = s.fontSize / 1024;
                const baseline = 150;
                const x1 = pathX;
                const y1 = baseline - s.fontSize;
                const x2 = x1 + s.fontSize;
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

                  // Measure length using DOM
                  const el = document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "path",
                  );
                  el.setAttribute("d", strokePath);
                  el.setAttribute(
                    "transform",
                    `translate(${pathX}, ${
                      baseline - s.fontSize
                    }) scale(${scale})`,
                  );
                  measureRef.current?.appendChild(el);
                  const len = Math.ceil(el.getTotalLength());

                  paths.push({
                    d: strokePath,
                    len,
                    index: idx,
                    isHanzi: true,
                    x: pathX,
                    fontSize: s.fontSize,
                    strokeIndex: strokeIdx,
                    totalStrokes: hanziData.strokes.length,
                  });
                }
              }
            } catch (e) {
              console.warn(
                `Failed to fetch hanzi data for ${char}, falling back to font`,
              );
            }
          }

          // Fallback to regular font path if not using hanzi data
          if (!isHanziPath) {
            const path = glyph.getPath(cursorX, 150, s.fontSize);
            d = path.toPathData(2);

            if (d) {
              const bbox = path.getBoundingBox();
              minX = Math.min(minX, bbox.x1);
              minY = Math.min(minY, bbox.y1);
              maxX = Math.max(maxX, bbox.x2);
              maxY = Math.max(maxY, bbox.y2);

              // Measure length using DOM
              const el = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "path",
              );
              el.setAttribute("d", d);
              measureRef.current?.appendChild(el);
              const len = Math.ceil(el.getTotalLength());

              paths.push({
                d,
                len,
                index: idx,
              });
            }
          }

          const baseSpacing = s.charSpacing || 0;
          let spacing = baseSpacing;
          if (baseSpacing !== 0 && char) {
            if (isChinese(char)) {
              spacing = baseSpacing > 0 ? baseSpacing / 5 : baseSpacing * 5;
            }
          }

          cursorX += glyph.advanceWidth * (s.fontSize / fontObj.unitsPerEm) +
            spacing;
        }

        if (paths.length === 0) {
          setSvgContent("");
          return;
        }

        // Sort paths to ensure correct rendering order:
        // 1. Group by character index
        // 2. Within each character, sort hanzi strokes by strokeIndex
        // 3. Keep non-hanzi paths in original order
        const sortedPaths = paths.slice().sort((a, b) => {
          // First sort by character index
          if (a.index !== b.index) {
            return a.index - b.index;
          }
          // Within same character, if both are hanzi strokes, sort by strokeIndex
          if (a.isHanzi && b.isHanzi) {
            return (a.strokeIndex || 0) - (b.strokeIndex || 0);
          }
          // Keep original order for non-hanzi or mixed cases
          return 0;
        });

        const p = 40;
        // Ensure valid bounding box
        if (
          !isFinite(minX) || !isFinite(minY) || !isFinite(maxX) ||
          !isFinite(maxY)
        ) {
          minX = 0;
          minY = 0;
          maxX = 100;
          maxY = 100;
        }

        // Normalize viewBox to start from (0, 0) to avoid negative coordinates
        // The offset will be compensated in the transform attribute of the path group
        const viewBox = {
          x: minX - p,
          y: minY - p,
          w: (maxX - minX) + (p * 2),
          h: (maxY - minY) + (p * 2),
        };

        const svg = generateSVG(s, sortedPaths, viewBox, { idPrefix });

        // Debug logging for mobile issues
        if (window.innerWidth < 768) {
          console.log("[PreviewArea - Mobile SVG]", {
            textLength: s.text?.length,
            pathsCount: paths.length,
            svgLength: svg.length,
            hasBackgroundRect: svg.includes("<rect") && svg.includes("fill="),
            hasPattern: svg.includes("<pattern"),
            viewBoxMatch: svg.match(/viewBox="([^"]+)"/)?.[1],
          });
        }

        setSvgContent(svg);
        onSvgGenerated(svg);
      } catch (err) {
        console.error("SVG Generation Error:", err);
      }
    };

    void generate();
  }, [previewState, fontObj]);

  const replay = () => {
    const current = svgContent;
    setSvgContent("");
    setTimeout(() => setSvgContent(current), 10);
  };

  return (
    <div className="h-full min-h-0 flex flex-col bg-[#f8f9fa] relative overflow-hidden">
      {/* Hidden SVG for measuring */}
      <svg ref={measureRef} className="absolute -top-[9999px] invisible" />

      <div className="flex-1 flex items-center justify-center p-10 overflow-auto relative z-0">
        <div
          className="absolute inset-0 opacity-[0.02] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(45deg, #222 25%, transparent 25%), linear-gradient(-45deg, #222 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #222 75%), linear-gradient(-45deg, transparent 75%, #222 75%)",
            backgroundSize: "30px 30px",
            backgroundPosition: "0 0, 0 15px, 15px -15px, -15px 0px",
          }}
        />

        <div
          ref={containerRef}
          className={cn(
            "relative transition-all duration-300 group cursor-pointer select-none flex items-center justify-center min-w-[200px] min-h-[100px] hover:shadow-xl",
          )}
          onClick={replay}
          style={{
            borderRadius: state.borderRadius,
            boxShadow: state.bgTransparent
              ? undefined
              : "0 10px 20px -16px rgba(0, 0, 0, 0.16)",
            // Scale the entire card (background + shadow) with zoom so the
            // shadow container size matches the visual background size.
            transform: `scale(${zoom})`,
            transformOrigin: "center center",
          }}
        >
          {loading
            ? (
              <div className="flex flex-col items-center text-muted-foreground animate-pulse p-10 bg-white rounded-xl shadow-lg">
                <Loader2 className="w-8 h-8 animate-spin mb-2 text-indigo-500" />
                <span className="text-xs">Loading Font...</span>
              </div>
            )
            : (
              <div
                dangerouslySetInnerHTML={{ __html: svgContent }}
                className="transition-transform duration-300"
              />
            )}

          {!loading && svgContent && (
            <div className="absolute -bottom-10 left-0 w-full text-center transition-opacity opacity-0 group-hover:opacity-100">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground bg-background/90 backdrop-blur px-3 py-1.5 rounded-full shadow-sm border">
                <RefreshCw className="w-3 h-3" /> Click to Replay
              </span>
            </div>
          )}
        </div>
      </div>

      {!loading && svgContent && (
        <div className="pointer-events-none absolute bottom-4 right-4 z-10">
          <div className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-background/90 backdrop-blur px-2 py-1 rounded-full shadow-sm border pointer-events-auto">
            <button
              type="button"
              className="w-6 h-6 text-xl flex items-center justify-center rounded-full border border-border bg-background hover:bg-muted transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setZoom((z) =>
                  Math.max(0.1, Math.round((z - 0.25) * 100) / 100)
                );
              }}
            >
              -
            </button>
            <span className="tabular-nums w-10 text-sm text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              className="w-6 h-6 text-xl flex items-center justify-center rounded-full border border-border bg-background hover:bg-muted transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setZoom((z) => Math.min(4, Math.round((z + 0.25) * 100) / 100));
              }}
            >
              +
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
