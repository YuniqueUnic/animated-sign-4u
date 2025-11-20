import { describe, expect, it } from "vitest";
import {
    buildPaths,
    buildStateFromQuery,
    loadFont,
} from "@/app/api/sign/route";
import { INITIAL_STATE } from "@/lib/constants";

describe("Signature API Logic", () => {
    it("should parse charSpacing from query", () => {
        const params = new URLSearchParams();
        params.set("charSpacing", "20");

        const state = buildStateFromQuery(params);
        expect(state.charSpacing).toBe(20);
    });

    it("should apply charSpacing to path layout", async () => {
        const stateWithSpacing = {
            ...INITIAL_STATE,
            text: "AB",
            fontSize: 100,
            charSpacing: 50,
        };
        const stateWithoutSpacing = {
            ...INITIAL_STATE,
            text: "AB",
            fontSize: 100,
            charSpacing: 0,
        };

        const font = await loadFont(INITIAL_STATE.font);

        const resultWithSpacing = await buildPaths(font, stateWithSpacing);
        const resultWithoutSpacing = await buildPaths(
            font,
            stateWithoutSpacing,
        );

        const widthWithSpacing = resultWithSpacing.viewBox.w;
        const widthWithoutSpacing = resultWithoutSpacing.viewBox.w;

        // Width with spacing should be larger
        expect(widthWithSpacing).toBeGreaterThan(widthWithoutSpacing);

        // The difference should be roughly the spacing amount (plus/minus some floating point diff)
        expect(Math.abs((widthWithSpacing - widthWithoutSpacing) - 50))
            .toBeLessThan(5);
    });

    it("should apply a smaller positive spacing effect for Chinese than for English", async () => {
        const spacing = 50;

        const enStateBase = {
            ...INITIAL_STATE,
            text: "AB",
            fontSize: 100,
            charSpacing: 0,
        };
        const enStateSpaced = { ...enStateBase, charSpacing: spacing };

        const zhStateBase = {
            ...INITIAL_STATE,
            text: "你好",
            fontSize: 100,
            charSpacing: 0,
            font: "ma-shan-zheng",
        };
        const zhStateSpaced = { ...zhStateBase, charSpacing: spacing };

        const enFont = await loadFont(enStateBase.font);
        const zhFont = await loadFont(zhStateBase.font);

        const enBase = await buildPaths(enFont, enStateBase);
        const enSpaced = await buildPaths(enFont, enStateSpaced);

        const zhBase = await buildPaths(zhFont, zhStateBase);
        const zhSpaced = await buildPaths(zhFont, zhStateSpaced);

        const enDiff = enSpaced.viewBox.w - enBase.viewBox.w;
        const zhDiff = zhSpaced.viewBox.w - zhBase.viewBox.w;

        // Both should increase width with positive spacing
        expect(enDiff).toBeGreaterThan(0);
        expect(zhDiff).toBeGreaterThan(0);

        // Chinese spacing effect should be noticeably smaller than English (reflecting ~1/5 scaling)
        expect(zhDiff).toBeLessThan(enDiff);
        expect(zhDiff).toBeLessThan(enDiff / 2);
    });
});
