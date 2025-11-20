import { SignatureState } from "@/lib/types";

export interface PathData {
  d: string;
  len: number;
  index: number;
}

export function getTextureDefs(
  type: string,
  color: string,
  size: number,
  opacity: number,
  thickness: number = 1,
): string {
  // Use "size" directly as the pattern tile size in SVG units so that
  // slider values map intuitively to visual density (10 = fine, 100 = coarse),
  // matching the original HTML implementation.
  const s = size;
  const c = color;
  const o = opacity;
  const t = thickness;

  if (type === "grid") {
    return `
      <pattern id="texture-grid" x="0" y="0" width="${s}" height="${s}" patternUnits="userSpaceOnUse">
        <path d="M ${s} 0 L 0 0 0 ${s}" fill="none" stroke="${c}" stroke-width="${t}" stroke-opacity="${o}"/>
      </pattern>
    `;
  }
  if (type === "dots") {
    return `
      <pattern id="texture-dots" x="0" y="0" width="${s}" height="${s}" patternUnits="userSpaceOnUse">
        <circle cx="${s / 2}" cy="${s / 2}" r="${
      t * 1.5
    }" fill="${c}" fill-opacity="${o}"/>
      </pattern>
    `;
  }
  if (type === "lines") {
    return `
      <pattern id="texture-lines" x="0" y="0" width="${s}" height="${s}" patternUnits="userSpaceOnUse">
        <path d="M 0 ${s / 2} L ${s} ${
      s / 2
    }" stroke="${c}" stroke-width="${t}" stroke-opacity="${o}"/>
      </pattern>
    `;
  }
  if (type === "cross") {
    return `
      <pattern id="texture-cross" x="0" y="0" width="${s}" height="${s}" patternUnits="userSpaceOnUse">
        <path d="M ${s / 4} ${s / 4} L ${s * 0.75} ${s * 0.75} M ${s * 0.75} ${
      s / 4
    } L ${s / 4} ${
      s * 0.75
    }" stroke="${c}" stroke-width="${t}" stroke-opacity="${o}"/>
      </pattern>
    `;
  }
  return "";
}

