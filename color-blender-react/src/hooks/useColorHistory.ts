import { useState, useCallback } from 'react';
import { Color } from '../types';
import { compareColors } from '../utils/colorUtils';
import { RECENT_COLORS_LIMIT } from '../constants';

/**
 * Custom hook for managing recent color history
 * Tracks last N colors (picked or blended) with automatic deduplication
 */
export function useColorHistory() {
  const [colorHistory, setColorHistory] = useState<Color[]>([]);

  const addToHistory = useCallback((color: Color) => {
    setColorHistory(prev => {
      // Check if a similar color already exists anywhere in history
      const exists = prev.some(c => compareColors(c, color));

      if (exists) {
        // Color already exists (or is very similar), don't add it again
        return prev;
      }

      // Add to beginning and keep only last N colors
      const newHistory = [color, ...prev];
      return newHistory.slice(0, RECENT_COLORS_LIMIT);
    });
  }, []);

  return {
    colorHistory,
    addToHistory
  };
}
