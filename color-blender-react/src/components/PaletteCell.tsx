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
  onCellUpdate: (index: number, cell: PaletteCellType, shouldSaveHistory?: boolean, skipAestheticUpdate?: boolean) => void;
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
  const hasAutoFilledRef = useRef(false);

  // Timer system for detecting click vs hold
  const clickTimerRef = useRef<number | null>(null);
  const isHoldingRef = useRef(false);
  const lastClickTimeRef = useRef(0);
  const clickCountRef = useRef(0);
  const addColorTimerRef = useRef<number | null>(null); // Timer for delayed addColor call
  const HOLD_THRESHOLD = 200; // milliseconds to distinguish click from hold
  const DOUBLE_CLICK_THRESHOLD = 300; // milliseconds for double-click detection

  useEffect(() => {
    if (canvasRef.current) {
      onCanvasRef(index, canvasRef.current);
    }
  }, [index, onCanvasRef]);

  // Add touch event listeners with passive: false to allow preventDefault
  // Note: We need to re-attach listeners whenever component updates to avoid stale closures
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const touchStartHandler = (e: TouchEvent) => {
      e.preventDefault();
      // Start timer to detect hold vs tap
      isHoldingRef.current = false;
      clickTimerRef.current = window.setTimeout(() => {
        isHoldingRef.current = true;
        // Start blending if cell has 2+ colors
        if (cell.color1 && cell.color2) {
          setIsDrawing(true);
          hasAutoFilledRef.current = false;
          const rect = canvas.getBoundingClientRect();
          const touch = e.touches[0];
          if (touch) {
            const x = (touch.clientX - rect.left) * (canvas.width / rect.width);
            const y = (touch.clientY - rect.top) * (canvas.height / rect.height);
            const ctx = canvas.getContext('2d');
            if (ctx) {
              drawBlendedColor(ctx, x, y, cell);
            }
          }
        }
      }, HOLD_THRESHOLD);
    };

    const touchMoveHandler = (e: TouchEvent) => {
      if (!isDrawing) return;
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      if (touch) {
        const x = (touch.clientX - rect.left) * (canvas.width / rect.width);
        const y = (touch.clientY - rect.top) * (canvas.height / rect.height);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          drawBlendedColor(ctx, x, y, cell);
        }
      }
    };

    const touchEndHandler = () => {
      // Clear timer if it's still running
      if (clickTimerRef.current !== null) {
        clearTimeout(clickTimerRef.current);
        clickTimerRef.current = null;
      }

      // If was blending, handle blend completion
      if (isDrawing) {
        setIsDrawing(false);

        // Check if canvas is 80% blended (most pixels are the same color)
        if (canvas && cell.color1 && cell.color2) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const pixels = imageData.data;
            let totalR = 0, totalG = 0, totalB = 0, pixelCount = 0;

            for (let i = 0; i < pixels.length; i += 4) {
              totalR += pixels[i];
              totalG += pixels[i + 1];
              totalB += pixels[i + 2];
              pixelCount++;
            }

            const avgR = Math.round(totalR / pixelCount);
            const avgG = Math.round(totalG / pixelCount);
            const avgB = Math.round(totalB / pixelCount);

            let similarPixels = 0;
            const tolerance = 30;

            for (let i = 0; i < pixels.length; i += 4) {
              const diffR = Math.abs(pixels[i] - avgR);
              const diffG = Math.abs(pixels[i + 1] - avgG);
              const diffB = Math.abs(pixels[i + 2] - avgB);

              if (diffR <= tolerance && diffG <= tolerance && diffB <= tolerance) {
                similarPixels++;
              }
            }

            const blendPercentage = (similarPixels / pixelCount) * 100;

            if (blendPercentage >= 80 && !hasAutoFilledRef.current) {
              ctx.fillStyle = `rgb(${avgR}, ${avgG}, ${avgB})`;
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              hasAutoFilledRef.current = true;
              onCellUpdate(index, {
                color1: { r: avgR, g: avgG, b: avgB },
                color2: null,
                color3: null,
                color4: null,
                hasAllFourColors: false
              }, true, true);
            }
          }
        }
        return;
      }

      // If was a fast tap (not hold), handle tap detection
      if (!isHoldingRef.current) {
        const now = Date.now();
        const timeSinceLastClick = now - lastClickTimeRef.current;

        if (timeSinceLastClick < DOUBLE_CLICK_THRESHOLD && clickCountRef.current === 1) {
          if (addColorTimerRef.current !== null) {
            clearTimeout(addColorTimerRef.current);
            addColorTimerRef.current = null;
          }
          clickCountRef.current = 0;
          lastClickTimeRef.current = 0;
          // Clear cell
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
          }
          const skipAestheticUpdate = paletteType === 'aesthetic';
          onCellUpdate(index, {
            color1: null,
            color2: null,
            color3: null,
            color4: null,
            hasAllFourColors: false
          }, true, skipAestheticUpdate);
          return;
        }

        clickCountRef.current = 1;
        lastClickTimeRef.current = now;

        if (addColorTimerRef.current !== null) {
          clearTimeout(addColorTimerRef.current);
        }

        addColorTimerRef.current = window.setTimeout(() => {
          if (clickCountRef.current === 1) {
            // Add color logic
            if (!selectedColor) {
              alert('Please select a color from the image first!');
            } else if (paletteType === 'aesthetic' && !isCornerCell) {
              alert('In Aesthetic Palette mode, only click on corner cells! Edge and center cells auto-fill.');
            } else if (paletteType === 'aesthetic') {
              onCellUpdate(index, {
                color1: { ...selectedColor },
                color2: null,
                color3: null,
                color4: null,
                hasAllFourColors: false
              }, true);
            } else {
              // Manual mode logic
              if (!cell.color1) {
                onCellUpdate(index, { ...cell, color1: { ...selectedColor } }, true);
              } else if (!cell.color2) {
                const isSameColor =
                  cell.color1.r === selectedColor.r &&
                  cell.color1.g === selectedColor.g &&
                  cell.color1.b === selectedColor.b;
                if (isSameColor) {
                  alert('Please select a different color! Both colors cannot be the same.');
                } else {
                  onCellUpdate(index, { ...cell, color2: { ...selectedColor } }, true);
                }
              } else {
                // Calculate average from canvas
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                  const pixels = imageData.data;
                  let totalR = 0, totalG = 0, totalB = 0, pixelCount = 0;
                  for (let i = 0; i < pixels.length; i += 4) {
                    totalR += pixels[i];
                    totalG += pixels[i + 1];
                    totalB += pixels[i + 2];
                    pixelCount++;
                  }
                  const avgR = Math.round(totalR / pixelCount);
                  const avgG = Math.round(totalG / pixelCount);
                  const avgB = Math.round(totalB / pixelCount);
                  onCellUpdate(index, {
                    ...cell,
                    color1: { r: avgR, g: avgG, b: avgB },
                    color2: { ...selectedColor }
                  }, true);
                }
              }
            }
          }
          clickCountRef.current = 0;
          addColorTimerRef.current = null;
        }, DOUBLE_CLICK_THRESHOLD);
      }
    };

    canvas.addEventListener('touchstart', touchStartHandler, { passive: false });
    canvas.addEventListener('touchmove', touchMoveHandler, { passive: false });
    canvas.addEventListener('touchend', touchEndHandler, { passive: false });
    canvas.addEventListener('touchcancel', touchEndHandler, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', touchStartHandler);
      canvas.removeEventListener('touchmove', touchMoveHandler);
      canvas.removeEventListener('touchend', touchEndHandler);
      canvas.removeEventListener('touchcancel', touchEndHandler);
    };
  });

  // Redraw canvas when cell data changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    clearCanvas(ctx, canvas);

    if (cell.hasAllFourColors && cell.color1 && cell.color2 && cell.color3 && cell.color4) {
      fillCellWithFourColors(ctx, canvas, [cell.color1, cell.color2, cell.color3, cell.color4]);
      hasAutoFilledRef.current = false; // Reset flag when cell structure changes
    } else if (cell.color1 && cell.color2) {
      fillCellWithTwoColors(ctx, canvas, cell.color1, cell.color2);
      hasAutoFilledRef.current = false; // Reset flag when cell structure changes
    } else if (cell.color1) {
      fillCellWithColor(ctx, canvas, cell.color1);
      hasAutoFilledRef.current = false; // Reset flag when cell structure changes
    }
  }, [cell]);

  // Add color to cell (called on fast click)
  const addColorToCell = () => {
    if (!selectedColor) {
      alert('Please select a color from the image first!');
      return;
    }

    if (paletteType === 'aesthetic') {
      // In aesthetic mode, only corner cells can be set
      if (!isCornerCell) {
        alert('In Aesthetic Palette mode, only click on corner cells! Edge and center cells auto-fill.');
        return;
      }

      // Corners only hold one color - always replace with the new color
      onCellUpdate(index, {
        color1: { ...selectedColor },
        color2: null,
        color3: null,
        color4: null,
        hasAllFourColors: false
      }, true); // Save to history
    } else {
      // Manual palette mode
      // If cell is empty, add first color
      if (!cell.color1) {
        onCellUpdate(index, { ...cell, color1: { ...selectedColor } }, true);
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

        onCellUpdate(index, { ...cell, color2: { ...selectedColor } }, true);
      }
      // If both colors exist, calculate average color from blended canvas
      else {
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            // Get the entire canvas pixel data
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const pixels = imageData.data;

            // Calculate average color from all pixels
            let totalR = 0, totalG = 0, totalB = 0;
            const pixelCount = pixels.length / 4; // Each pixel has 4 values (RGBA)

            for (let i = 0; i < pixels.length; i += 4) {
              totalR += pixels[i];
              totalG += pixels[i + 1];
              totalB += pixels[i + 2];
            }

            const avgR = Math.round(totalR / pixelCount);
            const avgG = Math.round(totalG / pixelCount);
            const avgB = Math.round(totalB / pixelCount);

            // Blended color becomes color1, new color becomes color2
            onCellUpdate(index, {
              ...cell,
              color1: { r: avgR, g: avgG, b: avgB },
              color2: { ...selectedColor }
            }, true);
          }
        }
      }
    }
  };

  // Clear cell (called on double-click)
  const clearCell = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }

    // In aesthetic mode, skip auto-update to prevent double-save
    const skipAestheticUpdate = paletteType === 'aesthetic';

    onCellUpdate(index, {
      color1: null,
      color2: null,
      color3: null,
      color4: null,
      hasAllFourColors: false
    }, true, skipAestheticUpdate); // Save to history, skip aesthetic update if needed
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
    e.preventDefault();

    // Start timer to detect hold vs click
    isHoldingRef.current = false;
    clickTimerRef.current = window.setTimeout(() => {
      isHoldingRef.current = true;

      // Start blending if cell has 2+ colors
      if (cell.color1 && cell.color2) {
        setIsDrawing(true);
        hasAutoFilledRef.current = false;
        const pos = getMousePos(e);
        if (pos && canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) {
            drawBlendedColor(ctx, pos.x, pos.y, cell);
          }
        }
      }
    }, HOLD_THRESHOLD);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const pos = getMousePos(e);
    if (pos && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        drawBlendedColor(ctx, pos.x, pos.y, cell);
      }
    }
  };

  const handleMouseUp = () => {
    // Clear timer if it's still running
    if (clickTimerRef.current !== null) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
    }

    // If was blending, handle blend completion
    if (isDrawing) {
      setIsDrawing(false);

      // Check if canvas is 80% blended (most pixels are the same color)
      const canvas = canvasRef.current;
      if (canvas && cell.color1 && cell.color2) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const pixels = imageData.data;

          // Calculate average color of all pixels
          let totalR = 0, totalG = 0, totalB = 0;
          const pixelCount = pixels.length / 4;

          for (let i = 0; i < pixels.length; i += 4) {
            totalR += pixels[i];
            totalG += pixels[i + 1];
            totalB += pixels[i + 2];
          }

          const avgR = Math.round(totalR / pixelCount);
          const avgG = Math.round(totalG / pixelCount);
          const avgB = Math.round(totalB / pixelCount);

          // Count how many pixels are close to the average (within tolerance)
          const tolerance = 30; // Color similarity tolerance
          let similarPixels = 0;

          for (let i = 0; i < pixels.length; i += 4) {
            const diffR = Math.abs(pixels[i] - avgR);
            const diffG = Math.abs(pixels[i + 1] - avgG);
            const diffB = Math.abs(pixels[i + 2] - avgB);

            if (diffR <= tolerance && diffG <= tolerance && diffB <= tolerance) {
              similarPixels++;
            }
          }

          const blendPercentage = (similarPixels / pixelCount) * 100;

          // If 80% or more pixels are similar, auto-fill to solid color
          if (blendPercentage >= 80 && !hasAutoFilledRef.current) {
            // Fill entire canvas with the average color
            ctx.fillStyle = `rgb(${avgR}, ${avgG}, ${avgB})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Set flag to prevent duplicate saves
            hasAutoFilledRef.current = true;

            // Update cell data to reflect the blended color and SAVE TO HISTORY
            // Skip aesthetic update to prevent resetting edge/center cells
            onCellUpdate(index, {
              color1: { r: avgR, g: avgG, b: avgB },
              color2: null,
              color3: null,
              color4: null,
              hasAllFourColors: false
            }, true, true); // shouldSaveHistory=true, skipAestheticUpdate=true
          }
        }
      }
      return; // Exit early to prevent click logic after blending
    }

    // If was a fast click (not hold), handle click detection
    if (!isHoldingRef.current) {
      const now = Date.now();
      const timeSinceLastClick = now - lastClickTimeRef.current;

      // Check for double-click FIRST before setting any new timers
      if (timeSinceLastClick < DOUBLE_CLICK_THRESHOLD && clickCountRef.current === 1) {
        // DOUBLE-CLICK detected
        // Immediately clear the pending timer from the first click
        if (addColorTimerRef.current !== null) {
          clearTimeout(addColorTimerRef.current);
          addColorTimerRef.current = null;
        }
        // Reset all state
        clickCountRef.current = 0;
        lastClickTimeRef.current = 0;
        // Clear the cell (only ONE save)
        clearCell();
        return; // Exit early - don't set any new timers
      }

      // Single click - set up timer
      clickCountRef.current = 1;
      lastClickTimeRef.current = now;

      // Clear any existing timer (shouldn't happen, but be safe)
      if (addColorTimerRef.current !== null) {
        clearTimeout(addColorTimerRef.current);
      }

      // Wait to see if there's a second click
      addColorTimerRef.current = window.setTimeout(() => {
        if (clickCountRef.current === 1) {
          // No second click came - it was a single click
          addColorToCell();
        }
        clickCountRef.current = 0;
        addColorTimerRef.current = null;
      }, DOUBLE_CLICK_THRESHOLD);
    }
  };

  const handleMouseLeave = () => {
    // Clear timer if it's still running
    if (clickTimerRef.current !== null) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
    }

    // If was blending, stop blending but don't trigger click logic
    if (isDrawing) {
      setIsDrawing(false);
    }

    // Reset holding state to prevent click from triggering
    isHoldingRef.current = false;
  };


  return (
    <div className="palette-cell">
      <canvas
        ref={canvasRef}
        width={200}
        height={200}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      />
    </div>
  );
}
