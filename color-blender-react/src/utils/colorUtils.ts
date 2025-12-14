import { Color } from '../types';
import { COLOR_TOLERANCE } from '../constants';

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
