export type FillMode = "single" | "gradient" | "multi";
export type TextureType = "none" | "grid" | "dots" | "lines" | "cross";
export type BgMode = "solid" | "gradient";

export interface SignatureState {
  text: string;
  font: string;
  fontSize: number;
  speed: number;

  // Background
  bg: string;
  bg2: string;
  bgMode: BgMode;
  bgTransparent: boolean;
  borderRadius: number;

  // Stroke
  stroke: string;
  strokeEnabled: boolean;

  // Fill
  fillMode: FillMode;
  fill1: string;
  fill2: string;
  charColors: string[];

  // Texture
  texture: TextureType;
  texColor: string;
  texSize: number;
  texThickness: number;
  texOpacity: number;

  // Effects
  useGlow: boolean;
  useShadow: boolean;
}

export interface ThemeConfig extends Partial<SignatureState> {
  isRainbow?: boolean;
}
