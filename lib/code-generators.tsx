import { SignatureState } from "./types";

export function generateReactComponent(
  svgCode: string,
  state: SignatureState,
): string {
  const cleanSvg = svgCode.replace(
    /<svg([^>]*)style="[^"]*"([^>]*)>/,
    "<svg$1$2>",
  );
  const bgVal = state.bgTransparent ? "transparent" : state.bg;

  return `import React from 'react';

export default function AnimatedSignature() {
  return (
    <div
      style={{
        display: 'inline-block',
        padding: '20px',
        backgroundColor: '${bgVal}',
        borderRadius: '${state.borderRadius}px'
      }}
    >
      <div dangerouslySetInnerHTML={{ __html: \`${cleanSvg}\` }} />
    </div>
  );
}`;
}

export function generateVueComponent(
  svgCode: string,
  state: SignatureState,
): string {
  const cleanSvg = svgCode.replace(
    /<svg([^>]*)style="[^"]*"([^>]*)>/,
    "<svg$1$2>",
  );
  const bgVal = state.bgTransparent ? "transparent" : state.bg;

  return `<template>
  <div class="signature-wrapper">
    <div v-html="svgContent"></div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const svgContent = ref(\`${cleanSvg}\`);
</script>

<style scoped>
.signature-wrapper {
  display: inline-block;
  padding: 20px;
  background-color: ${bgVal};
  border-radius: ${state.borderRadius}px;
}
</style>`;
}

export function generateJSComponent(
  svgCode: string,
  state: SignatureState,
): string {
  const cleanSvg = svgCode.replace(
    /<svg([^>]*)style="[^"]*"([^>]*)>/,
    "<svg$1$2>",
  );
  const bgVal = state.bgTransparent ? "transparent" : state.bg;

  return `/**
 * Animated Signature Component
 * Native JavaScript Implementation
 */

export function createAnimatedSignature(containerId) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(\`Container with id "\${containerId}" not found\`);
    return;
  }

  const wrapper = document.createElement('div');
  wrapper.style.display = 'inline-block';
  wrapper.style.padding = '20px';
  wrapper.style.backgroundColor = '${bgVal}';
  wrapper.style.borderRadius = '${state.borderRadius}px';

  wrapper.innerHTML = \`${cleanSvg}\`;

  container.appendChild(wrapper);

  return wrapper;
}

// Usage Example:
// import { createAnimatedSignature } from './signature.js';
// createAnimatedSignature('signature-container');
`;
}
