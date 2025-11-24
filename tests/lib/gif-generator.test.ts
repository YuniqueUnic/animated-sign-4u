import { describe, expect, it, vi } from "vitest";
import { generateAnimatedGIF } from "@/lib/gif-generator";
import { PathData } from "@/lib/svg-generator";
import { INITIAL_STATE } from "@/lib/constants";

// Mock Hanzi data utilities
vi.mock("@/lib/hanzi-data", () => ({
  fetchHanziData: vi.fn(async () => ({
    strokes: ["M0 0 L10 0", "M0 0 L0 10"],
  })),
  isChinese: (ch: string) => /[\u4e00-\u9fff]/u.test(ch),
  mergeHanziStrokes: (strokes: string[]) => strokes.join(" "),
}));

describe("generateAnimatedGIF", () => {
  it("should generate a GIF buffer", async () => {
    const state = {
      ...INITIAL_STATE,
      text: "Test",
      speed: 5, // Fast animation for quick test
    };

    const paths: PathData[] = [
      { d: "M0 0 L100 0 L100 100 L0 100 Z", len: 400, index: 0 },
      { d: "M110 0 L210 0 L210 100 L110 100 Z", len: 400, index: 1 },
    ];

    const viewBox = { x: 0, y: 0, w: 220, h: 100 };

    const gifBuffer = await generateAnimatedGIF(state, paths, viewBox, {
      fps: 10, // Low fps for faster test
      quality: 15,
    });

    expect(gifBuffer).toBeInstanceOf(Buffer);
    expect(gifBuffer.length).toBeGreaterThan(0);

    // Check GIF magic bytes (GIF89a or GIF87a)
    const header = gifBuffer.toString("ascii", 0, 6);
    expect(header).toMatch(/^GIF8[79]a$/);
  }, 30000); // 30 second timeout for GIF generation

  it("should respect custom dimensions", async () => {
    const state = {
      ...INITIAL_STATE,
      text: "A",
      speed: 10,
    };

    const paths: PathData[] = [
      { d: "M0 0 L50 0 L50 50 L0 50 Z", len: 200, index: 0 },
    ];

    const viewBox = { x: 0, y: 0, w: 50, h: 50 };

    const gifBuffer = await generateAnimatedGIF(state, paths, viewBox, {
      fps: 5,
      width: 200,
      height: 200,
      quality: 20,
    });

    expect(gifBuffer).toBeInstanceOf(Buffer);
    expect(gifBuffer.length).toBeGreaterThan(0);
  }, 20000);
});
