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

  // CELL WITH 4 COLORS - calculate the median/center color of all 4
  if (cell.hasAllFourColors && cell.color3 && cell.color4) {
    targetColor = {
      r: Math.round((cell.color1.r + cell.color2.r + cell.color3.r + cell.color4.r) / 4),
      g: Math.round((cell.color1.g + cell.color2.g + cell.color3.g + cell.color4.g) / 4),
      b: Math.round((cell.color1.b + cell.color2.b + cell.color3.b + cell.color4.b) / 4)
    };
  }
  // CELL WITH 3 COLORS - calculate the median/center color of all 3
  else if (cell.color3) {
    targetColor = {
      r: Math.round((cell.color1.r + cell.color2.r + cell.color3.r) / 3),
      g: Math.round((cell.color1.g + cell.color2.g + cell.color3.g) / 3),
      b: Math.round((cell.color1.b + cell.color2.b + cell.color3.b) / 3)
    };
  }
  // CELL WITH 2 COLORS - calculate the median/center color of both
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

export function fillCellWithTwoColorsHorizontal(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  color1: Color,
  color2: Color
): void {
  // Top half
  ctx.fillStyle = colorToRgbString(color1);
  ctx.fillRect(0, 0, canvas.width, canvas.height / 2);

  // Bottom half
  ctx.fillStyle = colorToRgbString(color2);
  ctx.fillRect(0, canvas.height / 2, canvas.width, canvas.height / 2);
}

export function fillCellWithThreeColors(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  color1: Color,
  color2: Color,
  color3: Color
): void {
  // Check if color1 and color2 are the same (weighted edge case)
  const color1Same = color1.r === color2.r && color1.g === color2.g && color1.b === color2.b;
  const color2Same = color2.r === color3.r && color2.g === color3.g && color2.b === color3.b;

  if (color1Same) {
    // color1 and color2 are the same - show 2/3 color1, 1/3 color3
    const twoThirds = Math.floor(canvas.width * 2 / 3);

    // Left 2/3
    ctx.fillStyle = colorToRgbString(color1);
    ctx.fillRect(0, 0, twoThirds, canvas.height);

    // Right 1/3
    ctx.fillStyle = colorToRgbString(color3);
    ctx.fillRect(twoThirds, 0, canvas.width - twoThirds, canvas.height);
  } else if (color2Same) {
    // color2 and color3 are the same - show 1/3 color1, 2/3 color2
    const oneThird = Math.floor(canvas.width / 3);

    // Left 1/3
    ctx.fillStyle = colorToRgbString(color1);
    ctx.fillRect(0, 0, oneThird, canvas.height);

    // Right 2/3
    ctx.fillStyle = colorToRgbString(color2);
    ctx.fillRect(oneThird, 0, canvas.width - oneThird, canvas.height);
  } else {
    // All three colors are different - show in thirds
    const thirdW = Math.floor(canvas.width / 3);

    // Left third
    ctx.fillStyle = colorToRgbString(color1);
    ctx.fillRect(0, 0, thirdW, canvas.height);

    // Middle third
    ctx.fillStyle = colorToRgbString(color2);
    ctx.fillRect(thirdW, 0, thirdW, canvas.height);

    // Right third
    ctx.fillStyle = colorToRgbString(color3);
    ctx.fillRect(thirdW * 2, 0, canvas.width - thirdW * 2, canvas.height);
  }
}

export function fillCellWithThreeColorsHorizontal(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  color1: Color,
  color2: Color,
  color3: Color
): void {
  // Check if color1 and color2 are the same (weighted edge case)
  const color1Same = color1.r === color2.r && color1.g === color2.g && color1.b === color2.b;
  const color2Same = color2.r === color3.r && color2.g === color3.g && color2.b === color3.b;

  if (color1Same) {
    // color1 and color2 are the same - show 2/3 color1, 1/3 color3
    const twoThirds = Math.floor(canvas.height * 2 / 3);

    // Top 2/3
    ctx.fillStyle = colorToRgbString(color1);
    ctx.fillRect(0, 0, canvas.width, twoThirds);

    // Bottom 1/3
    ctx.fillStyle = colorToRgbString(color3);
    ctx.fillRect(0, twoThirds, canvas.width, canvas.height - twoThirds);
  } else if (color2Same) {
    // color2 and color3 are the same - show 1/3 color1, 2/3 color2
    const oneThird = Math.floor(canvas.height / 3);

    // Top 1/3
    ctx.fillStyle = colorToRgbString(color1);
    ctx.fillRect(0, 0, canvas.width, oneThird);

    // Bottom 2/3
    ctx.fillStyle = colorToRgbString(color2);
    ctx.fillRect(0, oneThird, canvas.width, canvas.height - oneThird);
  } else {
    // All three colors are different - show in thirds
    const thirdH = Math.floor(canvas.height / 3);

    // Top third
    ctx.fillStyle = colorToRgbString(color1);
    ctx.fillRect(0, 0, canvas.width, thirdH);

    // Middle third
    ctx.fillStyle = colorToRgbString(color2);
    ctx.fillRect(0, thirdH, canvas.width, thirdH);

    // Bottom third
    ctx.fillStyle = colorToRgbString(color3);
    ctx.fillRect(0, thirdH * 2, canvas.width, canvas.height - thirdH * 2);
  }
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

export function fillCellWithFourColorsTriangles(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  colors: [Color, Color, Color, Color]
): void {
  // Draw 4 triangular wedges radiating from the center
  // colors[0] = top edge, colors[1] = right edge, colors[2] = bottom edge, colors[3] = left edge
  // Rotated counter-clockwise: top stays, right->bottom, bottom->left, left->right
  const centerX = Math.floor(canvas.width / 2);
  const centerY = Math.floor(canvas.height / 2);

  // Disable anti-aliasing for crisp edges
  ctx.imageSmoothingEnabled = false;

  // Clear any existing content
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Top triangle (color 0) - stays the same
  ctx.fillStyle = colorToRgbString(colors[0]);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(canvas.width, 0);
  ctx.lineTo(centerX, centerY);
  ctx.closePath();
  ctx.fill();

  // Right triangle - gets bottom edge color (color 2)
  ctx.fillStyle = colorToRgbString(colors[2]);
  ctx.beginPath();
  ctx.moveTo(canvas.width, 0);
  ctx.lineTo(canvas.width, canvas.height);
  ctx.lineTo(centerX, centerY);
  ctx.closePath();
  ctx.fill();

  // Bottom triangle - gets left edge color (color 3)
  ctx.fillStyle = colorToRgbString(colors[3]);
  ctx.beginPath();
  ctx.moveTo(canvas.width, canvas.height);
  ctx.lineTo(0, canvas.height);
  ctx.lineTo(centerX, centerY);
  ctx.closePath();
  ctx.fill();

  // Left triangle - gets right edge color (color 1)
  ctx.fillStyle = colorToRgbString(colors[1]);
  ctx.beginPath();
  ctx.moveTo(0, canvas.height);
  ctx.lineTo(0, 0);
  ctx.lineTo(centerX, centerY);
  ctx.closePath();
  ctx.fill();

  // Re-enable anti-aliasing
  ctx.imageSmoothingEnabled = true;
}

export function clearCanvas(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement
): void {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}
