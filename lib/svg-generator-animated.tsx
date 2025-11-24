import { SignatureState } from "@/lib/types";
import { getTextureDefs, PathData } from "@/lib/svg-generator";

/**
 * Calculate the total animation duration for a set of paths
 */
export function calculateAnimationDuration(
  paths: PathData[],
  speedFactor: number,
): number {
  const charDuration = 1 / Math.max(0.01, speedFactor);

  // Group paths by character index
  const charGroups = new Map<number, PathData[]>();
  paths.forEach((p) => {
    const idx = p.index ?? 0;
    const group = charGroups.get(idx);
    if (group) {
      group.push(p);
    } else {
      charGroups.set(idx, [p]);
    }
  });

  const charCount = charGroups.size;

  // Total duration is: (number of characters * character duration) + fade-in time
  // Adding 0.8s for the final fill fade-in animation
  return charCount * charDuration + 0.8;
}

/**
 * Calculate path timing information
 */
function calculatePathTimings(
  paths: PathData[],
  speedFactor: number,
): Map<PathData, { duration: number; delay: number; fillDelay: number }> {
  const charDuration = 1 / Math.max(0.01, speedFactor);

  const charGroups = new Map<number, PathData[]>();
  paths.forEach((p) => {
    const idx = p.index ?? 0;
    const group = charGroups.get(idx);
    if (group) {
      group.push(p);
    } else {
      charGroups.set(idx, [p]);
    }
  });

  const charIndices = Array.from(charGroups.keys()).sort((a, b) => a - b);
  const timings = new Map<
    PathData,
    { duration: number; delay: number; fillDelay: number }
  >();
  let globalCharStart = 0;

  charIndices.forEach((charIndex) => {
    const group = charGroups.get(charIndex);
    if (!group || group.length === 0) return;

    const totalLen = group.reduce((sum, p) => sum + (p.len || 0), 0);
    let localStart = 0;

    if (totalLen <= 0) {
      const per = group.length > 0 ? charDuration / group.length : charDuration;
      group.forEach((p) => {
        const d = per;
        const delay = globalCharStart + localStart;
        const fillDelay = delay + d * 0.6;
        timings.set(p, { duration: d, delay, fillDelay });
        localStart += d;
      });
    } else {
      group.forEach((p) => {
        const d = (p.len / totalLen) * charDuration;
        const delay = globalCharStart + localStart;
        const fillDelay = delay + d * 0.6;
        timings.set(p, { duration: d, delay, fillDelay });
        localStart += d;
      });
    }
    globalCharStart += charDuration;
  });

  return timings;
}

/**
 * Generate an SVG frame at a specific time point in the animation
 */
