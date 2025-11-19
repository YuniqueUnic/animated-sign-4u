import { describe, expect, it } from "vitest";
import { buildStateFromQuery } from "@/app/api/sign/route";
import { INITIAL_STATE } from "@/lib/constants";

describe("buildStateFromQuery", () => {
    it("applies theme and query overrides", () => {
        const params = new URLSearchParams({
            theme: "laser",
            text: "Hello",
            font: "lobster",
            fill: "gradient",
            bg: "000000",
            texture: "grid",
        });

        const state = buildStateFromQuery(params);

        expect(state.text).toBe("Hello");
        expect(state.font).toBe("lobster");
        expect(state.fillMode).toBe("gradient");
        expect(state.bgTransparent).toBe(false);
        expect(state.bg).toBe("#000000");
        expect(state.texture).toBe("grid");
        // Should at least carry over some theme defaults
        expect(state.stroke).toBeDefined();
    });

    it("falls back to INITIAL_STATE when no params", () => {
        const params = new URLSearchParams();
        const state = buildStateFromQuery(params);

        expect(state.text).toBe(INITIAL_STATE.text);
        expect(state.font).toBe(INITIAL_STATE.font);
    });

    it("populates charColors when fill=multi and no explicit colors", () => {
        const params = new URLSearchParams({
            text: "MultiTest",
            fill: "multi",
        });

        const state = buildStateFromQuery(params);

        expect(state.fillMode).toBe("multi");
        expect(state.charColors.length).toBe(state.text.length);
    });

    it("uses colors param to set charColors and multi fillMode", () => {
        const params = new URLSearchParams({
            text: "AB",
            colors: "ff0000-00ff00",
        });

        const state = buildStateFromQuery(params);

        expect(state.fillMode).toBe("multi");
        expect(state.charColors[0]).toBe("#ff0000");
        expect(state.charColors[1]).toBe("#00ff00");
    });
});
