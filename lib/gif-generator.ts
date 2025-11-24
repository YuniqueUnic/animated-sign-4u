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

  // Base animation duration for a single forward draw + fill timeline
  const baseDuration = calculateAnimationDuration(paths, state.speed || 1);

  // When eraseOnComplete is enabled, approximate the carousel behavior used for
  // SVG SMIL animations:
  //   draw -> hold (fully drawn) -> erase (reverse) -> blank pause
  // The GIF itself always loops (encoder.setRepeat(0)), so we only need to
  // encode a single logical cycle and let the viewer repeat it.
  const useEraseCycle = !!state.eraseOnComplete;
  const holdDuration = useEraseCycle ? 0.8 : 0; // hold fully drawn frame
  const blankDuration = useEraseCycle ? 0.5 : 0; // blank pause before next loop

  const totalDuration = useEraseCycle
    ? baseDuration + holdDuration + baseDuration + blankDuration
    : baseDuration;

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
    const t = i / fps;

    let sampleTime: number;
    if (!useEraseCycle) {
      // Simple forward timeline: 0 -> baseDuration
      sampleTime = t;
    } else {
      // Erase cycle timeline:
      //   [0, baseDuration]                      -> draw phase
      //   (baseDuration, baseDuration+hold]      -> hold fully drawn
      //   (.., baseDuration+hold+baseDuration]   -> erase (reverse timeline)
      //   (.., totalDuration]                   -> blank (time=0)
      if (t <= baseDuration) {
        // Forward draw
        sampleTime = t;
      } else if (t <= baseDuration + holdDuration) {
        // Hold fully drawn frame
        sampleTime = baseDuration;
      } else if (t <= baseDuration + holdDuration + baseDuration) {
        // Erase: walk the timeline backwards from baseDuration -> 0
        const eraseProgress = t - (baseDuration + holdDuration);
        sampleTime = Math.max(0, baseDuration - eraseProgress);
      } else {
        // Blank pause: show initial state (no strokes drawn, no fill)
        sampleTime = 0;
      }
    }

    // Generate SVG at this mapped time point
    const svgString = generateSVGFrame(
      state,
      paths,
      viewBox,
      sampleTime,
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
