import { useState, useEffect, useCallback, useRef } from 'react';
import { Progress, RoundInput, RoundResult } from '../game/types';
import { scoreRound } from '../game/scoring';

// v2: levels were redesigned, so earlier test saves don't carry over
const STORAGE_KEY = 'colorBlenderProgress.v3';
const EMPTY_PROGRESS: Progress = { xp: 0, combo: 0, levels: {} };

function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_PROGRESS;
    const saved = JSON.parse(raw);
    return {
      xp: Number(saved.xp) || 0,
      combo: Number(saved.combo) || 0,
      levels: saved.levels && typeof saved.levels === 'object' ? saved.levels : {}
    };
  } catch {
    return EMPTY_PROGRESS;
  }
}

/**
 * Player XP, combo and per-level bests, kept in localStorage
 */
export function useProgress() {
  const [progress, setProgress] = useState<Progress>(loadProgress);
  const progressRef = useRef(progress);
  progressRef.current = progress;

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      // Storage can be unavailable (private mode); progress just won't persist
    }
  }, [progress]);

  const commitRound = useCallback((input: RoundInput): RoundResult => {
    const { result, next } = scoreRound(progressRef.current, input);
    progressRef.current = next;
    setProgress(next);
    return result;
  }, []);

  return { progress, commitRound };
}
