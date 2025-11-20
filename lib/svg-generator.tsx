import { SignatureState } from "@/lib/types";

export interface PathData {
  d: string;
  len: number;
  index: number;
  isHanzi?: boolean;
  x?: number;
  fontSize?: number;
  strokeIndex?: number; // For Chinese characters: which stroke of the character
  totalStrokes?: number; // For Chinese characters: total number of strokes
}

export function getTextureDefs(
  type: string,
  color: string,
  size: number,
  opacity: number,
  thickness: number = 1,
  patternX: number = 0,
  patternY: number = 0,
  idPrefix: string = "",
): string {
  // Use "size" directly as the pattern tile size in SVG units so that
  // slider values map intuitively to visual density (10 = fine, 100 = coarse),
  // matching the original HTML implementation.
  const s = size;
  const c = color;
  const o = opacity;
  const t = thickness;
  const px = patternX;
  const py = patternY;
  const id = `${idPrefix}texture-${type}`;

  if (type === "grid") {
    return `
      <pattern id="${id}" x="${px}" y="${py}" width="${s}" height="${s}" patternUnits="userSpaceOnUse">
        <path d="M ${s} 0 L 0 0 0 ${s}" fill="none" stroke="${c}" stroke-width="${t}" stroke-opacity="${o}"/>
      </pattern>
    `;
  }
  if (type === "dots") {
    return `
      <pattern id="${id}" x="${px}" y="${py}" width="${s}" height="${s}" patternUnits="userSpaceOnUse">
        <circle cx="${s / 2}" cy="${s / 2}" r="${
      t * 1.5
    }" fill="${c}" fill-opacity="${o}"/>
      </pattern>
    `;
  }
  if (type === "lines") {
    return `
      <pattern id="${id}" x="${px}" y="${py}" width="${s}" height="${s}" patternUnits="userSpaceOnUse">
        <path d="M 0 ${s / 2} L ${s} ${
      s / 2
    }" stroke="${c}" stroke-width="${t}" stroke-opacity="${o}"/>
      </pattern>
    `;
  }
  if (type === "cross") {
    return `
      <pattern id="${id}" x="${px}" y="${py}" width="${s}" height="${s}" patternUnits="userSpaceOnUse">
        <path d="M ${s / 4} ${s / 4} L ${s * 0.75} ${s * 0.75} M ${s * 0.75} ${
      s / 4
    } L ${s / 4} ${
      s * 0.75
    }" stroke="${c}" stroke-width="${t}" stroke-opacity="${o}"/>
      </pattern>
    `;
  }
  if (type === "tianzige") {
    // 田字格: outer box + center cross lines
    const half = s / 2;
    return `
      <pattern id="${id}" x="${px}" y="${py}" width="${s}" height="${s}" patternUnits="userSpaceOnUse">
        <rect width="${s}" height="${s}" fill="none" stroke="${c}" stroke-width="${t}" stroke-opacity="${o}"/>
        <path d="M${half} 0 L${half} ${s} M0 ${half} L${s} ${half}" stroke="${c}" stroke-width="${t}" stroke-opacity="${o}" stroke-dasharray="3,3"/>
      </pattern>
    `;
  }
  if (type === "mizige") {
    // 米字格: tianzige + diagonal lines
    const half = s / 2;
    return `
      <pattern id="${id}" x="${px}" y="${py}" width="${s}" height="${s}" patternUnits="userSpaceOnUse">
        <rect width="${s}" height="${s}" fill="none" stroke="${c}" stroke-width="${t}" stroke-opacity="${o}"/>
        <path d="M0 0 L${s} ${s} M${s} 0 L0 ${s} M${half} 0 L${half} ${s} M0 ${half} L${s} ${half}" stroke="${c}" stroke-width="${t}" stroke-opacity="${o}" stroke-dasharray="3,3"/>
      </pattern>
    `;
  }
  return "";
}