export function generateSVG(
  state: SignatureState,
  paths: PathData[],
  viewBox: { x: number; y: number; w: number; h: number },
  options?: { staticRender?: boolean },
): string {
  const staticRender = options?.staticRender ?? false;

  // Canvas dimensions can grow beyond the original glyph viewBox when a
  // custom background card is larger. This keeps font metrics independent
  // from the background size while centering text over the card.
  let canvasWidth = viewBox.w;
  let canvasHeight = viewBox.h;

  if (state.bgSizeMode === "custom" && state.bgWidth && state.bgHeight) {
    canvasWidth = Math.max(viewBox.w, state.bgWidth);
    canvasHeight = Math.max(viewBox.h, state.bgHeight);
  }

  const offsetX = (canvasWidth - viewBox.w) / 2;
  const offsetY = (canvasHeight - viewBox.h) / 2;

  const padding = Math.max(
    0,
    Math.min(state.cardPadding ?? 0, Math.min(canvasWidth, canvasHeight) / 4),
  );

  // Generate Defs
  let defs = "";

  // Gradients for fill
  if (state.fillMode === "gradient") {
    defs += `
      <linearGradient id="grad-fill" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="${state.fill1}" />
        <stop offset="100%" stop-color="${state.fill2}" />
      </linearGradient>
    `;
  }

  // Gradient for stroke
  if (state.strokeEnabled && state.strokeMode === "gradient") {
    defs += `
      <linearGradient id="grad-stroke" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="${state.stroke}" />
        <stop offset="100%" stop-color="${state.stroke2}" />
      </linearGradient>
    `;
  }

  // Gradient for stroke
  if (state.strokeEnabled && state.strokeMode === "gradient") {
    defs += `
      <linearGradient id="grad-stroke" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="${state.stroke}" />
        <stop offset="100%" stop-color="${state.stroke2}" />
      </linearGradient>
    `;
  }

  // Gradient for background
  if (
    !state.bgTransparent && state.bgMode === "gradient" && state.bg && state.bg2
  ) {
    defs += `
      <linearGradient id="bg-grad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="${state.bg}" />
        <stop offset="100%" stop-color="${state.bg2}" />
      </linearGradient>
    `;
  }

  // Filters
  if (state.useGlow) {
    defs += `
      <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3.5" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    `;
  }

  if (state.useShadow) {
    defs += `
      <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="4" dy="4" stdDeviation="3" flood-opacity="0.6"/>
      </filter>
    `;
  }

  // Textures - use correct pattern ID format
  if (state.texture && state.texture !== "none") {
    defs += getTextureDefs(
      state.texture,
      state.texColor,
      state.texSize,
      state.texOpacity,
      state.texThickness,
    );
  }

  // Build Paths with corrected animation
  let pathElements = "";
  let currentDelay = 0;
  const speed = state.speed || 0.5;

  paths.forEach((p, i) => {
    const duration = (p.len / 300) / speed;
    const delay = currentDelay;
    if (!staticRender) {
      currentDelay += duration * 0.7; // Overlap for smooth flow
    }

    const fill = state.fillMode === "single"
      ? state.fill1
      : state.fillMode === "gradient"
      ? "url(#grad-fill)"
      : (state.charColors[i] || state.fill1);

    let stroke = "none";
    if (state.strokeEnabled) {
      if (state.strokeMode === "gradient") {
        stroke = "url(#grad-stroke)";
      } else if (state.strokeMode === "multi") {
        stroke = state.strokeCharColors[i] || state.stroke;
      } else {
        stroke = state.stroke;
      }
    }
    const strokeWidth = state.strokeEnabled ? 2 : 0;
    const filterList = [
      state.useGlow ? "url(#glow)" : "",
      state.useShadow ? "url(#shadow)" : "",
    ].filter(Boolean).join(" ");

    const strokeDashoffset = staticRender ? 0 : p.len;
    const fillOpacity = staticRender ? 1 : 0;
    const animationStyle = staticRender ? "" : `animation: 
            draw-${i} ${duration}s ease-out forwards ${delay}s, 
            fill-fade-${i} 0.8s ease-out forwards ${delay + duration * 0.6}s;`;

    pathElements += `
      <path 
        d="${p.d}" 
        fill="${fill}" 
        stroke="${stroke}" 
        stroke-width="${strokeWidth}" 
        stroke-linecap="round" 
        stroke-linejoin="round"
        ${filterList ? `filter="${filterList}"` : ""}
        class="sig-path"
        style="
          stroke-dasharray: ${p.len}; 
          stroke-dashoffset: ${strokeDashoffset}; 
          fill-opacity: ${fillOpacity};
          ${animationStyle}
        "
      />
    `;
  });

  // Background rect (solid or gradient)
  let backgroundRect = "";
  let cardRect: { x: number; y: number; w: number; h: number } | null = null;
  if (!state.bgTransparent) {
    const bgFill = state.bgMode === "gradient" && state.bg2
      ? "url(#bg-grad)"
      : state.bg;

    let rectW = canvasWidth;
    let rectH = canvasHeight;

    if (state.bgSizeMode === "custom" && state.bgWidth && state.bgHeight) {
      rectW = state.bgWidth;
      rectH = state.bgHeight;
    }

    const rectX = viewBox.x + (canvasWidth - rectW) / 2;
    const rectY = viewBox.y + (canvasHeight - rectH) / 2;

    backgroundRect =
      `<rect x="${rectX}" y="${rectY}" width="${rectW}" height="${rectH}" fill="${bgFill}" />`;
    cardRect = { x: rectX, y: rectY, w: rectW, h: rectH };
  }

  // Texture Overlay - fix pattern ID reference
  let textureOverlay = "";
  if (state.texture && state.texture !== "none") {
    const rect = cardRect ?? {
      x: viewBox.x + offsetX,
      y: viewBox.y + offsetY,
      w: viewBox.w,
      h: viewBox.h,
    };
    const innerX = rect.x + padding;
    const innerY = rect.y + padding;
    const innerW = Math.max(0, rect.w - padding * 2);
    const innerH = Math.max(0, rect.h - padding * 2);

    textureOverlay =
      `<rect x="${innerX}" y="${innerY}" width="${innerW}" height="${innerH}" fill="url(#texture-${state.texture})" pointer-events="none"/>`;
  }

  // Generate keyframes for each path (skip for static renders)
  let keyframes = "";
  if (!staticRender) {
    paths.forEach((p, i) => {
      keyframes += `
        @keyframes draw-${i} { to { stroke-dashoffset: 0; } }
        @keyframes fill-fade-${i} { to { fill-opacity: 1; } }
      `;
    });
  }

  return `
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="${viewBox.x} ${viewBox.y} ${canvasWidth} ${canvasHeight}"
      width="${canvasWidth}"
      height="${canvasHeight}"
      style="background-color: transparent; border-radius: ${state.borderRadius}px;"
    >
      <defs>
        ${defs}
        <style>
          ${keyframes}
          .sig-path {
            animation-fill-mode: forwards;
          }
        </style>
      </defs>
      ${backgroundRect}
      ${textureOverlay}
      <g transform="translate(${offsetX}, ${offsetY})">${pathElements}</g>
    </svg>
  `;
}
