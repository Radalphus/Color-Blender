import { useState, useCallback } from 'react';
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

  const handleCanvasRef = useCallback((index: number, canvas: HTMLCanvasElement | null) => {
    setCanvasRefs(prev => {
      const newRefs = [...prev];
      newRefs[index] = canvas;
      return newRefs;
    });
  }, []);

  const updateAestheticPalette = useCallback((updatedCells: PaletteCellType[], changedCornerIndex?: number) => {
    const newCells = [...updatedCells];

    if (changedCornerIndex !== undefined) {
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

        if (corner1.color1 && corner2.color1) {
          newCells[edgeIndex] = {
            color1: { ...corner1.color1 },
            color2: { ...corner2.color1 },
            color3: null,
            color4: null,
            hasAllFourColors: false
          };
        }
      });

      // Reset center cell if all corners have colors
      const allCornersHaveColors = AESTHETIC_CORNERS.every(idx => newCells[idx].color1);
      if (allCornersHaveColors) {
        const cornerColors = AESTHETIC_CORNERS.map(idx => newCells[idx].color1!);
        newCells[AESTHETIC_CENTER] = {
          color1: { ...cornerColors[0] },
          color2: { ...cornerColors[1] },
          color3: { ...cornerColors[2] },
          color4: { ...cornerColors[3] },
          hasAllFourColors: true
        };
      }
    } else {
      // Full update (for initial setup or when no specific corner changed)
      Object.entries(AESTHETIC_EDGES).forEach(([edgeIndex, [corner1Index, corner2Index]]) => {
        const index = parseInt(edgeIndex);
        const corner1 = newCells[corner1Index];
        const corner2 = newCells[corner2Index];

        if (corner1.color1 && corner2.color1) {
          newCells[index] = {
            ...newCells[index],
            color1: { ...corner1.color1 },
            color2: { ...corner2.color1 }
          };
        }
      });

      const allCornersHaveColors = AESTHETIC_CORNERS.every(idx => newCells[idx].color1);
      if (allCornersHaveColors) {
        const cornerColors = AESTHETIC_CORNERS.map(idx => newCells[idx].color1!);
        newCells[AESTHETIC_CENTER] = {
          color1: { ...cornerColors[0] },
          color2: { ...cornerColors[1] },
          color3: { ...cornerColors[2] },
          color4: { ...cornerColors[3] },
          hasAllFourColors: true
        };
      }
    }

    return newCells;
  }, []);

  const handleCellUpdate = useCallback((index: number, cell: PaletteCellType) => {
    setCells(prevCells => {
      const newCells = [...prevCells];
      newCells[index] = cell;

      if (paletteType === 'aesthetic') {
        // Check if the updated cell is a corner
        const isCorner = AESTHETIC_CORNERS.includes(index as 0 | 2 | 6 | 8);
        if (isCorner) {
          // Smart reset: only update affected cells
          return updateAestheticPalette(newCells, index);
        } else {
          // Full update for non-corner cells (shouldn't happen normally)
          return updateAestheticPalette(newCells);
        }
      }

      return newCells;
    });
  }, [paletteType, updateAestheticPalette]);

  const handleClearGrid = () => {
    if (confirm('Are you sure you want to clear all palette cells?')) {
      setCells(Array(9).fill(null).map(() => ({
        color1: null,
        color2: null,
        color3: null,
        color4: null,
        hasAllFourColors: false
      })));
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
  );
}
