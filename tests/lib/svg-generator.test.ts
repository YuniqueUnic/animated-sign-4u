import { describe, expect, it } from "vitest";
import { generateSVG, getTextureDefs, PathData } from "@/lib/svg-generator";
import { INITIAL_STATE } from "@/lib/constants";
import { SignatureState } from "@/lib/types";

describe("getTextureDefs", () => {
  it("returns correct pattern ids for each texture type", () => {
    const base = { color: "#000000", size: 20, opacity: 0.5, thickness: 1 };

    const grid = getTextureDefs(
      "grid",
      base.color,
      base.size,
      base.opacity,
      base.thickness,
    );
    expect(grid).toContain('id="texture-grid"');
    expect(grid).toContain('<path d="M');

    const dots = getTextureDefs(
      "dots",
      base.color,
      base.size,
      base.opacity,
      base.thickness,
    );
    expect(dots).toContain('id="texture-dots"');
    expect(dots).toContain("<circle");

    const lines = getTextureDefs(
      "lines",
      base.color,
      base.size,
      base.opacity,
      base.thickness,
    );
    expect(lines).toContain('id="texture-lines"');
    expect(lines).toContain('<path d="M 0');

    const cross = getTextureDefs(
      "cross",
      base.color,
      base.size,
      base.opacity,
      base.thickness,
    );
    expect(cross).toContain('id="texture-cross"');
    expect(cross).toContain('<path d="M ');

    const none = getTextureDefs(
      "none",
      base.color,
      base.size,
      base.opacity,
      base.thickness,
    );
    expect(none.trim()).toBe("");
  });
});

describe("generateSVG - background and textures", () => {
  const baseViewBox = { x: 0, y: 0, w: 200, h: 100 };
  const simplePaths: PathData[] = [
    { d: "M0 0 L10 0", len: 10, index: 0 },
  ];

  it("uses solid background rect when bgMode=solid", () => {
    const state: SignatureState = {
      ...(INITIAL_STATE as SignatureState),
      bgTransparent: false,
      bgMode: "solid",
      bg: "#ff0000",
    };

    const svg = generateSVG(state, simplePaths, baseViewBox);
    expect(svg).toContain(
      '<rect x="0" y="0" width="200" height="100" fill="#ff0000"',
    );
    expect(svg).not.toContain('id="bg-grad"');
  });

  it("defines bg-grad and uses it when bgMode=gradient", () => {
    const state: SignatureState = {
      ...(INITIAL_STATE as SignatureState),
      bgTransparent: false,
      bgMode: "gradient",
      bg: "#111111",
      bg2: "#222222",
    };

    const svg = generateSVG(state, simplePaths, baseViewBox);
    expect(svg).toContain('<linearGradient id="bg-grad"');
    expect(svg).toContain('fill="url(#bg-grad)"');
  });

  it("renders texture defs and overlay with padding", () => {
    const state: SignatureState = {
      ...(INITIAL_STATE as SignatureState),
      bgTransparent: false,
      texture: "grid",
      texColor: "#123456",
      texSize: 20,
      texOpacity: 0.6,
      texThickness: 1,
      cardPadding: 10,
    };

    const svg = generateSVG(state, simplePaths, baseViewBox);

    // has texture pattern def
    expect(svg).toContain('id="texture-grid"');

    // overlay rect should use texture-grid and account for padding
    expect(svg).toContain('fill="url(#texture-grid)"');
    expect(svg).toContain('x="10"');
    expect(svg).toContain('width="180"');
  });

  it("centers custom background size as a card while keeping svg dimensions when card is smaller than text", () => {
    const state: SignatureState = {
      ...(INITIAL_STATE as SignatureState),
      bgTransparent: false,
      bgMode: "solid",
      bg: "#ff0000",
      bgSizeMode: "custom",
      bgWidth: 100,
      bgHeight: 40,
    };

    const svg = generateSVG(state, simplePaths, baseViewBox);

    // SVG keeps the original text canvas dimensions
    expect(svg).toContain('viewBox="0 0 200 100"');
    expect(svg).toContain('width="200"');
    expect(svg).toContain('height="100"');

    // Background rect is centered as a smaller card
    expect(svg).toContain(
      '<rect x="50" y="30" width="100" height="40" fill="#ff0000"',
    );
  });

  it("expands canvas when custom background is larger than text bounds", () => {
    const state: SignatureState = {
      ...(INITIAL_STATE as SignatureState),
      bgTransparent: false,
      bgMode: "solid",
      bg: "#00ff00",
      bgSizeMode: "custom",
      bgWidth: 300,
      bgHeight: 150,
    };

    const svg = generateSVG(state, simplePaths, baseViewBox);

    // Canvas grows to fit the larger card
    expect(svg).toContain('viewBox="0 0 300 150"');
    expect(svg).toContain('width="300"');
    expect(svg).toContain('height="150"');

    // Background card fills the canvas
    expect(svg).toContain(
      '<rect x="0" y="0" width="300" height="150" fill="#00ff00"',
    );

    // Paths are translated to keep text centered over the card
    expect(svg).toContain('<g transform="translate(50, 25)">');
  });
});