export function generateSVG(
  state: SignatureState,
  paths: PathData[],
  viewBox: { x: number; y: number; w: number; h: number },
  options?: { staticRender?: boolean; idPrefix?: string },
): string {
  const staticRender = options?.staticRender ?? false;
  const idPrefix = options?.idPrefix ?? "";

  // Decouple text and background layers:
  // - Text layer: uses original viewBox dimensions (text bounding box)
  // - Background layer: can be independently sized, text can overflow it
  // - When bgSizeMode is 'custom', canvas is based on background size, not text
  let canvasWidth = viewBox.w;
  let canvasHeight = viewBox.h;
  let textOffsetX = 0;
  let textOffsetY = 0;

  if (state.bgSizeMode === "custom" && state.bgWidth && state.bgHeight) {
    // Use background size as canvas, text is positioned independently
    canvasWidth = state.bgWidth;
    canvasHeight = state.bgHeight;
    // Center text over background (but text can still overflow)
    textOffsetX = (canvasWidth - viewBox.w) / 2;
    textOffsetY = (canvasHeight - viewBox.h) / 2;
  }

  const offsetX = textOffsetX;
  const offsetY = textOffsetY;

  const padding = Math.max(
    0,
    Math.min(state.cardPadding ?? 0, Math.min(canvasWidth, canvasHeight) / 4),
  );

  // Generate Defs
  let defs = "";

  // Gradients for fill
  if (state.fillMode === "gradient") {
    defs += `
      <linearGradient id="${idPrefix}grad-fill" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="${state.fill1}" />
        <stop offset="100%" stop-color="${state.fill2}" />
      </linearGradient>
    `;
  }

  // Gradient for stroke
  if (state.strokeEnabled && state.strokeMode === "gradient") {
    defs += `
      <linearGradient id="${idPrefix}grad-stroke" x1="0%" y1="0%" x2="100%" y2="0%">
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
      <linearGradient id="${idPrefix}bg-grad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="${state.bg}" />
        <stop offset="100%" stop-color="${state.bg2}" />
      </linearGradient>
    `;
  }

  // Filters
  if (state.useGlow) {
    defs += `
      <filter id="${idPrefix}glow" x="-50%" y="-50%" width="200%" height="200%">
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
      <filter id="${idPrefix}shadow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="4" dy="4" stdDeviation="3" flood-opacity="0.6"/>
      </filter>
    `;
  }

  // Textures - use correct pattern ID format
  // Pattern positioning should start from 0 to ensure proper tiling
  if (state.texture && state.texture !== "none") {
    defs += getTextureDefs(
      state.texture,
      state.texColor,
      state.texSize,
      state.texOpacity,
      state.texThickness,
      0,
      0,
      idPrefix,
    );
  }

  // Build Paths with corrected animation
  let pathElements = "";
  let currentDelay = 0;
  const speed = state.speed || 0.5;

  // Use paths directly to ensure correct order (generation order is correct)
  paths.forEach((p, i) => {
    const duration = (p.len / 300) / speed;
    const delay = currentDelay;
    if (!staticRender) {
      // For Chinese characters, add more delay between strokes for clearer animation
      if (
        p.isHanzi && i > 0 && paths[i - 1].isHanzi &&
        paths[i - 1].index === p.index
      ) {
        currentDelay += duration * 0.9; // Less overlap for Chinese strokes
      } else {
        currentDelay += duration * 0.7; // Normal overlap
      }
    }

    const fill = state.fillMode === "single"
      ? state.fill1
      : state.fillMode === "gradient"
      ? `url(#${idPrefix}grad-fill)`
      : (state.charColors[p.index] || state.fill1);

    let stroke = "none";
    if (state.strokeEnabled) {
      if (state.strokeMode === "gradient") {
        stroke = `url(#${idPrefix}grad-stroke)`;
      } else if (state.strokeMode === "multi") {
        stroke = state.strokeCharColors[p.index] || state.stroke;
      } else {
        stroke = state.stroke;
      }
    }
    const strokeWidth = state.strokeEnabled ? 2 : 0;
    const filterList = [
      state.useGlow ? `url(#${idPrefix}glow)` : "",
      state.useShadow ? `url(#${idPrefix}shadow)` : "",
    ].filter(Boolean).join(" ");

    const strokeDashoffset = staticRender ? 0 : p.len;
    const fillOpacity = staticRender ? 1 : 0;
    const animationStyle = staticRender ? "" : `animation: 
            ${idPrefix}draw-${i} ${duration}s ease-out forwards ${delay}s, 
            ${idPrefix}fill-fade-${i} 0.8s ease-out forwards ${
      delay + duration * 0.6
    }s;`;

    // For Chinese characters using hanzi-writer-data, apply coordinate transformation
    let transformAttr = "";
    if (p.isHanzi && p.x !== undefined && p.fontSize !== undefined) {
      const scale = p.fontSize / 1024;
      const baseline = 150;
      // hanzi-writer-data: (0,0) is top-left, (1024, 1024) is bottom-right
      // But strokes are drawn mirrored, need Y-axis flip at center: translate(0, 1024) scale(1, -1)
      // Combined: translate to position, scale with Y-flip, then adjust for flip offset
      transformAttr = `transform="translate(${p.x}, ${
        baseline - p.fontSize
      }) scale(${scale}, ${-scale}) translate(0, 1024)"`;
    }

    pathElements += `
      <path 
        d="${p.d}" 
        fill="${fill}" 
        stroke="${stroke}" 
        stroke-width="${strokeWidth}" 
        stroke-linecap="round" 
        stroke-linejoin="round"
        ${filterList ? `filter="${filterList}"` : ""}
        ${transformAttr}
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
  // Background is now independent - it doesn't need to contain text
  let backgroundRect = "";
  let cardRect: { x: number; y: number; w: number; h: number } | null = null;
  if (!state.bgTransparent) {
    const bgFill = state.bgMode === "gradient" && state.bg2
      ? `url(#${idPrefix}bg-grad)`
      : state.bg;

    let rectW = canvasWidth;
    let rectH = canvasHeight;

    if (state.bgSizeMode === "custom" && state.bgWidth && state.bgHeight) {
      rectW = state.bgWidth;
      rectH = state.bgHeight;
    }

    // Background fills the canvas from origin
    // In custom mode, canvas IS the background, so no offset needed
    const rectX = viewBox.x;
    const rectY = viewBox.y;

    backgroundRect =
      `<rect x="${rectX}" y="${rectY}" width="${rectW}" height="${rectH}" fill="${bgFill}" rx="${state.borderRadius}" />`;
    cardRect = { x: rectX, y: rectY, w: rectW, h: rectH };
  }

  // Texture Overlay - add a texture-class for CSS styling
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

    // Add both pattern fill (for desktop) and a class for CSS fallback (for mobile)
    textureOverlay =
      `<rect x="${innerX}" y="${innerY}" width="${innerW}" height="${innerH}" 
             fill="url(#${idPrefix}texture-${state.texture})" 
             class="texture-overlay texture-${state.texture}" 
             data-texture="${state.texture}"
             data-color="${state.texColor}"
             data-size="${state.texSize}"
             data-opacity="${state.texOpacity}"
             pointer-events="none"/>`;
  }

  // Generate keyframes for each path (skip for static renders)
  let keyframes = "";
  if (!staticRender) {
    paths.forEach((p, i) => {
      keyframes += `
        @keyframes ${idPrefix}draw-${i} { to { stroke-dashoffset: 0; } }
        @keyframes ${idPrefix}fill-fade-${i} { to { fill-opacity: 1; } }
      `;
    });
  }

  // CSS styles for texture overlay fallback (mobile compatibility)
  // Note: Removed CSS fallback as it was incorrectly applying background-image to SVG rects
  // and hiding the actual SVG pattern on mobile.
  let textureStyles = "";

  // Debug logging for mobile issues
  if (typeof window !== "undefined" && window.innerWidth < 768) {
    console.log("[SVG Generator - Mobile]", {
      viewBox: `${viewBox.x} ${viewBox.y} ${canvasWidth} ${canvasHeight}`,
      bgTransparent: state.bgTransparent,
      hasBackgroundRect: backgroundRect.length > 0,
      hasTextureOverlay: textureOverlay.length > 0,
      texture: state.texture,
    });
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox.x} ${viewBox.y} ${canvasWidth} ${canvasHeight}" width="${canvasWidth}" height="${canvasHeight}" style="display: block; max-width: 100%; height: auto; overflow: visible;">
      <defs>
        ${defs}
        <style>
          ${keyframes}
          ${textureStyles}
        </style>
      </defs>
      ${backgroundRect}
      ${textureOverlay}
      <g transform="translate(${textOffsetX}, ${textOffsetY})">
      ${pathElements}
      </g>
    </svg>`;
}
