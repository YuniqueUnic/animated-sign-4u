import { describe, expect, it } from "vitest";
import { buildPaths } from "@/app/api/sign/route";
import { INITIAL_STATE } from "@/lib/constants";
import { SignatureState } from "@/lib/types";

// Simple fake font object for testing buildPaths in isolation
const fakeFont = {
  unitsPerEm: 1000,
  stringToGlyphs(text: string) {
    return Array.from(text).map(() => ({
      advanceWidth: 500,
      getPath(x: number, y: number, fontSize: number) {
        const left = x;
        const right = x + fontSize / 2;
        const top = y - fontSize / 2;
        const bottom = y + fontSize / 2;
        return {
          toPathData: () =>
            `M${left} ${top}L${right} ${top}L${right} ${bottom}L${left} ${bottom}Z`,
          getBoundingBox: () => ({
            x1: left,
            y1: top,
            x2: right,
            y2: bottom,
          }),
        };
      },
    }));
  },
};

describe("buildPaths", () => {
  it("generates paths and viewBox from glyphs", async () => {
    const state: SignatureState = {
      ...(INITIAL_STATE as SignatureState),
      text: "AB",
    };

    const { paths, viewBox } = await buildPaths(fakeFont as any, state);

    expect(paths.length).toBe(2);
    for (const p of paths) {
      expect(p.len).toBeGreaterThan(0);
      expect(p.d).toMatch(/^M/);
    }
    expect(viewBox.w).toBeGreaterThan(0);
    expect(viewBox.h).toBeGreaterThan(0);
  });
});