describe("generateSVG - fill gradients", () => {
  const baseViewBox = { x: 0, y: 0, w: 200, h: 100 };
  const simplePaths: PathData[] = [
    { d: "M0 0 L10 0", len: 10, index: 0 },
  ];

  it("uses solid fill when fillMode=single", () => {
    const state: SignatureState = {
      ...(INITIAL_STATE as SignatureState),
      fillMode: "single",
      fill1: "#00ff00",
    };

    const svg = generateSVG(state, simplePaths, baseViewBox);
    expect(svg).toContain('fill="#00ff00"');
    expect(svg).not.toContain('id="grad-fill"');
  });

  it("defines grad-fill and uses it when fillMode=gradient", () => {
    const state: SignatureState = {
      ...(INITIAL_STATE as SignatureState),
      fillMode: "gradient",
      fill1: "#00ffff",
      fill2: "#ff00ff",
    };

    const svg = generateSVG(state, simplePaths, baseViewBox);
    expect(svg).toContain('<linearGradient id="grad-fill"');
    expect(svg).toContain('fill="url(#grad-fill)"');
  });
});

describe("generateSVG - stroke modes", () => {
  const baseViewBox = { x: 0, y: 0, w: 200, h: 100 };
  const simplePaths: PathData[] = [
    { d: "M0 0 L10 0", len: 10, index: 0 },
    { d: "M10 0 L20 0", len: 10, index: 1 },
  ];

  it("uses solid stroke when strokeMode=single", () => {
    const state: SignatureState = {
      ...(INITIAL_STATE as SignatureState),
      strokeEnabled: true,
      strokeMode: "single",
      stroke: "#ff0000",
    };

    const svg = generateSVG(state, simplePaths, baseViewBox);
    expect(svg).toContain('stroke="#ff0000"');
    expect(svg).not.toContain('id="grad-stroke"');
  });

  it("defines grad-stroke and uses it when strokeMode=gradient", () => {
    const state: SignatureState = {
      ...(INITIAL_STATE as SignatureState),
      strokeEnabled: true,
      strokeMode: "gradient",
      stroke: "#00ffff",
      stroke2: "#ff00ff",
    };

    const svg = generateSVG(state, simplePaths, baseViewBox);
    expect(svg).toContain('<linearGradient id="grad-stroke"');
    expect(svg).toContain('stroke="url(#grad-stroke)"');
  });

  it("uses per-path stroke colors when strokeMode=multi", () => {
    const state: SignatureState = {
      ...(INITIAL_STATE as SignatureState),
      strokeEnabled: true,
      strokeMode: "multi",
      stroke: "#000000",
      strokeCharColors: ["#ff0000", "#00ff00"],
    };

    const svg = generateSVG(state, simplePaths, baseViewBox);
    expect(svg).toContain('stroke="#ff0000"');
    expect(svg).toContain('stroke="#00ff00"');
  });
});

