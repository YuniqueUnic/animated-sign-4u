/**
 * Hanzi Writer Data utilities for fetching Chinese character stroke data
 * Data source: https://github.com/chanind/hanzi-writer-data
 */

export interface HanziStrokeData {
  character: string;
  strokes: string[];
  medians: number[][][];
}

const hanziCache: Record<string, HanziStrokeData | null> = {};

/**
 * Check if a character is a Chinese character
 */
export function isChinese(char: string): boolean {
  return /[\u4e00-\u9fa5]/.test(char);
}

/**
 * Fetch stroke data for a Chinese character from hanzi-writer-data CDN
 */
export async function fetchHanziData(char: string): Promise<HanziStrokeData | null> {
  if (!isChinese(char)) {
    return null;
  }

  if (hanziCache[char] !== undefined) {
    return hanziCache[char];
  }

  try {
    const res = await fetch(
      `https://cdn.jsdelivr.net/npm/hanzi-writer-data@latest/${char}.json`,
    );

    if (!res.ok) {
      hanziCache[char] = null;
      return null;
    }

    const data: HanziStrokeData = await res.json();
    hanziCache[char] = data;
    return data;
  } catch (error) {
    console.error(`Failed to fetch hanzi data for ${char}:`, error);
    hanziCache[char] = null;
    return null;
  }
}

/**
 * Batch fetch hanzi data for multiple characters
 */
export async function fetchHanziDataBatch(
  text: string,
): Promise<Map<string, HanziStrokeData | null>> {
  const chars = Array.from(text).filter(isChinese);
  const uniqueChars = [...new Set(chars)];

  const results = await Promise.all(
    uniqueChars.map(async (char) => {
      const data = await fetchHanziData(char);
      return [char, data] as [string, HanziStrokeData | null];
    }),
  );

  return new Map(results);
}

/**
 * Merge all strokes from hanzi data into a single SVG path
 */
export function mergeHanziStrokes(data: HanziStrokeData): string {
  return data.strokes.join(" ");
}
