import { Color } from '../types';

/**
 * One element of a level's picture, drawn back to front on a 30x20 grid.
 * Rows count down from 0 at the top; `base` is the row an object stands on.
 */
export type SceneLayer =
  | { kind: 'sun'; color: string; x: number; y: number; r: number }
  | { kind: 'band'; colors: string[]; from: number; to: number }
  | { kind: 'stars'; color: string; count: number; maxRow: number }
  | { kind: 'rain'; color: string; count: number; maxRow: number }
  | { kind: 'rainbow'; colors: string[]; cx: number; cy: number; r: number }
  | { kind: 'ridge'; color: string; min: number; max: number; rough?: number; cap?: string }
  | { kind: 'ripples'; color: string; from: number; to: number; count: number }
  | { kind: 'trees'; trunk: string; leaves: string; fruit?: string[]; xs: number[]; base: number; size?: number }
  | { kind: 'palm'; trunk: string; leaves: string; x: number; base: number }
  | { kind: 'flowers'; stem: string; colors: string[]; from: number; to: number; count: number }
  | { kind: 'buildings'; colors: string[]; windows: string[]; base: number; minH: number; maxH: number }
  | { kind: 'rect'; color: string; x: number; y: number; w: number; h: number }
  | { kind: 'temple'; stone: string; moss: string; door: string; flame: string; x: number; base: number }
  | { kind: 'windmill'; body: string; roof: string; blades: string; door: string; x: number; base: number }
  | { kind: 'boat'; hull: string; sail: string; x: number; y: number }
  | { kind: 'lanterns'; line: string; colors: string[]; y: number }
  | { kind: 'coral'; colors: string[]; base: number; count: number }
  | { kind: 'fish'; colors: string[]; from: number; to: number; count: number }
  | { kind: 'cactus'; color: string; flower?: string; xs: number[]; base: number }
  | { kind: 'icebergs'; color: string; shade: string; row: number; xs: number[] }
  | { kind: 'tent'; color: string; door: string; x: number; base: number };

export interface Scene {
  /** Sky bands, top to bottom, filling rows 0 to `horizon` */
  sky: string[];
  horizon: number;
  layers: SceneLayer[];
}

export interface Level {
  id: string;           // "1-4"
  world: number;
  number: number;
  name: string;
  scene: Scene;
  /**
   * Stages of image colors. Blend the first stage, then add the next stage's
   * colors to the result and blend again. A perfect match is always possible.
   */
  recipe: string[][];
  seed: number;
}

export interface LevelRecord {
  stars: number;
  bestAccuracy: number;
  bestScore: number;
}

export interface Progress {
  xp: number;
  /** Consecutive 3-star clears; drives the score multiplier */
  combo: number;
  levels: Record<string, LevelRecord>;
}

export interface RoundInput {
  level: Level;
  target: Color;
  blend: Color;
  seconds: number;
}

export interface RoundResult {
  levelId: string;
  target: Color;
  blend: Color;
  accuracy: number;
  stars: number;          // 0 = not cleared
  cleared: boolean;
  seconds: number;
  parSeconds: number;
  baseScore: number;
  timeBonus: number;
  multiplier: number;
  score: number;
  previousBestStars: number;
  xpGained: number;
  xpBefore: number;
  xpAfter: number;
  isNewBest: boolean;
}
