import { useState, useCallback } from 'react';
import { PaletteCell } from '../types';

interface HistoryState {
  cells: PaletteCell[];
  canvasDataUrls: string[];
}

const MAX_HISTORY = 20;

export function useHistory() {
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  const saveState = useCallback((cells: PaletteCell[], canvasRefs: (HTMLCanvasElement | null)[]) => {
    // Capture current canvas images as data URLs
    const canvasDataUrls = canvasRefs.map(canvas => {
      if (canvas) {
        return canvas.toDataURL();
      }
      return '';
    });

    const newState: HistoryState = {
      cells: JSON.parse(JSON.stringify(cells)), // Deep clone
      canvasDataUrls
    };

    setCurrentIndex(curr => {
      setHistory(prev => {
        // Remove any states after current index (for when user undoes then makes new change)
        const trimmedHistory = prev.slice(0, curr + 1);

        // Add new state
        const newHistory = [...trimmedHistory, newState];

        // Limit history to MAX_HISTORY states
        if (newHistory.length > MAX_HISTORY) {
          return newHistory.slice(newHistory.length - MAX_HISTORY);
        }

        return newHistory;
      });

      // If we've exceeded MAX_HISTORY, the new index should be MAX_HISTORY - 1
      // Otherwise, it's just curr + 1
      const newHistoryLength = Math.min(curr + 2, MAX_HISTORY);
      return newHistoryLength - 1;
    });
  }, []);

  const undo = useCallback((): HistoryState | null => {
    if (currentIndex <= 0) return null;

    const newIndex = currentIndex - 1;
    setCurrentIndex(newIndex);
    return history[newIndex];
  }, [currentIndex, history]);

  const redo = useCallback((): HistoryState | null => {
    if (currentIndex >= history.length - 1) return null;

    const newIndex = currentIndex + 1;
    setCurrentIndex(newIndex);
    return history[newIndex];
  }, [currentIndex, history]);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  const clearHistory = useCallback(() => {
    setHistory([]);
    setCurrentIndex(-1);
  }, []);

  return {
    saveState,
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory
  };
}
