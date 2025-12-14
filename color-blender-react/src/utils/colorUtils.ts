import { Color } from '../types';
import { COLOR_TOLERANCE } from '../constants';
import { colornames } from 'color-name-list';

// Type definition for color name entries
interface ColorNameEntry {
  name: string;
  hex: string;
}

export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

/**
 * Compare two colors to see if they are similar within a tolerance
 * @param c1 First color
 * @param c2 Second color
 * @param tolerance RGB unit tolerance (default: COLOR_TOLERANCE constant)
 * @returns true if colors are within tolerance
 */
export function compareColors(c1: Color, c2: Color, tolerance: number = COLOR_TOLERANCE): boolean {
  const diffR = Math.abs(c1.r - c2.r);
  const diffG = Math.abs(c1.g - c2.g);
  const diffB = Math.abs(c1.b - c2.b);
  return diffR <= tolerance && diffG <= tolerance && diffB <= tolerance;
}

export function colorDistance(c1: Color, c2: Color): number {
  const dr = c1.r - c2.r;
  const dg = c1.g - c2.g;
  const db = c1.b - c2.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

export function mixColors(c1: Color, c2: Color, ratio: number): Color {
  return {
    r: Math.round(c1.r * (1 - ratio) + c2.r * ratio),
    g: Math.round(c1.g * (1 - ratio) + c2.g * ratio),
    b: Math.round(c1.b * (1 - ratio) + c2.b * ratio)
  };
}

export function colorToRgbString(color: Color): string {
  return `rgb(${color.r}, ${color.g}, ${color.b})`;
}

export function getColorFromImageData(
  imageData: ImageData
): Color {
  const pixel = imageData.data;
  return {
    r: pixel[0],
    g: pixel[1],
    b: pixel[2]
  };
}

// Cache for color names to avoid recalculating
const colorNameCache = new Map<string, string>();

/**
 * Get the closest color name for a given RGB color
 * Uses the color-name-list library with 30,000+ color names
 * Optimized with caching and early exit for exact matches
 * @param color The color to find a name for
 * @param compact If true, returns compact format for small spaces (e.g., "Red ~5")
 * @returns The closest matching color name with match quality indicator
 */
export function getColorName(color: Color, compact: boolean = false): string {
  // Create cache key from RGB values
  const cacheKey = `${color.r},${color.g},${color.b}-${compact}`;

  // Check cache first
  if (colorNameCache.has(cacheKey)) {
    return colorNameCache.get(cacheKey)!;
  }

  // Find the closest color by calculating distance
  let closestColor: ColorNameEntry | null = null;
  let minDistance = Infinity;

  for (const entry of colornames) {
    // Convert hex to RGB for distance calculation
    const hexColor = entry.hex;
    if (!hexColor || hexColor.length < 7) continue;

    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);

    const distance = colorDistance(color, { r, g, b });

    // Early exit if we found an exact match (distance = 0)
    if (distance === 0) {
      closestColor = entry;
      minDistance = 0;
      break;
    }

    if (distance < minDistance) {
      minDistance = distance;
      closestColor = entry;
    }
  }

  const baseName = closestColor?.name || 'Unknown Color';
  let colorName = baseName;

  // Add match quality indicator if not exact match
  if (minDistance > 0) {
    if (compact) {
      // Compact format for color history boxes - show percentage on new line
      const similarity = Math.max(0, 100 - (minDistance / 4.41)); // Max distance ~441
      colorName = `${baseName}\n~${Math.floor(similarity)}%`;
    } else {
      // Full format for preview/selected boxes - always round down so only 100% is exact
      const similarity = Math.max(0, 100 - (minDistance / 4.41)); // Max distance ~441
      colorName = `${baseName} (${Math.floor(similarity)}% match)`;
    }
  }

  // Cache the result
  colorNameCache.set(cacheKey, colorName);

  return colorName;
}
