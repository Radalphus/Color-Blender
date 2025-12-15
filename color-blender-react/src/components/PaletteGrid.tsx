import { useState, useCallback, useEffect, useRef } from 'react';
import {
  PaletteCell as PaletteCellType,
  Color,
  PaletteType,
  GridSize,
  getGridConfig
} from '../types';
import { PaletteCell } from './PaletteCell';
import { exportPaletteAsImage, savePaletteAsJson } from '../utils/exportUtils';
import { useHistory } from '../hooks/useHistory';

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
    Array(count).fill(null).map(() => ({
      color1: null,
      color2: null,
      color3: null,
      color4: null,
      hasAllFourColors: false
    }));

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
    console.log(`Grid size changed to ${gridSize}, resetting state...`);
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
    console.log(`State reset complete. New gridKey: ${gridKey + 1}`);
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
    console.log(`handleCanvasRef called: index=${index}, canvas=${canvas ? 'EXISTS' : 'NULL'}, paletteType=${paletteType}`);
    setCanvasRefs(prev => {
      console.log(`  Previous refs length: ${prev.length}, setting index ${index}`);
      const newRefs = [...prev];
      newRefs[index] = canvas;
      console.log(`  New refs[${index}] =`, canvas ? 'CANVAS' : 'null');
      return newRefs;
    });
  }, [setCanvasRefs, paletteType]);

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
      // Only update inner cells (used when edges are blended)
      const allEdgesBlended = Object.keys(edges).every(edgeIndex => {
        const edge = newCells[parseInt(edgeIndex)];
        return edge.color1 && !edge.color2 && !edge.color3 && !edge.color4;
      });

      if (allEdgesBlended) {
        // For 3x3: 1 center cell with 4 colors from edges
        // For 4x4+: Multiple inner cells, each gets blend of 4 corners
        if (gridSize === 3) {
          const edgeColors = Object.keys(edges).map(idx => newCells[parseInt(idx)].color1!);
          const centerIndex = inner[0]; // For 3x3, there's only 1 inner cell
          newCells[centerIndex] = {
            color1: { ...edgeColors[0] },
            color2: { ...edgeColors[1] },
            color3: { ...edgeColors[2] },
            color4: { ...edgeColors[3] },
            hasAllFourColors: true
          };
        } else {
          // For 4x4 and 5x5: All inner cells get blend of all 4 corners
          const cornerColors = corners.map(idx => newCells[idx].color1!);
          inner.forEach(innerIndex => {
            newCells[innerIndex] = {
              color1: { ...cornerColors[0] },
              color2: { ...cornerColors[1] },
              color3: { ...cornerColors[2] },
              color4: { ...cornerColors[3] },
              hasAllFourColors: true
            };
          });
        }
      } else {
        // Clear inner cells if edges aren't ready
        inner.forEach(innerIndex => {
          newCells[innerIndex] = {
            color1: null,
            color2: null,
            color3: null,
            color4: null,
            hasAllFourColors: false
          };
        });
      }
    } else if (changedCornerIndex !== undefined) {
      // Smart reset: only update cells affected by the changed corner
      const affectedEdges: number[] = [];

      // Find which edges are affected by this corner
      Object.entries(edges).forEach(([edgeIndex, [corner1Index, corner2Index]]) => {
        if (corner1Index === changedCornerIndex || corner2Index === changedCornerIndex) {
          affectedEdges.push(parseInt(edgeIndex));
        }
      });

      // Reset only the affected edge cells
      affectedEdges.forEach(edgeIndex => {
        const [corner1Index, corner2Index] = edges[edgeIndex];
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

      // Update inner cells - only fill if ALL edges are fully blended (only color1, no other colors)
      const allEdgesBlended = Object.keys(edges).every(edgeIndex => {
        const edge = newCells[parseInt(edgeIndex)];
        return edge.color1 && !edge.color2 && !edge.color3 && !edge.color4;
      });

      if (allEdgesBlended) {
        if (gridSize === 3) {
          const edgeColors = Object.keys(edges).map(idx => newCells[parseInt(idx)].color1!);
          const centerIndex = inner[0];
          newCells[centerIndex] = {
            color1: { ...edgeColors[0] },
            color2: { ...edgeColors[1] },
            color3: { ...edgeColors[2] },
            color4: { ...edgeColors[3] },
            hasAllFourColors: true
          };
        } else {
          const cornerColors = corners.map(idx => newCells[idx].color1!);
          inner.forEach(innerIndex => {
            newCells[innerIndex] = {
              color1: { ...cornerColors[0] },
              color2: { ...cornerColors[1] },
              color3: { ...cornerColors[2] },
              color4: { ...cornerColors[3] },
              hasAllFourColors: true
            };
          });
        }
      } else {
        // Clear inner cells if edges aren't ready
        inner.forEach(innerIndex => {
          newCells[innerIndex] = {
            color1: null,
            color2: null,
            color3: null,
            color4: null,
            hasAllFourColors: false
          };
        });
      }
    } else {
      // Full update (for initial setup or when no specific corner changed)
      Object.entries(edges).forEach(([edgeIndex, [corner1Index, corner2Index]]) => {
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

      // Update inner cells - only fill if ALL edges are fully blended (only color1, no other colors)
      const allEdgesBlended = Object.keys(edges).every(edgeIndex => {
        const edge = newCells[parseInt(edgeIndex)];
        return edge.color1 && !edge.color2 && !edge.color3 && !edge.color4;
      });

      if (allEdgesBlended) {
        if (gridSize === 3) {
          const edgeColors = Object.keys(edges).map(idx => newCells[parseInt(idx)].color1!);
          const centerIndex = inner[0];
          newCells[centerIndex] = {
            color1: { ...edgeColors[0] },
            color2: { ...edgeColors[1] },
            color3: { ...edgeColors[2] },
            color4: { ...edgeColors[3] },
            hasAllFourColors: true
          };
        } else {
          const cornerColors = corners.map(idx => newCells[idx].color1!);
          inner.forEach(innerIndex => {
            newCells[innerIndex] = {
              color1: { ...cornerColors[0] },
              color2: { ...cornerColors[1] },
              color3: { ...cornerColors[2] },
              color4: { ...cornerColors[3] },
              hasAllFourColors: true
            };
          });
        }
      } else {
        // Clear inner cells if edges aren't ready
        inner.forEach(innerIndex => {
          newCells[innerIndex] = {
            color1: null,
            color2: null,
            color3: null,
            color4: null,
            hasAllFourColors: false
          };
        });
      }
    }

    return newCells;
  }, [gridSize, corners, edges, inner]);


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
    console.log('=== AUTO BLEND CLICKED ===');
    console.log('Grid Size:', gridSize);
    console.log('Palette Type:', paletteType);
    console.log('Corners:', corners);
    console.log('Edges:', edges);
    console.log('Inner:', inner);
    console.log('Cells:', cells);
    console.log('Canvas Refs:', canvasRefs);

    // Array to collect all blended colors
    const blendedColors: Color[] = [];

    // Track if any changes were made
    let hasChanges = false;

    if (paletteType === 'aesthetic') {
      console.log('AESTHETIC MODE BRANCH');
      // For aesthetic mode: blend corners first, then update edges and inner cells using auto-fill logic
      const newCells = [...cells];

      // First, check current edges to see if they need blending (before auto-fill changes them)
      console.log('Checking edges for blending...');
      Object.keys(edges).forEach(edgeIndexStr => {
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

      // Check inner cells (they have 4 colors that blend to 1)
      inner.forEach(innerIndex => {
        const innerCell = cells[innerIndex];
        if (innerCell.hasAllFourColors && innerCell.color1 && innerCell.color2 && innerCell.color3 && innerCell.color4) {
          // Inner cell has 4 colors - check if already blended
          const medianR = Math.round((innerCell.color1.r + innerCell.color2.r + innerCell.color3.r + innerCell.color4.r) / 4);
          const medianG = Math.round((innerCell.color1.g + innerCell.color2.g + innerCell.color3.g + innerCell.color4.g) / 4);
          const medianB = Math.round((innerCell.color1.b + innerCell.color2.b + innerCell.color3.b + innerCell.color4.b) / 4);

          const needsBlending =
            innerCell.color1.r !== medianR ||
            innerCell.color1.g !== medianG ||
            innerCell.color1.b !== medianB;

          if (needsBlending) {
            hasChanges = true;
          }
        }
      });

      // Step 1: Blend all corner cells
      console.log('Step 1: Blending corner cells...');
      corners.forEach(cornerIndex => {
        const canvas = canvasRefs[cornerIndex];
        console.log(`Corner ${cornerIndex}:`, canvas ? 'has canvas' : 'NO CANVAS');
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

        // First, blend all edge cells (not corners, not inner)
        Object.keys(edges).forEach(edgeIndexStr => {
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

        // Step 4: Blend all inner cells (center for 3x3, or multiple inner cells for 4x4/5x5)
        inner.forEach(innerIndex => {
          const innerCell = finalCells[innerIndex];
          if (!innerCell.hasAllFourColors || !innerCell.color1 || !innerCell.color2 || !innerCell.color3 || !innerCell.color4) return;

          // Calculate the median of all 4 colors
          const medianR = Math.round((innerCell.color1.r + innerCell.color2.r + innerCell.color3.r + innerCell.color4.r) / 4);
          const medianG = Math.round((innerCell.color1.g + innerCell.color2.g + innerCell.color3.g + innerCell.color4.g) / 4);
          const medianB = Math.round((innerCell.color1.b + innerCell.color2.b + innerCell.color3.b + innerCell.color4.b) / 4);

          const innerBlendedColor = { r: medianR, g: medianG, b: medianB };
          blendedColors.push(innerBlendedColor);

          // Update inner cell data to reflect blended state (only color1)
          finalCells[innerIndex] = {
            color1: innerBlendedColor,
            color2: null,
            color3: null,
            color4: null,
            hasAllFourColors: false
          };

          // Blend the inner cell visually
          const innerCanvas = canvasRefs[innerIndex];
          if (innerCanvas) {
            const ctx = innerCanvas.getContext('2d');
            if (ctx) {
              ctx.fillStyle = `rgb(${medianR}, ${medianG}, ${medianB})`;
              ctx.fillRect(0, 0, innerCanvas.width, innerCanvas.height);
            }
          }
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
      console.log('MANUAL MODE BRANCH');
      // Manual mode: blend all cells that have colors
      const newCells = [...cells];

      console.log('Processing cells in manual mode...');
      canvasRefs.forEach((canvas, index) => {
        console.log(`Cell ${index}:`, canvas ? 'has canvas' : 'NO CANVAS', 'cell:', newCells[index]);
        if (!canvas) {
          console.log(`  Skipping cell ${index} - no canvas`);
          return;
        }

        const cell = newCells[index];
        if (!cell) {
          console.log(`  Skipping cell ${index} - cell is undefined`);
          return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          console.log(`  Skipping cell ${index} - no context`);
          return;
        }

        // Skip if cell has no colors
        if (!cell.color1) {
          console.log(`  Skipping cell ${index} - no color1`);
          return;
        }
        console.log(`  Cell ${index} will be blended!`);

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
        console.log(`  Cell ${index} blended to rgb(${medianR}, ${medianG}, ${medianB})`);
      });

      console.log('Done processing cells. hasChanges:', hasChanges, 'blendedColors:', blendedColors.length);

      // Update cells state
      setCells(newCells);
      console.log('Cells state updated');

      // Save state after auto-blend (only if changes were made)
      if (hasChanges && !pendingSaveRef.current) {
        console.log('Saving state...');
        pendingSaveRef.current = true;
        saveState(newCells, canvasRefs);
        pendingSaveRef.current = false;
        console.log('State saved');
      } else {
        console.log('Not saving state. hasChanges:', hasChanges, 'pendingSaveRef:', pendingSaveRef.current);
      }

      // Call callback with all blended colors
      if (onAutoBlendCompleted && blendedColors.length > 0) {
        console.log('Calling onAutoBlendCompleted with', blendedColors.length, 'colors');
        onAutoBlendCompleted(blendedColors);
      } else {
        console.log('Not calling onAutoBlendCompleted. callback exists:', !!onAutoBlendCompleted, 'colors:', blendedColors.length);
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
