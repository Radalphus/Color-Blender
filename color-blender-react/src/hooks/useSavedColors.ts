import { useState, useCallback } from 'react';
import { Color } from '../types';
import { compareColors } from '../utils/colorUtils';

/**
 * Custom hook for managing saved/favorite colors
 * User-curated collection with no limit, manual add/remove
 */
export function useSavedColors() {
  const [savedColors, setSavedColors] = useState<Color[]>([]);

  const saveColor = useCallback((color: Color) => {
    setSavedColors(prev => {
      // Check if color already exists in saved colors
      const exists = prev.some(c => compareColors(c, color));

      if (exists) {
        return prev;
      }

      // Add to saved colors (no limit)
      return [...prev, color];
    });
  }, []);

  const removeSavedColor = useCallback((index: number) => {
    setSavedColors(prev => prev.filter((_, i) => i !== index));
  }, []);

  return {
    savedColors,
    saveColor,
    removeSavedColor
  };
}
