import { describe, expect, it } from "vitest";
import { buildStateFromQuery, buildPaths, loadFont } from "@/app/api/sign/route";
import { INITIAL_STATE } from "@/lib/constants";

describe("Signature API Logic", () => {
    it("should parse charSpacing from query", () => {
        const params = new URLSearchParams();
        params.set("charSpacing", "20");
        
        const state = buildStateFromQuery(params);
        expect(state.charSpacing).toBe(20);
    });

    it("should apply charSpacing to path layout", async () => {
        const stateWithSpacing = { ...INITIAL_STATE, text: "AB", fontSize: 100, charSpacing: 50 };
        const stateWithoutSpacing = { ...INITIAL_STATE, text: "AB", fontSize: 100, charSpacing: 0 };

        const font = await loadFont(INITIAL_STATE.font);

        const resultWithSpacing = await buildPaths(font, stateWithSpacing);
        const resultWithoutSpacing = await buildPaths(font, stateWithoutSpacing);

        const widthWithSpacing = resultWithSpacing.viewBox.w;
        const widthWithoutSpacing = resultWithoutSpacing.viewBox.w;

        // Width with spacing should be larger
        expect(widthWithSpacing).toBeGreaterThan(widthWithoutSpacing);
        
        // The difference should be roughly the spacing amount (plus/minus some floating point diff)
        expect(Math.abs((widthWithSpacing - widthWithoutSpacing) - 50)).toBeLessThan(5);
    });
});
