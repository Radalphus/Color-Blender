export interface Color {
  r: number;
  g: number;
  b: number;
}

export interface PaletteCell {
  color1: Color | null;
  color2: Color | null;
  color3?: Color | null;
  color4?: Color | null;
  hasAllFourColors?: boolean;
}

export type PaletteType = 'manual' | 'aesthetic';
export type Mode = 'picking' | 'blending';

export const AESTHETIC_CORNERS = [0, 2, 6, 8] as const;
export const AESTHETIC_EDGES = {
  1: [0, 2],
  3: [0, 6],
  5: [2, 8],
  7: [6, 8]
} as const;
export const AESTHETIC_CENTER = 4;
