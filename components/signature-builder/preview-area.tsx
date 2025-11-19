import React, { useEffect, useRef, useState } from "react";
import { SignatureState } from "@/lib/types";
import { generateSVG, PathData } from "@/lib/svg-generator";
import { FONTS } from "@/lib/constants";
import opentype from "opentype.js";
import { Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface PreviewAreaProps {
  state: SignatureState;
  onSvgGenerated: (svg: string) => void;
  uploadedFont: ArrayBuffer | null;
}

export function PreviewArea(
  { state, onSvgGenerated, uploadedFont }: PreviewAreaProps,
) {
  const [loading, setLoading] = useState(false);
  const [svgContent, setSvgContent] = useState("");
  const [fontObj, setFontObj] = useState<any | null>(null);
  const measureRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

    const generate = () => {
      try {
        const glyphs = fontObj.stringToGlyphs(state.text || "Demo");
        let paths: PathData[] = [];
        let cursorX = 10;
        let minX = Infinity,
          minY = Infinity,
          maxX = -Infinity,
          maxY = -Infinity;

        // Clear measure SVG
        while (measureRef.current?.firstChild) {
          measureRef.current.removeChild(measureRef.current.firstChild);
        }

        glyphs.forEach((glyph: any, idx: number) => {
          const path = glyph.getPath(cursorX, 150, state.fontSize);
          const d = path.toPathData(2);

          if (d) {
            // Measure length using DOM
            const el = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "path",
            );
            el.setAttribute("d", d);
            measureRef.current?.appendChild(el);
            const len = Math.ceil(el.getTotalLength());

            const bbox = path.getBoundingBox();
            minX = Math.min(minX, bbox.x1);
            minY = Math.min(minY, bbox.y1);
            maxX = Math.max(maxX, bbox.x2);
            maxY = Math.max(maxY, bbox.y2);

            paths.push({ d, len, index: idx });
          }

          cursorX += glyph.advanceWidth * (state.fontSize / fontObj.unitsPerEm);
        });

        if (paths.length === 0) {
          setSvgContent("");
          return;
        }

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

        const viewBox = {
          x: minX - p,
          y: minY - p,
          w: (maxX - minX) + (p * 2),
          h: (maxY - minY) + (p * 2),
        };

        const svg = generateSVG(state, paths, viewBox);
        setSvgContent(svg);
        onSvgGenerated(svg);
      } catch (err) {
        console.error("SVG Generation Error:", err);
      }
    };

    const timer = setTimeout(generate, 50);
    return () => clearTimeout(timer);
  }, [state, fontObj]);

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
              "linear-gradient(45deg, #888 25%, transparent 25%), linear-gradient(-45deg, #888 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #888 75%), linear-gradient(-45deg, transparent 75%, #888 75%)",
            backgroundSize: "30px 30px",
            backgroundPosition: "0 0, 0 15px, 15px -15px, -15px 0px",
          }}
        />

        <div
          ref={containerRef}
          className={cn(
            "relative transition-all duration-300 group cursor-pointer select-none flex items-center justify-center min-w-[200px] min-h-[100px]",
            state.bgTransparent
              ? "hover:shadow-xl"
              : "shadow-2xl hover:shadow-2xl hover:scale-[1.02]",
          )}
          onClick={replay}
          style={{ borderRadius: state.borderRadius }}
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
    </div>
  );
}
