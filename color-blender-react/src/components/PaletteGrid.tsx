import { useState, useCallback, useEffect } from 'react';
import {
  PaletteCell as PaletteCellType,
  Color,
  Mode,
  PaletteType,
  AESTHETIC_CORNERS,
  AESTHETIC_EDGES,
  AESTHETIC_CENTER
} from '../types';
import { PaletteCell } from './PaletteCell';
import { exportPaletteAsImage, savePaletteAsJson } from '../utils/exportUtils';

interface PaletteGridProps {
  selectedColor: Color | null;
  mode: Mode;
  paletteType: PaletteType;
}

export function PaletteGrid({ selectedColor, mode, paletteType }: PaletteGridProps) {
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

  const updateAestheticPalette = useCallback((updatedCells: PaletteCellType[]) => {
    const newCells = [...updatedCells];

    // Update edge cells
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

    // Update center cell
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

    return newCells;
  }, []);

  const handleCellUpdate = useCallback((index: number, cell: PaletteCellType) => {
    setCells(prevCells => {
      const newCells = [...prevCells];
      newCells[index] = cell;

      if (paletteType === 'aesthetic') {
        return updateAestheticPalette(newCells);
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
            mode={mode}
            paletteType={paletteType}
            selectedColor={selectedColor}
            isCornerCell={AESTHETIC_CORNERS.includes(index)}
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
