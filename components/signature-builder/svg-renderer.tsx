import React, { useEffect, useRef } from "react";

interface SVGRendererProps {
  svgString: string;
  className?: string;
  style?: React.CSSProperties;
}

export function SVGRenderer({ svgString, className, style }: SVGRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !svgString) return;

    // Clear previous content
    containerRef.current.innerHTML = "";

    try {
      // Parse SVG string using DOMParser
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgString, "image/svg+xml");

      // Check for parsing errors
      const parserError = doc.querySelector("parsererror");
      if (parserError) {
        console.error("SVG parsing error:", parserError.textContent);
        // Fallback to innerHTML if parsing fails
        containerRef.current.innerHTML = svgString;
        return;
      }

      // Get the SVG element
      const svgElement = doc.documentElement as unknown as SVGSVGElement;

      // Import the SVG into the current document
      const importedSVG = document.importNode(svgElement, true);

      // Append to container
      containerRef.current.appendChild(importedSVG);

      // Force browser to recalculate SVG rendering
      // This helps with pattern rendering issues
      requestAnimationFrame(() => {
        if (containerRef.current) {
          const svg = containerRef.current.querySelector("svg");
          if (svg) {
            // Force reflow
            svg.style.display = "none";
            void svg.getBoundingClientRect(); // Trigger reflow
            svg.style.display = "block";
          }
        }
      });
    } catch (error) {
      console.error("Error rendering SVG:", error);
      // Fallback to innerHTML
      containerRef.current.innerHTML = svgString;
    }
  }, [svgString]);

  return <div ref={containerRef} className={className} style={style} />;
}
