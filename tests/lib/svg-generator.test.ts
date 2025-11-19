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