export function generateSVGFrame(
  state: SignatureState,
  paths: PathData[],
  viewBox: { x: number; y: number; w: number; h: number },
  currentTime: number,
  options?: { idPrefix?: string },
): string {
  const idPrefix = options?.idPrefix ?? "";
  const speedFactor = state.speed || 1;

  // Calculate timings for all paths
  const timings = calculatePathTimings(paths, speedFactor);

  const textWidth = viewBox.w;
  const textHeight = viewBox.h;

  let canvasWidth = textWidth;
  let canvasHeight = textHeight;
  let cardWidth = textWidth;
  let cardHeight = textHeight;

  if (state.bgSizeMode === "custom") {
    cardWidth = state.bgWidth || textWidth;
    cardHeight = state.bgHeight || textHeight;
  }

  if (!state.bgTransparent) {
    canvasWidth = Math.max(canvasWidth, cardWidth);
    canvasHeight = Math.max(canvasHeight, cardHeight);
  }

  let textOffsetX = 0;
  let textOffsetY = 0;

  const hasHanzi = paths.some((p) => p.isHanzi);
  if (hasHanzi) {
    const adjustY = textHeight * 0.04;
    textOffsetY -= adjustY;
  }

  if (canvasWidth > textWidth) {
    textOffsetX += (canvasWidth - textWidth) / 2;
  }
  if (canvasHeight > textHeight) {
    textOffsetY += (canvasHeight - textHeight) / 2;
  }

  const svgOriginX = viewBox.x;
  const svgOriginY = viewBox.y;

  let patternOffsetX = 0;
  let patternOffsetY = 0;
  if (state.texture && state.texture !== "none") {
    const s = Math.max(1, state.texSize || 1);
    patternOffsetX = -((canvasWidth % s) / 2);
    patternOffsetY = -((canvasHeight % s) / 2);
  }

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

  // Textures
  if (state.texture && state.texture !== "none") {
    defs += getTextureDefs(
      state.texture,
      state.texColor,
      state.texSize,
      state.texOpacity,
      state.texThickness,
      patternOffsetX,
      patternOffsetY,
      idPrefix,
    );
  }

  // Build Paths with animation state at currentTime
  let pathElements = "";

  paths.forEach((p) => {
    const timing = timings.get(p);
    if (!timing) return;

    const { duration, delay, fillDelay } = timing;

    // Calculate stroke-dashoffset at currentTime
    let strokeDashoffset: number;
    if (currentTime < delay) {
      // Animation hasn't started yet
      strokeDashoffset = p.isHanzi ? -p.len : p.len;
    } else if (currentTime >= delay + duration) {
      // Animation is complete
      strokeDashoffset = 0;
    } else {
      // Animation in progress
      const progress = (currentTime - delay) / duration;
      if (p.isHanzi) {
        strokeDashoffset = -p.len * (1 - progress);
      } else {
        strokeDashoffset = p.len * (1 - progress);
      }
    }

    // Calculate fill-opacity at currentTime
    let fillOpacity: number;
    const fillDuration = 0.8; // Fill fade-in duration
    if (currentTime < fillDelay) {
      fillOpacity = 0;
    } else if (currentTime >= fillDelay + fillDuration) {
      fillOpacity = 1;
    } else {
      const fillProgress = (currentTime - fillDelay) / fillDuration;
      fillOpacity = fillProgress;
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
    let filterRef = "";
    if (state.useGlow && state.useShadow) {
      filterRef = `url(#${idPrefix}shadow)`;
    } else if (state.useGlow) {
      filterRef = `url(#${idPrefix}glow)`;
    } else if (state.useShadow) {
      filterRef = `url(#${idPrefix}shadow)`;
    }

    // For Chinese characters using hanzi-writer-data
    let transformAttr = "";
    if (p.isHanzi && p.x !== undefined && p.fontSize !== undefined) {
      const scale = p.fontSize / 1024;
      const baseline = 150;
      transformAttr = `transform="translate(${p.x}, ${
        baseline - p.fontSize
      }) scale(${scale}, ${-scale}) translate(0, -1024)"`;
    }

    pathElements += `
      <path
        d="${p.d}"
        fill="${fill}"
        stroke="${stroke}"
        stroke-width="${strokeWidth}"
        stroke-linecap="round"
        stroke-linejoin="round"
        ${filterRef ? `filter="${filterRef}"` : ""}
        ${transformAttr}
        style="
          stroke-dasharray: ${p.len};
          stroke-dashoffset: ${strokeDashoffset};
          fill-opacity: ${fillOpacity};
        "
      />
    `;
  });

  // Background rect
  let backgroundRect = "";
  let cardRect: { x: number; y: number; w: number; h: number } | null = null;
  if (!state.bgTransparent) {
    const bgFill = state.bgMode === "gradient" && state.bg2
      ? `url(#${idPrefix}bg-grad)`
      : state.bg;

    const rectW = cardWidth;
    const rectH = cardHeight;

    const rectX = viewBox.x + (canvasWidth - rectW) / 2;
    const rectY = viewBox.y + (canvasHeight - rectH) / 2;

    backgroundRect =
      `<rect x="${rectX}" y="${rectY}" width="${rectW}" height="${rectH}" fill="${bgFill}" rx="${state.borderRadius}" />`;
    cardRect = { x: rectX, y: rectY, w: rectW, h: rectH };
  }

  // Texture Overlay
  let textureOverlay = "";
  if (state.texture && state.texture !== "none") {
    const rect = cardRect ?? {
      x: viewBox.x + textOffsetX,
      y: viewBox.y + textOffsetY,
      w: viewBox.w,
      h: viewBox.h,
    };
    const innerX = rect.x + padding;
    const innerY = rect.y + padding;
    const innerW = Math.max(0, rect.w - padding * 2);
    const innerH = Math.max(0, rect.h - padding * 2);

    textureOverlay =
      `<rect x="${innerX}" y="${innerY}" width="${innerW}" height="${innerH}"
             fill="url(#${idPrefix}texture-${state.texture})"
             pointer-events="none"/>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${svgOriginX} ${svgOriginY} ${canvasWidth} ${canvasHeight}" width="${canvasWidth}" height="${canvasHeight}">
      <defs>
        ${defs}
      </defs>
      ${backgroundRect}
      ${textureOverlay}
      <g transform="translate(${textOffsetX}, ${textOffsetY})">
      ${pathElements}
      </g>
    </svg>`;
}
