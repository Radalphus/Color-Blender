import { Color, PaletteCell } from '../types';
import { colorToRgbString } from './colorUtils';

export function drawBlendedColor(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cell: PaletteCell,
  brushSize: number = 50
): void {
  if (!cell.color1 || !cell.color2) return;

  let targetColor: Color;

  // CENTER CELL WITH 4 COLORS - calculate the median/center color of all 4
  if (cell.hasAllFourColors && cell.color3 && cell.color4) {
    targetColor = {
      r: Math.round((cell.color1.r + cell.color2.r + cell.color3.r + cell.color4.r) / 4),
      g: Math.round((cell.color1.g + cell.color2.g + cell.color3.g + cell.color4.g) / 4),
      b: Math.round((cell.color1.b + cell.color2.b + cell.color3.b + cell.color4.b) / 4)
    };
  }
  // NORMAL 2-COLOR CELL - calculate the median/center color of both
  else {
    targetColor = {
      r: Math.round((cell.color1.r + cell.color2.r) / 2),
      g: Math.round((cell.color1.g + cell.color2.g) / 2),
      b: Math.round((cell.color1.b + cell.color2.b) / 2)
    };
  }

  // Paint with solid color (no smudging, no gradual mixing)
  ctx.fillStyle = colorToRgbString(targetColor);
  ctx.beginPath();
  ctx.arc(x, y, brushSize, 0, Math.PI * 2);
  ctx.fill();
}

export function fillCellWithColor(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  color: Color
): void {
  ctx.fillStyle = colorToRgbString(color);
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

export function fillCellWithTwoColors(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  color1: Color,
  color2: Color
): void {
  // Left half
  ctx.fillStyle = colorToRgbString(color1);
  ctx.fillRect(0, 0, canvas.width / 2, canvas.height);

  // Right half
  ctx.fillStyle = colorToRgbString(color2);
  ctx.fillRect(canvas.width / 2, 0, canvas.width / 2, canvas.height);
}

export function fillCellWithFourColors(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  colors: [Color, Color, Color, Color]
): void {
  const halfW = canvas.width / 2;
  const halfH = canvas.height / 2;

  // Top-left
  ctx.fillStyle = colorToRgbString(colors[0]);
  ctx.fillRect(0, 0, halfW, halfH);

  // Top-right
  ctx.fillStyle = colorToRgbString(colors[1]);
  ctx.fillRect(halfW, 0, halfW, halfH);

  // Bottom-left
  ctx.fillStyle = colorToRgbString(colors[2]);
  ctx.fillRect(0, halfH, halfW, halfH);

  // Bottom-right
  ctx.fillStyle = colorToRgbString(colors[3]);
  ctx.fillRect(halfW, halfH, halfW, halfH);
}

export function clearCanvas(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement
): void {
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}
