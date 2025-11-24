import { describe, expect, it } from "vitest";
import {
  generateJSComponent,
  generateReactComponent,
  generateVueComponent,
} from "@/lib/code-generators";
import { INITIAL_STATE } from "@/lib/constants";
import { SignatureState } from "@/lib/types";

const baseState: SignatureState = {
  ...(INITIAL_STATE as SignatureState),
  bgTransparent: false,
  bg: "#123456",
  borderRadius: 12,
};

const svgWithInlineStyle =
  '<svg width="100" height="100" style="background:red"><path d="M0 0 L10 0"/></svg>';

describe("generateReactComponent", () => {
  it("embeds background and radius and strips inline style", () => {
    const code = generateReactComponent(svgWithInlineStyle, baseState);

    expect(code).toContain("backgroundColor: '#123456'");
    expect(code).toContain("borderRadius: '12px'");
    expect(code).not.toContain('style="background:red"');
  });
});

describe("generateVueComponent", () => {
  it("embeds background and radius and strips inline style", () => {
    const code = generateVueComponent(svgWithInlineStyle, baseState);

    expect(code).toContain("background-color: #123456;");
    expect(code).toContain("border-radius: 12px;");
    expect(code).not.toContain('style="background:red"');
  });
});

describe("generateJSComponent", () => {
  it("embeds background and radius and strips inline style", () => {
    const code = generateJSComponent(svgWithInlineStyle, baseState);

    expect(code).toContain("wrapper.style.backgroundColor = '#123456';");
    expect(code).toContain("wrapper.style.borderRadius = '12px';");
    expect(code).not.toContain('style="background:red"');
  });
});
