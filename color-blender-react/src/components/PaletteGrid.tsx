import { useState, useCallback, useEffect, useRef } from 'react';
import {
  PaletteCell as PaletteCellType,
  Color,
  PaletteType,
  GridSize,
  getGridConfig,
  getEdgeOrientation
} from '../types';
import { PaletteCell } from './PaletteCell';
import { exportPaletteAsImage, savePaletteAsJson } from '../utils/exportUtils';
import { useHistory } from '../hooks/useHistory';
import { getCellBlendColor } from '../utils/colorUtils';

const emptyCell = (): PaletteCellType => ({
  color1: null,
  color2: null,
  color3: null,
  color4: null,
  hasAllFourColors: false
});

interface PaletteGridProps {
  gridSize: GridSize;
  selectedColor: Color | null;
  paletteType: PaletteType;
  onBlendedColorCreated?: (color: Color) => void;
  onAutoBlendCompleted?: (colors: Color[]) => void;
}

export function PaletteGrid({ gridSize, selectedColor, paletteType, onBlendedColorCreated, onAutoBlendCompleted }: PaletteGridProps) {
  // Get grid configuration based on gridSize
  const { totalCells, corners, edges, inner, canvasSize } = getGridConfig(gridSize);

  // Helper function to create empty cell array
  const createEmptyCells = (count: number): PaletteCellType[] =>
    Array(count).fill(null).map(emptyCell);

  // Separate state for each palette type
  const [manualCells, setManualCells] = useState<PaletteCellType[]>(createEmptyCells(totalCells));
  const [aestheticCells, setAestheticCells] = useState<PaletteCellType[]>(createEmptyCells(totalCells));

  // Separate canvas refs for each palette type
  const [manualCanvasRefs, setManualCanvasRefs] = useState<(HTMLCanvasElement | null)[]>(Array(totalCells).fill(null));
  const [aestheticCanvasRefs, setAestheticCanvasRefs] = useState<(HTMLCanvasElement | null)[]>(Array(totalCells).fill(null));

  // Separate history for each palette type
  const manualHistory = useHistory();
  const aestheticHistory = useHistory();

  // Track initialization state for each palette type
  const [manualIsInitialized, setManualIsInitialized] = useState(false);
  const [aestheticIsInitialized, setAestheticIsInitialized] = useState(false);

  // Counter to force remounting when grid size changes
  const [gridKey, setGridKey] = useState(0);

  // Reset cells and canvas refs when gridSize changes
  useEffect(() => {
    setManualCells(createEmptyCells(totalCells));
    setAestheticCells(createEmptyCells(totalCells));
    setManualCanvasRefs(Array(totalCells).fill(null));
    setAestheticCanvasRefs(Array(totalCells).fill(null));
    // Reset histories
    manualHistory.clearHistory();
    aestheticHistory.clearHistory();
    setManualIsInitialized(false);
    setAestheticIsInitialized(false);
    // Increment key to force remounting of all cells
    setGridKey(prev => prev + 1);
  }, [gridSize, totalCells]);

  // Switch between manual and aesthetic based on current palette type
  const cells = paletteType === 'manual' ? manualCells : aestheticCells;
  const setCells = paletteType === 'manual' ? setManualCells : setAestheticCells;
  const canvasRefs = paletteType === 'manual' ? manualCanvasRefs : aestheticCanvasRefs;
  const setCanvasRefs = paletteType === 'manual' ? setManualCanvasRefs : setAestheticCanvasRefs;
  const { saveState, undo, redo, canUndo, canRedo, clearHistory } = paletteType === 'manual' ? manualHistory : aestheticHistory;

  const isInitialized = paletteType === 'manual' ? manualIsInitialized : aestheticIsInitialized;
  const setIsInitialized = paletteType === 'manual' ? setManualIsInitialized : setAestheticIsInitialized;

  const pendingSaveRef = useRef<boolean>(false); // Prevent duplicate saves

  const handleCanvasRef = useCallback((index: number, canvas: HTMLCanvasElement | null) => {
    setCanvasRefs(prev => {
      const newRefs = [...prev];
      newRefs[index] = canvas;
      return newRefs;
    });
  }, [setCanvasRefs]);

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

  // Save initial blank state when all canvases are ready for each palette type
  useEffect(() => {
    if (!isInitialized && canvasRefs.every(ref => ref !== null)) {
      setIsInitialized(true);
      // Save the initial blank state for this palette type
      setTimeout(() => {
        saveState(cells, canvasRefs);
      }, 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasRefs, isInitialized, paletteType]); // Run when canvases are ready for each palette type

  // When switching palette types, check if we need to initialize
  useEffect(() => {
    // If switching to a palette that hasn't been initialized yet, and canvases exist, initialize it
    if (!isInitialized && canvasRefs.every(ref => ref !== null)) {
      setIsInitialized(true);
      setTimeout(() => {
        saveState(cells, canvasRefs);
      }, 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paletteType]); // Run when palette type changes

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

  // For 4x4/5x5 edges: is this edge cell closer to corner1, corner2, or equidistant (5x5 middle edges)?
  const getEdgeProximity = useCallback((edgeIndex: number, corner1Index: number, corner2Index: number): 'corner1' | 'corner2' | 'equal' => {
    // Horizontal edges (top/bottom rows) measure by column, vertical edges by row
    const isHorizontalEdge = Math.abs(corner1Index - corner2Index) < gridSize;
    const distanceFromCorner1 = isHorizontalEdge
      ? Math.abs((edgeIndex % gridSize) - (corner1Index % gridSize))
      : Math.abs(Math.floor(edgeIndex / gridSize) - Math.floor(corner1Index / gridSize));
    const distanceFromCorner2 = (gridSize - 1) - distanceFromCorner1;

    if (distanceFromCorner1 < distanceFromCorner2) return 'corner1';
    if (distanceFromCorner2 < distanceFromCorner1) return 'corner2';
    return 'equal';
  }, [gridSize]);

  // Work out what an edge cell should contain based on its two adjacent corners.
  // Returns an empty cell if either corner hasn't been blended down to a single color yet.
  const computeEdgeCell = useCallback((edgeIndex: number, cellsToRead: PaletteCellType[]): PaletteCellType => {
    const [corner1Index, corner2Index] = edges[edgeIndex];
    const corner1 = cellsToRead[corner1Index];
    const corner2 = cellsToRead[corner2Index];

    // Edges only fill if BOTH adjacent corners are fully blended (only color1, no other colors)
    const isBlended = (c: PaletteCellType) => !!c.color1 && !c.color2 && !c.color3 && !c.color4;
    if (!isBlended(corner1) || !isBlended(corner2)) return emptyCell();

    const c1 = corner1.color1!;
    const c2 = corner2.color1!;

    // Same color on both corners - edge only needs one copy
    if (c1.r === c2.r && c1.g === c2.g && c1.b === c2.b) {
      return { ...emptyCell(), color1: { ...c1 } };
    }

    // 3x3: edge cell contains both colors (50/50)
    if (gridSize === 3) {
      return { ...emptyCell(), color1: { ...c1 }, color2: { ...c2 } };
    }

    // 4x4/5x5: 2 parts from the closer corner, 1 part from the farther (or 50/50 when equidistant)
    const proximity = getEdgeProximity(edgeIndex, corner1Index, corner2Index);
    if (proximity === 'equal') {
      return { ...emptyCell(), color1: { ...c1 }, color2: { ...c2 } };
    }

    const edgeOrientation = getEdgeOrientation(edgeIndex, gridSize);
    const isVerticalEdge = edgeOrientation === 'left' || edgeOrientation === 'right';

    let stripes: [Color, Color, Color];
    if (isVerticalEdge) {
      // Left/right edges are stored top-to-bottom (corner1 is always the top corner)
      stripes = proximity === 'corner1' ? [c1, c1, c2] : [c1, c2, c2];
    } else {
      // Top/bottom edges are stored closer-corner first; PaletteCell flips the last cell in the row visually
      const [closer, farther] = proximity === 'corner1' ? [c1, c2] : [c2, c1];
      stripes = [closer, closer, farther];
    }

    return {
      color1: { ...stripes[0] },
      color2: { ...stripes[1] },
      color3: { ...stripes[2] },
      color4: null,
      hasAllFourColors: false
    };
  }, [gridSize, edges, getEdgeProximity]);

  // Fill (or clear) the inner cells in place. An inner cell only fills once the four edge
  // cells in its row and column have each been blended down to a single color - until then
  // it stays empty so it doesn't give away what the edges will blend to.
  const fillInnerCells = useCallback((newCells: PaletteCellType[]): void => {
    const blendedColor = (cell: PaletteCellType): Color | null =>
      cell.color1 && !cell.color2 ? cell.color1 : null;

    inner.forEach(innerIndex => {
      const row = Math.floor(innerIndex / gridSize);
      const col = innerIndex % gridSize;

      const top = blendedColor(newCells[col]);                                 // Same column, top row
      const bottom = blendedColor(newCells[(gridSize - 1) * gridSize + col]);  // Same column, bottom row
      const left = blendedColor(newCells[row * gridSize]);                     // Same row, left column
      const right = blendedColor(newCells[row * gridSize + (gridSize - 1)]);   // Same row, right column

      if (!top || !bottom || !left || !right) {
        newCells[innerIndex] = emptyCell();
        return;
      }

      // Colors are stored [top, bottom, left, right], weighted 2:1 toward the edges the cell
      // sits directly beside (in 3x3 every edge is adjacent, so the center blends equally)
      const weightFor = (distance: number) => distance === 1 ? 2 : 1;
      newCells[innerIndex] = {
        color1: { ...top },
        color2: { ...bottom },
        color3: { ...left },
        color4: { ...right },
        hasAllFourColors: true,
        weights: [
          weightFor(row),                    // top
          weightFor((gridSize - 1) - row),   // bottom
          weightFor(col),                    // left
          weightFor((gridSize - 1) - col)    // right
        ]
      };
    });
  }, [gridSize, inner]);

  // Recompute the auto-filled cells (edges + inner) from the corners.
  //  - changedCornerIndex: smart reset, only edges touching that corner are recomputed
  //  - updateCenterOnly: leave edges alone (used after an edge is blended by hand)
  const updateAestheticPalette = useCallback((updatedCells: PaletteCellType[], changedCornerIndex?: number, updateCenterOnly: boolean = false) => {
    const newCells = [...updatedCells];

    if (!updateCenterOnly) {
      Object.entries(edges).forEach(([edgeIndexStr, [corner1Index, corner2Index]]) => {
        const edgeIndex = parseInt(edgeIndexStr);
        const isAffected = changedCornerIndex === undefined ||
          corner1Index === changedCornerIndex ||
          corner2Index === changedCornerIndex;
        if (isAffected) {
          newCells[edgeIndex] = computeEdgeCell(edgeIndex, newCells);
        }
      });
    }

    fillInnerCells(newCells);
    return newCells;
  }, [edges, computeEdgeCell, fillInnerCells]);


  const handleCellUpdate = useCallback((index: number, cell: PaletteCellType, shouldSaveHistory: boolean = true, skipAestheticUpdate: boolean = false) => {
    setCells(prevCells => {
      const newCells = [...prevCells];
      newCells[index] = cell;

      let finalCells = newCells;

      if (paletteType === 'aesthetic' && !skipAestheticUpdate) {
        // Check if the updated cell is a corner
        const isCorner = corners.includes(index);
        const isEdge = edges.hasOwnProperty(index);

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
      const clearedCells = createEmptyCells(totalCells);
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

  // Paint a cell's canvas solid and return the collapsed (single-color) cell data
  const blendCellToSolid = (index: number, cell: PaletteCellType): PaletteCellType | null => {
    const blendedColor = getCellBlendColor(cell);
    if (!blendedColor) return null;

    const canvas = canvasRefs[index];
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.fillStyle = `rgb(${blendedColor.r}, ${blendedColor.g}, ${blendedColor.b})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    return { ...emptyCell(), color1: blendedColor };
  };

  const handleAutoBlend = () => {
    // Array to collect all blended colors
    const blendedColors: Color[] = [];

    // Track if any changes were made
    let hasChanges = false;

    if (paletteType === 'aesthetic') {
      // For aesthetic mode: blend corners first, then update edges and inner cells using auto-fill logic
      const newCells = [...cells];

      // Any cell still holding more than one color means blending will change something
      hasChanges = cells.some(cell => !!cell.color1 && !!cell.color2);

      // Step 1: Blend all corner cells
      corners.forEach(cornerIndex => {
        if (!canvasRefs[cornerIndex]) return;
        const blended = blendCellToSolid(cornerIndex, newCells[cornerIndex]);
        if (!blended) return;
        blendedColors.push(blended.color1!);
        newCells[cornerIndex] = blended;
      });

      // Step 2: Update aesthetic palette (fills edges and inner cells)
      const updatedCells = updateAestheticPalette(newCells);
      // Don't set cells here - we'll do it after blending is complete to avoid multiple state updates

      // Step 3: Blend the edge cells visually and update their cell data
      setTimeout(() => {
        const finalCells = [...updatedCells];

        Object.keys(edges).forEach(edgeIndexStr => {
          const index = parseInt(edgeIndexStr);
          if (!canvasRefs[index]) return;
          const blended = blendCellToSolid(index, finalCells[index]);
          if (!blended) return;
          blendedColors.push(blended.color1!);
          finalCells[index] = blended;
        });

        // Step 3.5: Recompute inner cells from the now-blended edges
        fillInnerCells(finalCells);

        // Step 4: Blend all inner cells (center for 3x3, or multiple inner cells for 4x4/5x5)
        inner.forEach(innerIndex => {
          const innerCell = finalCells[innerIndex];
          if (!innerCell.hasAllFourColors) return;
          const blended = blendCellToSolid(innerIndex, innerCell);
          if (!blended) return;
          blendedColors.push(blended.color1!);
          finalCells[innerIndex] = blended;
        });

        // Update state with final blended cells
        setCells(finalCells);

        // Save state after everything is done (only if changes were made)
        setTimeout(() => {
          if (hasChanges && !pendingSaveRef.current) {
            pendingSaveRef.current = true;
            saveState(finalCells, canvasRefs);
            pendingSaveRef.current = false;
          }

          // Call callback with all blended colors
          if (onAutoBlendCompleted && blendedColors.length > 0) {
            onAutoBlendCompleted(blendedColors);
          }
        }, 10);
      }, 50);
    } else {
      // Manual mode: blend all cells that have colors
      const newCells = [...cells];

      canvasRefs.forEach((canvas, index) => {
        const cell = newCells[index];
        if (!canvas || !cell || !cell.color1) return;

        // Check if this cell has multiple colors (needs blending)
        if (cell.color2 || cell.color3 || cell.color4) {
          hasChanges = true;
        }

        const blended = blendCellToSolid(index, cell);
        if (!blended) return;
        blendedColors.push(blended.color1!);
        newCells[index] = blended;
      });

      // Update cells state
      setCells(newCells);

      // Save state after auto-blend (only if changes were made)
      if (hasChanges && !pendingSaveRef.current) {
        pendingSaveRef.current = true;
        saveState(newCells, canvasRefs);
        pendingSaveRef.current = false;
      }

      // Call callback with all blended colors
      if (onAutoBlendCompleted && blendedColors.length > 0) {
        onAutoBlendCompleted(blendedColors);
      }
    }
  };

  return (
    <div className="grid-section">
      <h2>Color Palette</h2>
      <div className="palette-grid" data-grid-size={gridSize}>
        {cells.map((cell, index) => (
          <PaletteCell
            key={`${paletteType}-${gridKey}-${index}`}
            cell={cell}
            index={index}
            paletteType={paletteType}
            selectedColor={selectedColor}
            gridSize={gridSize}
            canvasSize={canvasSize}
            isCornerCell={corners.includes(index)}
            onCellUpdate={handleCellUpdate}
            onCanvasRef={handleCanvasRef}
            onBlendedColorCreated={onBlendedColorCreated}
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
          <button onClick={handleAutoBlend} className="btn btn-blend" title="Auto-blend all cells with colors">
            ⚡ Auto Blend
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
