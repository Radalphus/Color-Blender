import { colorMatchPercent } from '../utils/colorUtils';
import { Level, Progress, RoundInput, RoundResult } from './types';

/** Match % needed for 1, 2 and 3 stars. Below the first, the level isn't cleared. */
export const STAR_THRESHOLDS = [90, 95, 98] as const;

const TIME_BONUS_PER_SECOND = 10;
const MAX_MULTIPLIER = 3;

const CLEAR_XP = 25;
const XP_PER_NEW_STAR = 50;

export function starsFor(accuracy: number): number {
  return STAR_THRESHOLDS.filter((threshold) => accuracy >= threshold).length;
}

/** Score multiplier for the next round: x1, then x2 and x3 for each consecutive 3-star clear */
export function comboMultiplier(combo: number): number {
  return Math.min(MAX_MULTIPLIER, 1 + combo);
}

/**
 * Seconds under par earn a time bonus. Bigger recipes get more time:
 * 15s per color and per extra mixing step, on top of a 30s base.
 */
export function parSeconds(level: Level): number {
  const colors = level.recipe.reduce((sum, stage) => sum + stage.length, 0);
  return 30 + 15 * colors + 15 * (level.recipe.length - 1);
}

/**
 * Score a finished round against the player's current progress.
 * Pure: returns the result to show and the progress to save.
 */
export function scoreRound(progress: Progress, input: RoundInput): { result: RoundResult; next: Progress } {
  const { level, target, blend, seconds } = input;
  const accuracy = colorMatchPercent(target, blend);
  const stars = starsFor(accuracy);
  const cleared = stars > 0;

  const baseScore = Math.round(accuracy * 10);
  const par = parSeconds(level);
  const timeBonus = cleared ? Math.max(0, par - Math.floor(seconds)) * TIME_BONUS_PER_SECOND : 0;
  const multiplier = cleared ? comboMultiplier(progress.combo) : 1;
  const score = cleared ? (baseScore + timeBonus) * multiplier : 0;

  const previous = progress.levels[level.id];
  const previousBestStars = previous?.stars ?? 0;
  const xpGained = cleared ? CLEAR_XP + XP_PER_NEW_STAR * Math.max(0, stars - previousBestStars) : 0;
  const isNewBest = cleared && (!previous || score > previous.bestScore);

  const next: Progress = {
    xp: progress.xp + xpGained,
    combo: stars === 3 ? progress.combo + 1 : 0,
    levels: cleared
      ? {
          ...progress.levels,
          [level.id]: {
            stars: Math.max(previousBestStars, stars),
            bestAccuracy: Math.max(previous?.bestAccuracy ?? 0, accuracy),
            bestScore: Math.max(previous?.bestScore ?? 0, score)
          }
        }
      : progress.levels
  };

  return {
    next,
    result: {
      levelId: level.id,
      target,
      blend,
      accuracy,
      stars,
      cleared,
      seconds,
      parSeconds: par,
      baseScore,
      timeBonus,
      multiplier,
      score,
      previousBestStars,
      xpGained,
      xpBefore: progress.xp,
      xpAfter: next.xp,
      isNewBest
    }
  };
}

/* ---------------------------------------------------------------------------
   Player level and rank
   ------------------------------------------------------------------------ */

/** Total XP needed to reach a player level (level 2 costs 100, each level after costs 50 more) */
export function xpToReach(level: number): number {
  let total = 0;
  for (let l = 2; l <= level; l++) {
    total += 100 + 50 * (l - 2);
  }
  return total;
}

export function levelForXp(xp: number): number {
  let level = 1;
  while (xp >= xpToReach(level + 1)) level++;
  return level;
}

export function levelProgress(xp: number) {
  const level = levelForXp(xp);
  const start = xpToReach(level);
  const end = xpToReach(level + 1);
  return { level, into: xp - start, span: end - start, fraction: (xp - start) / (end - start) };
}

const RANKS: Array<[number, string]> = [
  [1, 'Pixel Rookie'],
  [3, 'Hue Hunter'],
  [6, 'Tint Tactician'],
  [10, 'Shade Sorcerer'],
  [15, 'Chroma Master']
];

export function rankFor(level: number): string {
  return RANKS.filter(([min]) => level >= min).pop()![1];
}

export function nextRank(level: number): { level: number; title: string } | null {
  const upcoming = RANKS.find(([min]) => min > level);
  return upcoming ? { level: upcoming[0], title: upcoming[1] } : null;
}

/* ---------------------------------------------------------------------------
   Level progress helpers
   ------------------------------------------------------------------------ */

export function isLevelUnlocked(levels: Level[], index: number, progress: Progress): boolean {
  if (index === 0) return true;
  return (progress.levels[levels[index - 1].id]?.stars ?? 0) > 0;
}

export function totalStars(progress: Progress): number {
  return Object.values(progress.levels).reduce((sum, record) => sum + record.stars, 0);
}
