import React, { useEffect, useRef, useState } from "react";
import { SignatureState } from "@/lib/types";
import { generateSVG } from "@/lib/svg-generator";
import { FONTS } from "@/lib/constants";
import opentype from "opentype.js";
import { Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDebouncedCallback } from "@/lib/hooks/use-debounced-state";
import { buildPaths } from "@/lib/build-paths";

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
  const [, setContainerSize] = useState({ width: 0, height: 0 });
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
    if (!fontObj) return;

    const s = previewState;

    const generate = async () => {
      try {
        const { paths, viewBox } = await buildPaths(fontObj, s);
        if (paths.length === 0) {
          setSvgContent("");
          onSvgGenerated("");
          return;
        }

        const svg = generateSVG(s, paths, viewBox, { idPrefix });

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
      } catch {
        console.error("SVG Generation Error:");
      }
    };

    void generate();
  }, [previewState, fontObj, idPrefix, onSvgGenerated]);

  const replay = () => {
    const current = svgContent;
    setSvgContent("");
    setTimeout(() => setSvgContent(current), 10);
  };

  return (
    <div className="h-full min-h-0 flex flex-col bg-[#f8f9fa] relative overflow-hidden">
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
