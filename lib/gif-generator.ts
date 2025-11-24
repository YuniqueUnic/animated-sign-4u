import sharp from "sharp";
import GifEncoder from "gif-encoder-2";
import { SignatureState } from "@/lib/types";
import { PathData } from "@/lib/svg-generator";
import {
  calculateAnimationDuration,
  generateSVGFrame,
} from "@/lib/svg-generator-animated";

/**
 * Generate an animated GIF from the signature animation
 * @param state - The signature state configuration
 * @param paths - The path data for the signature
 * @param viewBox - The SVG viewBox dimensions
 * @param options - GIF generation options
 * @returns Buffer containing the animated GIF
 */
export async function generateAnimatedGIF(
  state: SignatureState,
  paths: PathData[],
  viewBox: { x: number; y: number; w: number; h: number },
  options?: {
    fps?: number;
    width?: number;
    height?: number;
    quality?: number;
  },
): Promise<Buffer> {
  const fps = options?.fps ?? 30; // Frames per second (30 for smoother animation)
  const quality = options?.quality ?? 5; // 1-20, lower is better (5 for higher quality)

  // Calculate total animation duration
  const totalDuration = calculateAnimationDuration(paths, state.speed || 1);

  // Calculate number of frames
  const frameCount = Math.ceil(totalDuration * fps);
  const frameDuration = 1000 / fps; // Duration of each frame in milliseconds

  // Determine GIF dimensions
  const textWidth = viewBox.w;
  const textHeight = viewBox.h;
  let canvasWidth = textWidth;
  let canvasHeight = textHeight;

  if (state.bgSizeMode === "custom") {
    canvasWidth = Math.max(canvasWidth, state.bgWidth || textWidth);
    canvasHeight = Math.max(canvasHeight, state.bgHeight || textHeight);
  } else if (!state.bgTransparent) {
    canvasWidth = Math.max(canvasWidth, textWidth);
    canvasHeight = Math.max(canvasHeight, textHeight);
  }

  // Apply custom dimensions if specified
  let targetWidth = options?.width ?? Math.round(canvasWidth);
  let targetHeight = options?.height ?? Math.round(canvasHeight);

  // Ensure reasonable size (max 800px on longest side for performance)
  const maxDimension = 800;
  if (targetWidth > maxDimension || targetHeight > maxDimension) {
    const scale = maxDimension / Math.max(targetWidth, targetHeight);
    targetWidth = Math.round(targetWidth * scale);
    targetHeight = Math.round(targetHeight * scale);
  }

  // Initialize GIF encoder
  const encoder = new GifEncoder(targetWidth, targetHeight, "neuquant");
  encoder.setQuality(quality);
  encoder.setDelay(frameDuration);
  encoder.setRepeat(0); // 0 = loop forever
  encoder.setTransparent(0x00000000); // Support transparency

  encoder.start();

  // Generate each frame
  for (let i = 0; i < frameCount; i++) {
    const currentTime = i / fps;

    // Generate SVG at this time point
    const svgString = generateSVGFrame(
      state,
      paths,
      viewBox,
      currentTime,
      { idPrefix: `frame${i}-` },
    );

    // Convert SVG directly to raw RGBA buffer for GIF encoder
    const { data } = await sharp(Buffer.from(svgString))
      .resize(targetWidth, targetHeight, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Add frame to encoder
    encoder.addFrame(data);
  }

  encoder.finish();

  // Get the GIF buffer
  const gifBuffer = encoder.out.getData();

  return Buffer.from(gifBuffer);
}
