import { SignatureState } from '@/lib/types';

export interface PathData {
  d: string;
  len: number;
  index: number;
}

export function getTextureDefs(type: string, color: string, size: number, opacity: number, thickness: number = 1): string {
  const s = size * 10; // Scale size for better visibility
  const c = color;
  const o = opacity;
  const t = thickness;

  if (type === 'grid') {
    return `
      <pattern id="texture-grid" x="0" y="0" width="${s}" height="${s}" patternUnits="userSpaceOnUse">
        <path d="M ${s} 0 L 0 0 0 ${s}" fill="none" stroke="${c}" stroke-width="${t}" stroke-opacity="${o}"/>
      </pattern>
    `;
  }
  if (type === 'dots') {
    return `
      <pattern id="texture-dots" x="0" y="0" width="${s}" height="${s}" patternUnits="userSpaceOnUse">
        <circle cx="${s/2}" cy="${s/2}" r="${t}" fill="${c}" fill-opacity="${o}"/>
      </pattern>
    `;
  }
  if (type === 'lines') {
    return `
      <pattern id="texture-lines" x="0" y="0" width="${s}" height="${s}" patternUnits="userSpaceOnUse">
        <path d="M 0 ${s/2} L ${s} ${s/2}" stroke="${c}" stroke-width="${t}" stroke-opacity="${o}"/>
      </pattern>
    `;
  }
  if (type === 'cross') {
    return `
      <pattern id="texture-cross" x="0" y="0" width="${s}" height="${s}" patternUnits="userSpaceOnUse">
        <path d="M ${s/4} ${s/4} L ${s*0.75} ${s*0.75} M ${s*0.75} ${s/4} L ${s/4} ${s*0.75}" stroke="${c}" stroke-width="${t}" stroke-opacity="${o}"/>
      </pattern>
    `;
  }
  return '';
}

export function generateSVG(state: SignatureState, paths: PathData[], viewBox: { x: number, y: number, w: number, h: number }): string {
  const width = viewBox.w;
  const height = viewBox.h;
  
  // Generate Defs
  let defs = '';
  
  // Gradients
  if (state.fillMode === 'gradient') {
    defs += `
      <linearGradient id="grad-fill" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="${state.fill1}" />
        <stop offset="100%" stop-color="${state.fill2}" />
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
  if (state.texture && state.texture !== 'none') {
    defs += getTextureDefs(state.texture, state.texColor, state.texSize, state.texOpacity, state.texThickness);
  }

  // Build Paths with corrected animation
  let pathElements = '';
  let currentDelay = 0;
  const speed = state.speed || 0.5;

  paths.forEach((p, i) => {
    const duration = (p.len / 300) / speed;
    const delay = currentDelay;
    currentDelay += duration * 0.7; // Overlap for smooth flow

    const fill = state.fillMode === 'single' ? state.fill1 : 
                 state.fillMode === 'gradient' ? 'url(#grad-fill)' : 
                 (state.charColors[i] || state.fill1);
    
    const stroke = state.strokeEnabled ? state.stroke : 'none';
    const strokeWidth = state.strokeEnabled ? 2 : 0;
    const filterList = [state.useGlow ? 'url(#glow)' : '', state.useShadow ? 'url(#shadow)' : ''].filter(Boolean).join(' ');

    pathElements += `
      <path 
        d="${p.d}" 
        fill="${fill}" 
        stroke="${stroke}" 
        stroke-width="${strokeWidth}" 
        stroke-linecap="round" 
        stroke-linejoin="round"
        ${filterList ? `filter="${filterList}"` : ''}
        class="sig-path"
        style="
          stroke-dasharray: ${p.len}; 
          stroke-dashoffset: ${p.len}; 
          fill-opacity: 0;
          animation: 
            draw-${i} ${duration}s ease-out forwards ${delay}s, 
            fill-fade-${i} 0.8s ease-out forwards ${delay + duration * 0.6}s;
        "
      />
    `;
  });

  // Texture Overlay - fix pattern ID reference
  let textureOverlay = '';
  if (state.texture && state.texture !== 'none') {
    textureOverlay = `<rect x="${viewBox.x}" y="${viewBox.y}" width="${width}" height="${height}" fill="url(#texture-${state.texture})" pointer-events="none"/>`;
  }

  // Generate keyframes for each path
  let keyframes = '';
  paths.forEach((p, i) => {
    keyframes += `
      @keyframes draw-${i} { to { stroke-dashoffset: 0; } }
      @keyframes fill-fade-${i} { to { fill-opacity: 1; } }
    `;
  });

  return `
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="${viewBox.x} ${viewBox.y} ${width} ${height}"
      width="${width}"
      height="${height}"
      style="background-color: ${state.bgTransparent ? 'transparent' : state.bg}; border-radius: ${state.borderRadius}px;"
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
      ${textureOverlay}
      <g>${pathElements}</g>
    </svg>
  `;
}
