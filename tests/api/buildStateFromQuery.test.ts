import { describe, expect, it } from "vitest";
import { buildStateFromQuery } from "@/lib/state-from-query";
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

  it("parses background size parameters", () => {
    const params = new URLSearchParams({
      bgSizeMode: "custom",
      bgWidth: "800",
      bgHeight: "400",
    });

    const state = buildStateFromQuery(params);

    expect(state.bgSizeMode).toBe("custom");
    expect(state.bgWidth).toBe(800);
    expect(state.bgHeight).toBe(400);
  });

  it("parses core style and color parameters", () => {
    const params = new URLSearchParams({
      text: "Signature",
      font: "sacramento",
      fontSize: "39",
      speed: "1.25",
      charSpacing: "10",
      borderRadius: "32",
      cardPadding: "16",
      fill1: "ff0000",
      fill2: "00ff00",
      stroke: "0000ff",
      stroke2: "333333",
      strokeMode: "gradient",
      strokeEnabled: "1",
      bg: "1e3a8a",
      bgMode: "gradient",
      bg2: "0f172a",
      texture: "grid",
      texColor: "ffffff",
      texSize: "42",
      texThickness: "2",
      texOpacity: "0.7",
      useGlow: "1",
      useShadow: "0",
    });

    const state = buildStateFromQuery(params);

    expect(state.text).toBe("Signature");
    expect(state.font).toBe("sacramento");
    expect(state.fontSize).toBe(39);
    expect(state.speed).toBe(1.25);
    expect(state.charSpacing).toBe(10);
    expect(state.borderRadius).toBe(32);
    expect(state.cardPadding).toBe(16);

    expect(state.fill1).toBe("#ff0000");
    expect(state.fill2).toBe("#00ff00");
    expect(state.stroke).toBe("#0000ff");
    expect(state.stroke2).toBe("#333333");
    expect(state.strokeMode).toBe("gradient");
    expect(state.strokeEnabled).toBe(true);

    expect(state.bgTransparent).toBe(false);
    expect(state.bg).toBe("#1e3a8a");
    expect(state.bgMode).toBe("gradient");
    expect(state.bg2).toBe("#0f172a");

    expect(state.texture).toBe("grid");
    expect(state.texColor).toBe("#ffffff");
    expect(state.texSize).toBe(42);
    expect(state.texThickness).toBe(2);
    expect(state.texOpacity).toBe(0.7);

    expect(state.useGlow).toBe(true);
    expect(state.useShadow).toBe(false);
  });

  it("parses boolean flags for linkFillStroke and useHanziData", () => {
    const params = new URLSearchParams({
      linkFillStroke: "1",
      useHanziData: "true",
      useGlow: "0",
      useShadow: "true",
    });

    const state = buildStateFromQuery(params);

    expect(state.linkFillStroke).toBe(true);
    expect(state.useHanziData).toBe(true);
    // Mixed boolean encodings should still be respected
    expect(state.useGlow).toBe(false);
    expect(state.useShadow).toBe(true);
  });

  it("treats bg=transparent as transparent background while still parsing bgMode/bg2", () => {
    const params = new URLSearchParams({
      bg: "transparent",
      bgMode: "gradient",
      bg2: "112233",
    });

    const state = buildStateFromQuery(params);

    expect(state.bgTransparent).toBe(true);
    // bg color itself is not important when transparent, but mode/secondary
    // should still be parsed for consistency when toggling transparency.
    expect(state.bgMode).toBe("gradient");
    expect(state.bg2).toBe("#112233");
  });

  it("parses repeat and eraseOnComplete flags", () => {
    const params = new URLSearchParams({
      repeat: "0",
      eraseOnComplete: "1",
    });

    const state = buildStateFromQuery(params);

    expect(state.repeat).toBe(false);
    expect(state.eraseOnComplete).toBe(true);
  });

  it("parses gifFps and gifQuality from short keys", () => {
    const params = new URLSearchParams({
      gf: "24",
      gq: "12",
    });

    const state = buildStateFromQuery(params);

    expect(state.gifFps).toBe(24);
    expect(state.gifQuality).toBe(12);
  });

  it("ignores invalid numeric values and keeps INITIAL_STATE defaults", () => {
    const params = new URLSearchParams({
      fontSize: "-10",
      speed: "0",
      charSpacing: "NaN",
      borderRadius: "-4",
      cardPadding: "-1",
      bgWidth: "-100",
      bgHeight: "0",
      texSize: "0",
      texThickness: "-2",
      texOpacity: "2",
    });

    const state = buildStateFromQuery(params);

    expect(state.fontSize).toBe(INITIAL_STATE.fontSize);
    expect(state.speed).toBe(INITIAL_STATE.speed);
    expect(state.charSpacing).toBe(INITIAL_STATE.charSpacing);
    expect(state.borderRadius).toBe(INITIAL_STATE.borderRadius);
    expect(state.cardPadding).toBe(INITIAL_STATE.cardPadding);
    expect(state.bgWidth).toBe(INITIAL_STATE.bgWidth);
    expect(state.bgHeight).toBe(INITIAL_STATE.bgHeight);
    expect(state.texSize).toBe(INITIAL_STATE.texSize);
    expect(state.texThickness).toBe(INITIAL_STATE.texThickness);
    expect(state.texOpacity).toBe(INITIAL_STATE.texOpacity);
  });
});
