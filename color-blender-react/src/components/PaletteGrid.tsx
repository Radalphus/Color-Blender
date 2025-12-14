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
  onBlendedColorCreated?: (color: Color) => void;
  onAutoBlendCompleted?: (colors: Color[]) => void;
}

export function PaletteGrid({ selectedColor, paletteType, onBlendedColorCreated, onAutoBlendCompleted }: PaletteGridProps) {
  // Separate state for each palette type
  const [manualCells, setManualCells] = useState<PaletteCellType[]>(
    Array(9).fill(null).map(() => ({
      color1: null,
      color2: null,
      color3: null,
      color4: null,
      hasAllFourColors: false
    }))
  );
  const [aestheticCells, setAestheticCells] = useState<PaletteCellType[]>(
    Array(9).fill(null).map(() => ({
      color1: null,
      color2: null,
      color3: null,
      color4: null,
      hasAllFourColors: false
    }))
  );

  // Separate canvas refs for each palette type
  const [manualCanvasRefs, setManualCanvasRefs] = useState<(HTMLCanvasElement | null)[]>(Array(9).fill(null));
  const [aestheticCanvasRefs, setAestheticCanvasRefs] = useState<(HTMLCanvasElement | null)[]>(Array(9).fill(null));

  // Separate history for each palette type
  const manualHistory = useHistory();
  const aestheticHistory = useHistory();

  // Switch between manual and aesthetic based on current palette type
  const cells = paletteType === 'manual' ? manualCells : aestheticCells;
  const setCells = paletteType === 'manual' ? setManualCells : setAestheticCells;
  const canvasRefs = paletteType === 'manual' ? manualCanvasRefs : aestheticCanvasRefs;
  const setCanvasRefs = paletteType === 'manual' ? setManualCanvasRefs : setAestheticCanvasRefs;
  const { saveState, undo, redo, canUndo, canRedo, clearHistory } = paletteType === 'manual' ? manualHistory : aestheticHistory;

  const [manualIsInitialized, setManualIsInitialized] = useState(false);
  const [aestheticIsInitialized, setAestheticIsInitialized] = useState(false);
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
          // Check if both corners have the same color
          const sameColor = corner1.color1!.r === corner2.color1!.r &&
                           corner1.color1!.g === corner2.color1!.g &&
                           corner1.color1!.b === corner2.color1!.b;

          if (sameColor) {
            // If same color, edge cell should only contain one copy
            newCells[edgeIndex] = {
              color1: { ...corner1.color1! },
              color2: null,
              color3: null,
              color4: null,
              hasAllFourColors: false
            };
          } else {
            // Different colors, edge cell contains both
            newCells[edgeIndex] = {
              color1: { ...corner1.color1! },
              color2: { ...corner2.color1! },
              color3: null,
              color4: null,
              hasAllFourColors: false
            };
          }
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
          // Check if both corners have the same color
          const sameColor = corner1.color1!.r === corner2.color1!.r &&
                           corner1.color1!.g === corner2.color1!.g &&
                           corner1.color1!.b === corner2.color1!.b;

          if (sameColor) {
            // If same color, edge cell should only contain one copy
            newCells[index] = {
              color1: { ...corner1.color1! },
              color2: null,
              color3: null,
              color4: null,
              hasAllFourColors: false
            };
          } else {
            // Different colors, edge cell contains both
            newCells[index] = {
              color1: { ...corner1.color1! },
              color2: { ...corner2.color1! },
              color3: null,
              color4: null,
              hasAllFourColors: false
            };
          }
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

  const handleAutoBlend = () => {
    // Array to collect all blended colors
    const blendedColors: Color[] = [];

    // Track if any changes were made
    let hasChanges = false;

    if (paletteType === 'aesthetic') {
      // For aesthetic mode: blend corners first, then update edges and center using auto-fill logic
      const newCells = [...cells];

      // First, check current edges to see if they need blending (before auto-fill changes them)
      Object.keys(AESTHETIC_EDGES).forEach(edgeIndexStr => {
        const index = parseInt(edgeIndexStr);
        const cell = cells[index];

        if (cell.color1 && cell.color2) {
          // Edge has 2 colors - check if already blended
          const medianR = Math.round((cell.color1.r + cell.color2.r) / 2);
          const medianG = Math.round((cell.color1.g + cell.color2.g) / 2);
          const medianB = Math.round((cell.color1.b + cell.color2.b) / 2);

          const needsBlending =
            cell.color1.r !== medianR ||
            cell.color1.g !== medianG ||
            cell.color1.b !== medianB;

          if (needsBlending) {
            hasChanges = true;
          }
        }
      });

      // Check center cell (it has 4 colors that blend to 1)
      const centerCell = cells[AESTHETIC_CENTER];
      if (centerCell.hasAllFourColors && centerCell.color1 && centerCell.color2 && centerCell.color3 && centerCell.color4) {
        // Center has 4 colors - check if already blended
        const medianR = Math.round((centerCell.color1.r + centerCell.color2.r + centerCell.color3.r + centerCell.color4.r) / 4);
        const medianG = Math.round((centerCell.color1.g + centerCell.color2.g + centerCell.color3.g + centerCell.color4.g) / 4);
        const medianB = Math.round((centerCell.color1.b + centerCell.color2.b + centerCell.color3.b + centerCell.color4.b) / 4);

        const needsBlending =
          centerCell.color1.r !== medianR ||
          centerCell.color1.g !== medianG ||
          centerCell.color1.b !== medianB;

        if (needsBlending) {
          hasChanges = true;
        }
      }

      // Step 1: Blend all corner cells (0, 2, 6, 8)
      AESTHETIC_CORNERS.forEach(cornerIndex => {
        const canvas = canvasRefs[cornerIndex];
        if (!canvas) return;

        const cell = newCells[cornerIndex];
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Skip if corner has no colors
        if (!cell.color1) return;

        // Check if this cell has multiple colors (needs blending)
        if (cell.color2 || cell.color3 || cell.color4) {
          hasChanges = true;
        }

        // Calculate median color for this corner
        let medianR: number, medianG: number, medianB: number;

        if (cell.hasAllFourColors && cell.color2 && cell.color3 && cell.color4) {
          medianR = Math.round((cell.color1.r + cell.color2.r + cell.color3.r + cell.color4.r) / 4);
          medianG = Math.round((cell.color1.g + cell.color2.g + cell.color3.g + cell.color4.g) / 4);
          medianB = Math.round((cell.color1.b + cell.color2.b + cell.color3.b + cell.color4.b) / 4);
        } else if (cell.color3) {
          medianR = Math.round((cell.color1.r + cell.color2!.r + cell.color3.r) / 3);
          medianG = Math.round((cell.color1.g + cell.color2!.g + cell.color3.g) / 3);
          medianB = Math.round((cell.color1.b + cell.color2!.b + cell.color3.b) / 3);
        } else if (cell.color2) {
          medianR = Math.round((cell.color1.r + cell.color2.r) / 2);
          medianG = Math.round((cell.color1.g + cell.color2.g) / 2);
          medianB = Math.round((cell.color1.b + cell.color2.b) / 2);
        } else {
          medianR = cell.color1.r;
          medianG = cell.color1.g;
          medianB = cell.color1.b;
        }

        // Fill corner cell with median color
        ctx.fillStyle = `rgb(${medianR}, ${medianG}, ${medianB})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Collect blended color
        const blendedColor = { r: medianR, g: medianG, b: medianB };
        blendedColors.push(blendedColor);

        // Update cell data to reflect blended state (only color1, rest null)
        newCells[cornerIndex] = {
          color1: blendedColor,
          color2: null,
          color3: null,
          color4: null,
          hasAllFourColors: false
        };
      });

      // Step 2: Update aesthetic palette (fills edges and center)
      const updatedCells = updateAestheticPalette(newCells);
      // Don't set cells here - we'll do it after blending is complete to avoid multiple state updates

      // Step 3: Blend the edge cells visually and update their cell data
      setTimeout(() => {
        const finalCells = [...updatedCells];
        const edgeColors: Color[] = [];

        // First, blend all edge cells (not corners, not center)
        Object.keys(AESTHETIC_EDGES).forEach(edgeIndexStr => {
          const index = parseInt(edgeIndexStr);
          const canvas = canvasRefs[index];
          const cell = finalCells[index];

          if (!canvas || !cell.color1) return;

          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          // Calculate median for edge cell
          let medianR: number, medianG: number, medianB: number;

          if (cell.color2) {
            medianR = Math.round((cell.color1.r + cell.color2.r) / 2);
            medianG = Math.round((cell.color1.g + cell.color2.g) / 2);
            medianB = Math.round((cell.color1.b + cell.color2.b) / 2);
            // Edge checking already done upfront, no need to check again here
          } else {
            medianR = cell.color1.r;
            medianG = cell.color1.g;
            medianB = cell.color1.b;
          }

          // Fill edge cell with median color
          ctx.fillStyle = `rgb(${medianR}, ${medianG}, ${medianB})`;
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Store the blended edge color
          const blendedColor = { r: medianR, g: medianG, b: medianB };
          edgeColors.push(blendedColor);
          blendedColors.push(blendedColor);

          // Update edge cell data to reflect blended state
          finalCells[index] = {
            color1: blendedColor,
            color2: null,
            color3: null,
            color4: null,
            hasAllFourColors: false
          };
        });

        // Step 4: Now blend the center cell with the 4 blended edge colors
        if (edgeColors.length === 4) {
          // Calculate the median of all 4 edge colors
          const medianR = Math.round((edgeColors[0].r + edgeColors[1].r + edgeColors[2].r + edgeColors[3].r) / 4);
          const medianG = Math.round((edgeColors[0].g + edgeColors[1].g + edgeColors[2].g + edgeColors[3].g) / 4);
          const medianB = Math.round((edgeColors[0].b + edgeColors[1].b + edgeColors[2].b + edgeColors[3].b) / 4);

          const centerBlendedColor = { r: medianR, g: medianG, b: medianB };
          blendedColors.push(centerBlendedColor);

          // Update center cell data to reflect blended state (only color1)
          finalCells[AESTHETIC_CENTER] = {
            color1: centerBlendedColor,
            color2: null,
            color3: null,
            color4: null,
            hasAllFourColors: false
          };

          // Blend the center cell visually
          const centerCanvas = canvasRefs[AESTHETIC_CENTER];
          if (centerCanvas) {
            const ctx = centerCanvas.getContext('2d');
            if (ctx) {
              ctx.fillStyle = `rgb(${medianR}, ${medianG}, ${medianB})`;
              ctx.fillRect(0, 0, centerCanvas.width, centerCanvas.height);
            }
          }
        }

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
        if (!canvas) return;

        const cell = newCells[index];
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Skip if cell has no colors
        if (!cell.color1) return;

        // Check if this cell has multiple colors (needs blending)
        if (cell.color2 || cell.color3 || cell.color4) {
          hasChanges = true;
        }

        // Calculate the median color based on how many colors the cell has
        let medianR: number, medianG: number, medianB: number;

        if (cell.hasAllFourColors && cell.color2 && cell.color3 && cell.color4) {
          medianR = Math.round((cell.color1.r + cell.color2.r + cell.color3.r + cell.color4.r) / 4);
          medianG = Math.round((cell.color1.g + cell.color2.g + cell.color3.g + cell.color4.g) / 4);
          medianB = Math.round((cell.color1.b + cell.color2.b + cell.color3.b + cell.color4.b) / 4);
        } else if (cell.color3) {
          medianR = Math.round((cell.color1.r + cell.color2!.r + cell.color3.r) / 3);
          medianG = Math.round((cell.color1.g + cell.color2!.g + cell.color3.g) / 3);
          medianB = Math.round((cell.color1.b + cell.color2!.b + cell.color3.b) / 3);
        } else if (cell.color2) {
          medianR = Math.round((cell.color1.r + cell.color2.r) / 2);
          medianG = Math.round((cell.color1.g + cell.color2.g) / 2);
          medianB = Math.round((cell.color1.b + cell.color2.b) / 2);
        } else {
          medianR = cell.color1.r;
          medianG = cell.color1.g;
          medianB = cell.color1.b;
        }

        // Collect blended color
        const blendedColor = { r: medianR, g: medianG, b: medianB };
        blendedColors.push(blendedColor);

        // Update cell data to reflect blended state (only color1, rest null)
        newCells[index] = {
          color1: blendedColor,
          color2: null,
          color3: null,
          color4: null,
          hasAllFourColors: false
        };

        // Fill the entire cell with the median color
        ctx.fillStyle = `rgb(${medianR}, ${medianG}, ${medianB})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
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
      <div className="palette-grid">
        {cells.map((cell, index) => (
          <PaletteCell
            key={`${paletteType}-${index}`}
            cell={cell}
            index={index}
            paletteType={paletteType}
            selectedColor={selectedColor}
            isCornerCell={AESTHETIC_CORNERS.includes(index as 0 | 2 | 6 | 8)}
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
