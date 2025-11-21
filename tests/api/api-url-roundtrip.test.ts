import { describe, expect, it } from "vitest";
import { buildStateFromQuery } from "@/app/api/sign/route";
import { buildSignApiUrl } from "@/lib/api-url";
import { INITIAL_STATE } from "@/lib/constants";

// Helper to build a SignatureState matching the example URL the user provided
function buildExampleState() {
    return {
        ...INITIAL_STATE,
        text: "Signature",
        font: "sacramento",
        fontSize: 39,
        speed: 1,
        charSpacing: 0,
        borderRadius: 100,
        cardPadding: 24,
        fill1: "#ff0000",
        fill2: "#ec4899",
        stroke: "#ff0000",
        stroke2: "#333333",
        strokeMode: "single" as const,
        strokeEnabled: true,
        bg: "#1e3a8a",
        bgMode: "solid" as const,
        bg2: "#1e3a8a",
        bgSizeMode: "custom" as const,
        bgWidth: 100,
        bgHeight: 100,
        texture: "grid" as const,
        texColor: "#ffffff",
        texSize: 30,
        texThickness: 1,
        texOpacity: 0.2,
        useGlow: false,
        useShadow: false,
    };
}

describe("/api/sign URL and state roundtrip", () => {
    it("parses the documented example URL correctly", () => {
        const url =
            "http://localhost:3000/api/sign?text=Signature&font=sacramento&fontSize=39&speed=1&charSpacing=0&borderRadius=100&cardPadding=24&fill1=ff0000&fill2=ec4899&stroke=ff0000&stroke2=333333&strokeMode=single&strokeEnabled=1&bg=1e3a8a&bgMode=solid&bg2=1e3a8a&bgSizeMode=custom&bgWidth=100&bgHeight=100&texture=grid&texColor=ffffff&texSize=30&texThickness=1&texOpacity=0.2";

        const params = new URL(url).searchParams;
        const state = buildStateFromQuery(params);

        expect(state.text).toBe("Signature");
        expect(state.font).toBe("sacramento");
        expect(state.fontSize).toBe(39);
        expect(state.speed).toBe(1);
        expect(state.charSpacing).toBe(0);
        expect(state.borderRadius).toBe(100);
        expect(state.cardPadding).toBe(24);

        expect(state.fill1).toBe("#ff0000");
        expect(state.fill2).toBe("#ec4899");
        expect(state.stroke).toBe("#ff0000");
        expect(state.stroke2).toBe("#333333");
        expect(state.strokeMode).toBe("single");
        expect(state.strokeEnabled).toBe(true);

        expect(state.bg).toBe("#1e3a8a");
        expect(state.bgMode).toBe("solid");
        expect(state.bg2).toBe("#1e3a8a");

        expect(state.bgSizeMode).toBe("custom");
        expect(state.bgWidth).toBe(100);
        expect(state.bgHeight).toBe(100);

        expect(state.texture).toBe("grid");
        expect(state.texColor).toBe("#ffffff");
        expect(state.texSize).toBe(30);
        expect(state.texThickness).toBe(1);
        expect(state.texOpacity).toBe(0.2);
    });

    it("supports state -> URL -> state roundtrip for the example config", () => {
        const example = buildExampleState();

        const url = buildSignApiUrl(example, {
            origin: "http://localhost:3000",
        });
        const params = new URL(url).searchParams;
        const parsed = buildStateFromQuery(params);

        // Core identity fields
        expect(parsed.text).toBe(example.text);
        expect(parsed.font).toBe(example.font);
        expect(parsed.fontSize).toBe(example.fontSize);
        expect(parsed.speed).toBe(example.speed);
        expect(parsed.charSpacing).toBe(example.charSpacing);
        expect(parsed.borderRadius).toBe(example.borderRadius);
        expect(parsed.cardPadding).toBe(example.cardPadding);

        // Colors and stroke/fill modes
        expect(parsed.fill1).toBe(example.fill1);
        expect(parsed.fill2).toBe(example.fill2);
        expect(parsed.stroke).toBe(example.stroke);
        expect(parsed.stroke2).toBe(example.stroke2);
        expect(parsed.strokeMode).toBe(example.strokeMode);
        expect(parsed.strokeEnabled).toBe(example.strokeEnabled);

        // Background
        expect(parsed.bgTransparent).toBe(false);
        expect(parsed.bg).toBe(example.bg);
        expect(parsed.bgMode).toBe(example.bgMode);
        expect(parsed.bg2).toBe(example.bg2);
        expect(parsed.bgSizeMode).toBe(example.bgSizeMode);
        expect(parsed.bgWidth).toBe(example.bgWidth);
        expect(parsed.bgHeight).toBe(example.bgHeight);

        // Texture and effects
        expect(parsed.texture).toBe(example.texture);
        expect(parsed.texColor).toBe(example.texColor);
        expect(parsed.texSize).toBe(example.texSize);
        expect(parsed.texThickness).toBe(example.texThickness);
        expect(parsed.texOpacity).toBe(example.texOpacity);
        expect(parsed.useGlow).toBe(example.useGlow);
        expect(parsed.useShadow).toBe(example.useShadow);
    });

    it("supports path parameter format for text (alternative API format)", () => {
        // Simulate the path parameter format: /api/sign/MyText?font=sacramento
        // In this format, text is extracted from the path and merged with query params
        const textFromPath = "CustomSignature";
        const queryParams = new URLSearchParams({
            font: "sacramento",
            fontSize: "100",
            charSpacing: "20",
        });

        // Merge path parameter with query parameters (path takes precedence)
        const mergedParams = new URLSearchParams(queryParams);
        mergedParams.set("text", textFromPath);

        const state = buildStateFromQuery(mergedParams);

        expect(state.text).toBe("CustomSignature");
        expect(state.font).toBe("sacramento");
        expect(state.fontSize).toBe(100);
        expect(state.charSpacing).toBe(20);
    });
});