// 回归测试：确保为不同布局（desktop / mobile）生成的 SVG 使用互不冲突的 id。
// 背景：曾经在页面中同时挂载两个 PreviewArea（桌面 + 移动预览）时，
// 它们的 <defs> / <filter> / <linearGradient> 等使用相同的 id，
// 导致移动端预览在部分浏览器中出现背景、纹理、动画错乱。
// 通过为每个实例传入 idPrefix（例如 "desktop-" / "mobile-"），
// 可以让每个 SVG 拥有独立的“命名空间”，从而彻底解决该问题。
describe("generateSVG - idPrefix scoping", () => {
  const baseViewBox = { x: 0, y: 0, w: 200, h: 100 };
  const simplePaths: PathData[] = [
    { d: "M0 0 L10 0", len: 10, index: 0 },
  ];

  it("applies idPrefix to background gradient and keeps ids distinct per instance", () => {
    const state: SignatureState = {
      ...(INITIAL_STATE as SignatureState),
      bgTransparent: false,
      bgMode: "gradient",
      bg: "#111111",
      bg2: "#222222",
    };

    const desktopSvg = generateSVG(state, simplePaths, baseViewBox, {
      idPrefix: "desktop-",
    });
    const mobileSvg = generateSVG(state, simplePaths, baseViewBox, {
      idPrefix: "mobile-",
    });

    expect(desktopSvg).toContain('id="desktop-bg-grad"');
    expect(desktopSvg).toContain('fill="url(#desktop-bg-grad)"');
    expect(mobileSvg).toContain('id="mobile-bg-grad"');
    expect(mobileSvg).toContain('fill="url(#mobile-bg-grad)"');

    // When idPrefix is provided, we should not leak bare bg-grad ids.
    expect(desktopSvg).not.toContain('id="bg-grad"');
    expect(mobileSvg).not.toContain('id="bg-grad"');

    // Ensure desktop/mobile instances don't accidentally share the same ids.
    expect(desktopSvg).not.toContain('id="mobile-bg-grad"');
    expect(mobileSvg).not.toContain('id="desktop-bg-grad"');
  });

  it("prefixes texture pattern ids so multiple SVGs can coexist safely", () => {
    const state: SignatureState = {
      ...(INITIAL_STATE as SignatureState),
      bgTransparent: false,
      texture: "grid",
      texColor: "#123456",
      texSize: 20,
      texOpacity: 0.6,
      texThickness: 1,
      cardPadding: 10,
    };

    const svg = generateSVG(state, simplePaths, baseViewBox, {
      idPrefix: "mobile-",
    });

    expect(svg).toContain('id="mobile-texture-grid"');
    expect(svg).toContain('fill="url(#mobile-texture-grid)"');
  });
});

describe("generateSVG - eraseOnComplete carousel behavior", () => {
  const baseViewBox = { x: 0, y: 0, w: 200, h: 100 };
  const simplePaths: PathData[] = [
    { d: "M0 0 L10 0", len: 10, index: 0 },
  ];

  it("uses forward-only animation without cycle controller when eraseOnComplete is false", () => {
    const state: SignatureState = {
      ...(INITIAL_STATE as SignatureState),
      eraseOnComplete: false,
      repeat: true,
    };

    const svg = generateSVG(state, simplePaths, baseViewBox);

    // No global cycle controller should be present
    expect(svg).not.toContain('id="cycle"');
    expect(svg).not.toContain("cycle.begin");

    // Paths still animate stroke-dashoffset forward once
    expect(svg).toContain('attributeName="stroke-dashoffset"');
    expect(svg).toContain('begin="0s"');
  });

  it("adds repeating cycle controller and erase phase when eraseOnComplete is true and repeat=true", () => {
    const state: SignatureState = {
      ...(INITIAL_STATE as SignatureState),
      eraseOnComplete: true,
      repeat: true,
    };

    const svg = generateSVG(state, simplePaths, baseViewBox);

    // Global cycle controller with repeat semantics
    expect(svg).toContain('id="cycle"');
    expect(svg).toContain('begin="0s;cycle.end"');

    // Per-path animations should be driven by the cycle controller
    expect(svg).toContain('begin="cycle.begin + ');
  });

  it("adds non-repeating cycle controller when eraseOnComplete is true and repeat=false", () => {
    const state: SignatureState = {
      ...(INITIAL_STATE as SignatureState),
      eraseOnComplete: true,
      repeat: false,
    };

    const svg = generateSVG(state, simplePaths, baseViewBox);

    // Global cycle controller should run once without cycle.end chaining
    expect(svg).toContain('id="cycle"');
    expect(svg).toContain('begin="0s"');
    expect(svg).not.toContain("cycle.end");

    // Per-path animations are still tied to the cycle begin time
    expect(svg).toContain('begin="cycle.begin + ');
  });

  it("omits SMIL animations and keeps final frame visible in staticRender mode", () => {
    const state: SignatureState = {
      ...(INITIAL_STATE as SignatureState),
      eraseOnComplete: true,
    };

    const svg = generateSVG(state, simplePaths, baseViewBox, {
      staticRender: true,
    });

    // Static render should not emit any <animate> elements
    expect(svg).not.toContain("<animate");

    // Paths should be fully drawn and filled in the final frame
    expect(svg).toContain('stroke-dashoffset="0"');
    expect(svg).toContain('fill-opacity="1"');
  });
});
