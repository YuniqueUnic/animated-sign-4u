export type FillMode = "single" | "gradient" | "multi";
export type StrokeMode = "single" | "gradient" | "multi";
export type TextureType =
  | "none"
  | "grid"
  | "dots"
  | "lines"
  | "cross"
  | "tianzige"
  | "mizige";
export type BgMode = "solid" | "gradient";
export type BgSizeMode = "auto" | "custom";

export interface SignatureState {
  text: string;
  font: string;
  fontSize: number;
  speed: number;
  repeat: boolean; // Animation repeat mode: true for infinite loop, false for single play

  charSpacing: number;

  // Background
  bg: string;
  bg2: string;
  bgMode: BgMode;
  bgTransparent: boolean;
  borderRadius: number;
  cardPadding: number;
  bgSizeMode: BgSizeMode;
  bgWidth: number | null;
  bgHeight: number | null;

  // Stroke
  stroke: string;
  strokeEnabled: boolean;
  strokeMode: StrokeMode;
  stroke2: string;
  strokeCharColors: string[];

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

  // When true, stroke mode/colors follow fill mode/colors (linked mode)
  linkFillStroke: boolean;

  // Chinese Stroke Mode
  useHanziData?: boolean;

  // GIF Export Settings
  gifFps?: number;        // Frames per second for GIF export (default: 30)
  gifQuality?: number;    // GIF quality 1-20, lower is better (default: 5)
}

export interface ThemeConfig extends Partial<SignatureState> {
  // Optional generators for multi-color themes (fill / stroke).
  // When present, both the API and the editor should use these to
  // derive per-character colors instead of inferring in UI code.
  charColorsFn?: (text: string) => string[];
  strokeCharColorsFn?: (text: string) => string[];
}
