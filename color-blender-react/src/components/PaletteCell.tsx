import { useRef, useEffect, useState } from 'react';
import { PaletteCell as PaletteCellType, Color, Mode, PaletteType } from '../types';
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
  mode: Mode;
  paletteType: PaletteType;
  selectedColor: Color | null;
  isCornerCell: boolean;
  onCellUpdate: (index: number, cell: PaletteCellType) => void;
  onCanvasRef: (index: number, canvas: HTMLCanvasElement | null) => void;
}

export function PaletteCell({
  cell,
  index,
  mode,
  paletteType,
  selectedColor,
  isCornerCell,
  onCellUpdate,
  onCanvasRef
}: PaletteCellProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

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

  const handleClick = () => {
    if (mode === 'picking') {
      if (!selectedColor) {
        alert('Please select a color from the image first!');
        return;
      }

      if (paletteType === 'aesthetic') {
        if (!isCornerCell) {
          alert('In Aesthetic Palette mode, only click on corner cells! Edge and center cells auto-fill.');
          return;
        }

        const updatedCell: PaletteCellType = {
          ...cell,
          color1: { ...selectedColor }
        };
        onCellUpdate(index, updatedCell);
      } else {
        // Manual palette mode
        if (!cell.color1) {
          onCellUpdate(index, { ...cell, color1: { ...selectedColor } });
        } else if (!cell.color2) {
          onCellUpdate(index, { ...cell, color2: { ...selectedColor } });
        } else {
          onCellUpdate(index, { ...cell, color2: { ...selectedColor } });
        }
      }
    } else if (mode === 'blending') {
      if (!cell.color1 || !cell.color2) {
        alert('Please set both colors first (switch to Color Picking Mode)!');
      }
    }
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
    if (mode !== 'blending' || !cell.color1 || !cell.color2) return;

    setIsDrawing(true);
    const pos = getMousePos(e);
    if (pos && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        drawBlendedColor(ctx, pos.x, pos.y, cell);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || mode !== 'blending') return;

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
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (mode !== 'blending' || !cell.color1 || !cell.color2) return;

    e.preventDefault();
    setIsDrawing(true);
    const pos = getMousePos(e);
    if (pos && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        drawBlendedColor(ctx, pos.x, pos.y, cell);
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || mode !== 'blending') return;

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
  };

  return (
    <div className="palette-cell" onClick={handleClick}>
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
