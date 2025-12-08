import { useRef, useEffect, useState } from 'react';
import { PaletteCell as PaletteCellType, Color, PaletteType } from '../types';
import {
  fillCellWithColor,
  fillCellWithTwoColors,
  fillCellWithFourColors,
  clearCanvas,
  drawBlendedColor
} from '../utils/canvasUtils';

interface PaletteCellProps {
  cell: PaletteCellType;
  index: number;
  paletteType: PaletteType;
  selectedColor: Color | null;
  isCornerCell: boolean;
  onCellUpdate: (index: number, cell: PaletteCellType) => void;
  onCanvasRef: (index: number, canvas: HTMLCanvasElement | null) => void;
}

export function PaletteCell({
  cell,
  index,
  paletteType,
  selectedColor,
  isCornerCell,
  onCellUpdate,
  onCanvasRef
}: PaletteCellProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [dragStarted, setDragStarted] = useState(false);

  useEffect(() => {
    if (canvasRef.current) {
      onCanvasRef(index, canvasRef.current);
    }
  }, [index, onCanvasRef]);

  // Redraw canvas when cell data changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    clearCanvas(ctx, canvas);

    if (cell.hasAllFourColors && cell.color1 && cell.color2 && cell.color3 && cell.color4) {
      fillCellWithFourColors(ctx, canvas, [cell.color1, cell.color2, cell.color3, cell.color4]);
    } else if (cell.color1 && cell.color2) {
      fillCellWithTwoColors(ctx, canvas, cell.color1, cell.color2);
    } else if (cell.color1) {
      fillCellWithColor(ctx, canvas, cell.color1);
    }
  }, [cell]);

  const handleCellClick = () => {
    // Only trigger color picking if we didn't drag
    if (dragStarted) return;

    // In aesthetic mode, non-corner cells can't be clicked to add colors
    // But we don't show an alert - just do nothing (allows blending)
    if (paletteType === 'aesthetic' && !isCornerCell) {
      return;
    }

    if (!selectedColor) {
      alert('Please select a color from the image first!');
      return;
    }

    if (paletteType === 'aesthetic') {
      const updatedCell: PaletteCellType = {
        ...cell,
        color1: { ...selectedColor }
      };
      onCellUpdate(index, updatedCell);
    } else {
      // Manual palette mode
      // If cell is empty, add first color
      if (!cell.color1) {
        onCellUpdate(index, { ...cell, color1: { ...selectedColor } });
      }
      // If only has first color, add second color
      else if (!cell.color2) {
        // Check if the new color is the same as color1
        const isSameColor =
          cell.color1.r === selectedColor.r &&
          cell.color1.g === selectedColor.g &&
          cell.color1.b === selectedColor.b;

        if (isSameColor) {
          alert('Please select a different color! Both colors cannot be the same.');
          return;
        }

        onCellUpdate(index, { ...cell, color2: { ...selectedColor } });
      }
      // If both colors exist (cell is complete/blended), do nothing on single click
      // User must double-click to reset
    }
  };

  const handleCellDoubleClick = () => {
    // Double-click always resets and starts fresh with the selected color
    if (!selectedColor) {
      alert('Please select a color from the image first!');
      return;
    }

    if (paletteType === 'aesthetic') {
      if (!isCornerCell) {
        alert('In Aesthetic Palette mode, you can only reset corner cells! Edge and center cells are auto-filled from corners.');
        return;
      }
    }

    // Reset and start fresh with new color
    onCellUpdate(index, {
      color1: { ...selectedColor },
      color2: null,
      color3: null,
      color4: null,
      hasAllFourColors: false
    });
  };

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;

    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = (clientX - rect.left) * (canvas.width / rect.width);
    const y = (clientY - rect.top) * (canvas.height / rect.height);
    return { x, y };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setDragStarted(false);

    // If cell has 2+ colors, allow blending
    if (cell.color1 && cell.color2) {
      setIsDrawing(true);
      const pos = getMousePos(e);
      if (pos && canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          drawBlendedColor(ctx, pos.x, pos.y, cell);
        }
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    // Mark that we've dragged
    setDragStarted(true);

    const pos = getMousePos(e);
    if (pos && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        drawBlendedColor(ctx, pos.x, pos.y, cell);
      }
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    // Reset drag flag after a short delay to allow click handler to check it
    setTimeout(() => setDragStarted(false), 10);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    setDragStarted(false);

    // If cell has 2+ colors, allow blending
    if (cell.color1 && cell.color2) {
      e.preventDefault();
      setIsDrawing(true);
      const pos = getMousePos(e);
      if (pos && canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          drawBlendedColor(ctx, pos.x, pos.y, cell);
        }
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    setDragStarted(true);
    e.preventDefault();

    const pos = getMousePos(e);
    if (pos && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        drawBlendedColor(ctx, pos.x, pos.y, cell);
      }
    }
  };

  const handleTouchEnd = () => {
    setIsDrawing(false);
    setTimeout(() => setDragStarted(false), 10);
  };

  return (
    <div className="palette-cell" onClick={handleCellClick} onDoubleClick={handleCellDoubleClick}>
      <canvas
        ref={canvasRef}
        width={200}
        height={200}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      />
    </div>
  );
}
