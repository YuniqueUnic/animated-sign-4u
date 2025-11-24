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

  // Separate text bounds from background card and overall canvas:
  // - textWidth/textHeight come from the incoming viewBox (glyph bounds)
  // - cardWidth/cardHeight are derived from bgSizeMode/bgWidth/bgHeight
  // - canvasWidth/canvasHeight are the final SVG logical dimensions
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

  // If we actually draw a background card, ensure the canvas is at least as
  // large as the card so the card is never clipped. When the card is
  // smaller than the text bounds, the canvas stays based on the text.
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

  // If the canvas expanded beyond the text bounds because of a larger
  // background card, center the text within the canvas.
  if (canvasWidth > textWidth) {
    textOffsetX += (canvasWidth - textWidth) / 2;
  }
  if (canvasHeight > textHeight) {
    textOffsetY += (canvasHeight - textHeight) / 2;
  }

  const offsetX = textOffsetX;
  const offsetY = textOffsetY;

  const svgOriginX = viewBox.x;
  const svgOriginY = viewBox.y;

  // Center texture tiling relative to the overall canvas so that
  // left/right and top/bottom edges are visually balanced instead of
  // always starting from the SVG origin (0,0).
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

  // Textures - use correct pattern ID format
  // Pattern positioning is offset so that tiling appears centered
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

  // Build Paths with SMIL animations.
  // When `eraseOnComplete` is true, use a carousel effect:
  //   draw → hold → erase → (optionally repeat when `repeat` is true).
  // When `eraseOnComplete` is false (default), only play a forward
  // draw + fill animation once and keep the final frame visible.
  let pathElements = "";
  // Treat `speed` as a speed factor: larger values make the animation faster.
  // Base duration per character is ~1s at speed=1, then scaled as 1 / speed.
  const speedFactor = state.speed || 1;
  const charDuration = 1 / Math.max(0.01, speedFactor);

  // Precompute timing per character so that each character (by index) takes
  // roughly `charDuration` seconds; higher speedFactor => smaller charDuration.
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

  const timings = new Map<PathData, { duration: number; delay: number }>();
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
        timings.set(p, { duration: d, delay: globalCharStart + localStart });
        localStart += d;
      });
    } else {
      group.forEach((p) => {
        const d = (p.len / totalLen) * charDuration;
        timings.set(p, { duration: d, delay: globalCharStart + localStart });
        localStart += d;
      });
    }
    globalCharStart += charDuration;
  });

  // Calculate total draw duration (from first path to last path complete)
  const totalDrawDuration = globalCharStart;

  // Carousel timing phases:
  // - Draw phase: totalDrawDuration (left to right)
  // - Hold phase: 1s (fully visible)
  // - Erase phase: totalDrawDuration (right to left, reverse order)
  // - Pause phase: 0.5s (before next loop)
  const holdDuration = 1;
  const pauseDuration = 0.5;
  const totalCycleDuration = totalDrawDuration + holdDuration +
    totalDrawDuration + pauseDuration;

  const useCarousel = !staticRender && state.eraseOnComplete;

  // Use paths directly to ensure correct order (generation order is correct)
  paths.forEach((p) => {
    const timing = timings.get(p);
    const drawDuration = timing?.duration ?? ((p.len / 300) * charDuration);
    const drawDelay = timing?.delay ?? 0;

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
      // Prefer shadow when both are enabled to avoid invalid multiple filter urls.
      filterRef = `url(#${idPrefix}shadow)`;
    } else if (state.useGlow) {
      filterRef = `url(#${idPrefix}glow)`;
    } else if (state.useShadow) {
      filterRef = `url(#${idPrefix}shadow)`;
    }

    const initialStrokeDashoffset = p.isHanzi ? -p.len : p.len;

    // For Chinese characters using hanzi-writer-data, apply coordinate transformation
    let transformAttr = "";
    if (p.isHanzi && p.x !== undefined && p.fontSize !== undefined) {
      const scale = p.fontSize / 1024;
      const baseline = 150;
      transformAttr = `transform="translate(${p.x}, ${
        baseline - p.fontSize
      }) scale(${scale}, ${-scale}) translate(0, -1024)"`;
    }

    // Calculate timing for carousel effect:
    // Draw: starts at drawDelay, ends at drawDelay + drawDuration
    // Erase: reverse order - last path erases first
    // Erase delay = totalDrawDuration + holdDuration +
    //   (totalDrawDuration - drawDelay - drawDuration)
    const eraseDelay = totalDrawDuration +
      holdDuration +
      (totalDrawDuration - drawDelay - drawDuration);
    const fillFadeDelay = drawDelay + drawDuration * 0.6;
    const fillEraseDelay = eraseDelay + drawDuration * 0.4;

    // Cycle ID for animation reference (only used when carousel is enabled)
    const cycleId = idPrefix ? `${idPrefix}cycle` : "cycle";

    // SMIL animations.
    // - Carousel mode: use cycle.begin and include erase phase.
    // - Non-carousel mode: single forward draw + fill, no erase.
    const strokeDashAnimation = !staticRender
      ? useCarousel
        ? `
        <animate
          attributeName="stroke-dashoffset"
          from="${initialStrokeDashoffset}"
          to="0"
          dur="${drawDuration}s"
          begin="${cycleId}.begin + ${drawDelay}s"
          fill="freeze"
        />
        <animate
          attributeName="stroke-dashoffset"
          from="0"
          to="${initialStrokeDashoffset}"
          dur="${drawDuration}s"
          begin="${cycleId}.begin + ${eraseDelay}s"
          fill="freeze"
        />
      `
        : `
        <animate
          attributeName="stroke-dashoffset"
          from="${initialStrokeDashoffset}"
          to="0"
          dur="${drawDuration}s"
          begin="${drawDelay}s"
          fill="freeze"
        />
      `
      : "";

    const fillFadeAnimation = !staticRender
      ? useCarousel
        ? `
        <animate
          attributeName="fill-opacity"
          from="0"
          to="1"
          dur="0.3s"
          begin="${cycleId}.begin + ${fillFadeDelay}s"
          fill="freeze"
        />
        <animate
          attributeName="fill-opacity"
          from="1"
          to="0"
          dur="0.3s"
          begin="${cycleId}.begin + ${fillEraseDelay}s"
          fill="freeze"
        />
      `
        : `
        <animate
          attributeName="fill-opacity"
          from="0"
          to="1"
          dur="0.3s"
          begin="${fillFadeDelay}s"
          fill="freeze"
        />
      `
      : "";

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
        class="sig-path"
        stroke-dasharray="${p.len}"
        stroke-dashoffset="${staticRender ? 0 : initialStrokeDashoffset}"
        fill-opacity="${staticRender ? 1 : 0}"
      >${strokeDashAnimation}${fillFadeAnimation}</path>
    `;
  });

  // Add global cycle controller for looping animation when carousel is enabled.
  // Reference: TypingSVG uses <animate id="cycle" begin="0s;cycle.end" dur="Xs"/>
  // The "begin=0s;cycle.end" makes it restart when it ends, creating infinite loop.
  const cycleId = idPrefix ? `${idPrefix}cycle` : "cycle";
  const cycleController = !staticRender && state.eraseOnComplete
    ? (state.repeat
      ? `<animate id="${cycleId}" begin="0s;${cycleId}.end" dur="${totalCycleDuration}s"/>`
      : `<animate id="${cycleId}" begin="0s" dur="${totalCycleDuration}s"/>`)
    : "";

  // Background rect (solid or gradient)
  // Background is independent from text bounds and can be smaller or
  // larger than the text. It is centered within the final canvas.
  let backgroundRect = "";
  let cardRect: { x: number; y: number; w: number; h: number } | null = null;
  if (!state.bgTransparent) {
    const bgFill = state.bgMode === "gradient" && state.bg2
      ? `url(#${idPrefix}bg-grad)`
      : state.bg;

    const rectW = cardWidth;
    const rectH = cardHeight;

    // Center the background card within the overall canvas so that
    // text can extend beyond a smaller card, and a larger card remains
    // fully visible.
    const rectX = viewBox.x + (canvasWidth - rectW) / 2;
    const rectY = viewBox.y + (canvasHeight - rectH) / 2;

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

  // CSS styles for texture overlay fallback (mobile compatibility)
  // Note: Removed CSS fallback as it was incorrectly applying background-image to SVG rects
  // and hiding the actual SVG pattern on mobile.
  // Also removed keyframes as we now use SMIL animations
  const textureStyles = "";

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

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${svgOriginX} ${svgOriginY} ${canvasWidth} ${canvasHeight}" width="${canvasWidth}" height="${canvasHeight}" style="display: block; max-width: 100%; height: auto; overflow: visible;">
      <defs>
        ${cycleController}
        ${defs}
        <style>
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
