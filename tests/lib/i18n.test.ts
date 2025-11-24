import { describe, expect, it } from "vitest";
import { translate } from "@/lib/i18n";

describe("i18n translate", () => {
  it("returns English strings for en locale", () => {
    expect(translate("en", "appTitle")).toBe("Animated Signature 4u");
    expect(translate("en", "svgButton")).toBe("SVG");
  });

  it("returns Chinese strings for zh locale", () => {
    expect(translate("zh", "appTitle")).toBe("动态签名 4u");
    expect(translate("zh", "svgButton")).toBe("SVG 图像");
  });

  it("falls back to English if locale is unknown", () => {
    // @ts-expect-error testing fallback
    expect(translate("fr", "appTitle")).toBe("Animated Signature 4u");
  });
});
