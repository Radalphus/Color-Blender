import { useState, useCallback, useEffect, useRef } from 'react';
import {
  PaletteCell as PaletteCellType,
  Color,
  PaletteType,
  AESTHETIC_CORNERS,
  AESTHETIC_EDGES,
  AESTHETIC_CENTER
} from '../types';
import { PaletteCell } from './PaletteCell';
import { exportPaletteAsImage, savePaletteAsJson } from '../utils/exportUtils';
import { useHistory } from '../hooks/useHistory';

interface PaletteGridProps {
  selectedColor: Color | null;
  paletteType: PaletteType;
}

export function PaletteGrid({ selectedColor, paletteType }: PaletteGridProps) {
  const [cells, setCells] = useState<PaletteCellType[]>(
    Array(9).fill(null).map(() => ({
      color1: null,
      color2: null,
      color3: null,
      color4: null,
      hasAllFourColors: false
    }))
  );
  const [canvasRefs, setCanvasRefs] = useState<(HTMLCanvasElement | null)[]>(Array(9).fill(null));
  const { saveState, undo, redo, canUndo, canRedo, clearHistory } = useHistory();
  const [isInitialized, setIsInitialized] = useState(false);
  const pendingSaveRef = useRef<boolean>(false); // Prevent duplicate saves

  const handleCanvasRef = useCallback((index: number, canvas: HTMLCanvasElement | null) => {
    setCanvasRefs(prev => {
      const newRefs = [...prev];
      newRefs[index] = canvas;
      return newRefs;
    });
  }, []);

  // Undo/Redo handlers
  const handleUndo = useCallback(() => {
    const previousState = undo();
    if (previousState) {
      setCells(previousState.cells);
      // Restore canvas images
      previousState.canvasDataUrls.forEach((dataUrl, index) => {
        const canvas = canvasRefs[index];
        if (canvas && dataUrl) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const img = new Image();
            img.onload = () => {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(img, 0, 0);
            };
            img.src = dataUrl;
          }
        }
      });
    }
  }, [undo, canvasRefs]);

  const handleRedo = useCallback(() => {
    const nextState = redo();
    if (nextState) {
      setCells(nextState.cells);
      // Restore canvas images
      nextState.canvasDataUrls.forEach((dataUrl, index) => {
        const canvas = canvasRefs[index];
        if (canvas && dataUrl) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const img = new Image();
            img.onload = () => {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(img, 0, 0);
            };
            img.src = dataUrl;
          }
        }
      });
    }
  }, [redo, canvasRefs]);

  // Save initial blank state when all canvases are ready
  useEffect(() => {
    if (!isInitialized && canvasRefs.every(ref => ref !== null)) {
      setIsInitialized(true);
      // Save the initial blank state
      setTimeout(() => {
        saveState(cells, canvasRefs);
      }, 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasRefs, isInitialized]); // Only run when canvases are ready, not when cells change

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  const updateAestheticPalette = useCallback((updatedCells: PaletteCellType[], changedCornerIndex?: number, updateCenterOnly: boolean = false) => {
    const newCells = [...updatedCells];

    if (updateCenterOnly) {
      // Only update center cell (used when edges are blended)
      const allEdgesBlended = Object.keys(AESTHETIC_EDGES).every(edgeIndex => {
        const edge = newCells[parseInt(edgeIndex)];
        return edge.color1 && !edge.color2 && !edge.color3 && !edge.color4;
      });

      if (allEdgesBlended) {
        const edgeColors = Object.keys(AESTHETIC_EDGES).map(idx => newCells[parseInt(idx)].color1!);
        newCells[AESTHETIC_CENTER] = {
          color1: { ...edgeColors[0] },
          color2: { ...edgeColors[1] },
          color3: { ...edgeColors[2] },
          color4: { ...edgeColors[3] },
          hasAllFourColors: true
        };
      } else {
        // Clear center if edges aren't ready
        newCells[AESTHETIC_CENTER] = {
          color1: null,
          color2: null,
          color3: null,
          color4: null,
          hasAllFourColors: false
        };
      }
    } else if (changedCornerIndex !== undefined) {
      // Smart reset: only update cells affected by the changed corner
      const affectedEdges: number[] = [];

      // Find which edges are affected by this corner
      Object.entries(AESTHETIC_EDGES).forEach(([edgeIndex, [corner1Index, corner2Index]]) => {
        if (corner1Index === changedCornerIndex || corner2Index === changedCornerIndex) {
          affectedEdges.push(parseInt(edgeIndex));
        }
      });

      // Reset only the affected edge cells
      affectedEdges.forEach(edgeIndex => {
        const [corner1Index, corner2Index] = AESTHETIC_EDGES[edgeIndex as keyof typeof AESTHETIC_EDGES];
        const corner1 = newCells[corner1Index];
        const corner2 = newCells[corner2Index];

        // Edges only fill if BOTH adjacent corners are fully blended (only color1, no other colors)
        const corner1IsBlended = corner1.color1 && !corner1.color2 && !corner1.color3 && !corner1.color4;
        const corner2IsBlended = corner2.color1 && !corner2.color2 && !corner2.color3 && !corner2.color4;

        if (corner1IsBlended && corner2IsBlended) {
          newCells[edgeIndex] = {
            color1: { ...corner1.color1! },
            color2: { ...corner2.color1! },
            color3: null,
            color4: null,
            hasAllFourColors: false
          };
        } else {
          // Clear edge if corners aren't ready
          newCells[edgeIndex] = {
            color1: null,
            color2: null,
            color3: null,
            color4: null,
            hasAllFourColors: false
          };
        }
      });

      // Update center cell - only fill if ALL edges are fully blended (only color1, no other colors)
      const allEdgesBlended = Object.keys(AESTHETIC_EDGES).every(edgeIndex => {
        const edge = newCells[parseInt(edgeIndex)];
        return edge.color1 && !edge.color2 && !edge.color3 && !edge.color4;
      });

      if (allEdgesBlended) {
        const edgeColors = Object.keys(AESTHETIC_EDGES).map(idx => newCells[parseInt(idx)].color1!);
        newCells[AESTHETIC_CENTER] = {
          color1: { ...edgeColors[0] },
          color2: { ...edgeColors[1] },
          color3: { ...edgeColors[2] },
          color4: { ...edgeColors[3] },
          hasAllFourColors: true
        };
      } else {
        // Clear center if edges aren't ready
        newCells[AESTHETIC_CENTER] = {
          color1: null,
          color2: null,
          color3: null,
          color4: null,
          hasAllFourColors: false
        };
      }
    } else {
      // Full update (for initial setup or when no specific corner changed)
      Object.entries(AESTHETIC_EDGES).forEach(([edgeIndex, [corner1Index, corner2Index]]) => {
        const index = parseInt(edgeIndex);
        const corner1 = newCells[corner1Index];
        const corner2 = newCells[corner2Index];

        // Edges only fill if BOTH adjacent corners are fully blended (only color1, no other colors)
        const corner1IsBlended = corner1.color1 && !corner1.color2 && !corner1.color3 && !corner1.color4;
        const corner2IsBlended = corner2.color1 && !corner2.color2 && !corner2.color3 && !corner2.color4;

        if (corner1IsBlended && corner2IsBlended) {
          newCells[index] = {
            color1: { ...corner1.color1! },
            color2: { ...corner2.color1! },
            color3: null,
            color4: null,
            hasAllFourColors: false
          };
        } else {
          // Clear edge if corners aren't ready
          newCells[index] = {
            color1: null,
            color2: null,
            color3: null,
            color4: null,
            hasAllFourColors: false
          };
        }
      });

      // Update center cell - only fill if ALL edges are fully blended (only color1, no other colors)
      const allEdgesBlended = Object.keys(AESTHETIC_EDGES).every(edgeIndex => {
        const edge = newCells[parseInt(edgeIndex)];
        return edge.color1 && !edge.color2 && !edge.color3 && !edge.color4;
      });

      if (allEdgesBlended) {
        const edgeColors = Object.keys(AESTHETIC_EDGES).map(idx => newCells[parseInt(idx)].color1!);
        newCells[AESTHETIC_CENTER] = {
          color1: { ...edgeColors[0] },
          color2: { ...edgeColors[1] },
          color3: { ...edgeColors[2] },
          color4: { ...edgeColors[3] },
          hasAllFourColors: true
        };
      } else {
        // Clear center if edges aren't ready
        newCells[AESTHETIC_CENTER] = {
          color1: null,
          color2: null,
          color3: null,
          color4: null,
          hasAllFourColors: false
        };
      }
    }

    return newCells;
  }, []);


  const handleCellUpdate = useCallback((index: number, cell: PaletteCellType, shouldSaveHistory: boolean = true, skipAestheticUpdate: boolean = false) => {
    setCells(prevCells => {
      const newCells = [...prevCells];
      newCells[index] = cell;

      let finalCells = newCells;

      if (paletteType === 'aesthetic' && !skipAestheticUpdate) {
        // Check if the updated cell is a corner
        const isCorner = AESTHETIC_CORNERS.includes(index as 0 | 2 | 6 | 8);
        const isEdge = [1, 3, 5, 7].includes(index);

        if (isCorner) {
          // Smart reset: only update affected edges and center
          finalCells = updateAestheticPalette(newCells, index);
        } else if (isEdge) {
          // Edge cell updated - only update center
          finalCells = updateAestheticPalette(newCells, undefined, true);
        } else {
          // Center or other cell - full update
          finalCells = updateAestheticPalette(newCells);
        }
      }

      // Save state after update (for color additions)
      if (shouldSaveHistory && !pendingSaveRef.current) {
        pendingSaveRef.current = true;
        // Use setTimeout to ensure canvas has been drawn
        setTimeout(() => {
          saveState(finalCells, canvasRefs);
          pendingSaveRef.current = false;
        }, 50);
      }

      return finalCells;
    });
  }, [paletteType, updateAestheticPalette, saveState, canvasRefs]);

  const handleClearGrid = () => {
    if (confirm('Are you sure you want to clear all palette cells?')) {
      const clearedCells = Array(9).fill(null).map(() => ({
        color1: null,
        color2: null,
        color3: null,
        color4: null,
        hasAllFourColors: false
      }));
      setCells(clearedCells);
      clearHistory();
      // Save the cleared state as first history entry
      setTimeout(() => {
        saveState(clearedCells, canvasRefs);
      }, 0);
    }
  };

  const handleSavePalette = () => {
    savePaletteAsJson(cells, canvasRefs);
  };

  const handleExportPalette = () => {
    exportPaletteAsImage(canvasRefs);
  };

  return (
    <div className="grid-section">
      <h2>Color Palette</h2>
      <div className="palette-grid">
        {cells.map((cell, index) => (
          <PaletteCell
            key={index}
            cell={cell}
            index={index}
            paletteType={paletteType}
            selectedColor={selectedColor}
            isCornerCell={AESTHETIC_CORNERS.includes(index as 0 | 2 | 6 | 8)}
            onCellUpdate={handleCellUpdate}
            onCanvasRef={handleCanvasRef}
          />
        ))}
      </div>
      <div className="controls">
        <div className="control-group">
          <button onClick={handleUndo} disabled={!canUndo} className="btn" title="Undo (Ctrl+Z)">
            ↶ Undo
          </button>
          <button onClick={handleRedo} disabled={!canRedo} className="btn" title="Redo (Ctrl+Y)">
            ↷ Redo
          </button>
        </div>
        <div className="control-group">
          <button onClick={handleClearGrid} className="btn">
            Clear Palette
          </button>
          <button onClick={handleSavePalette} className="btn btn-primary">
            Save Palette
          </button>
          <button onClick={handleExportPalette} className="btn btn-primary">
            Export as Image
          </button>
        </div>
      </div>
    </div>
  );
}
