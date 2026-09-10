import { Color, PaletteCell } from '../types';
import { colorToRgbString, getCellBlendColor } from './colorUtils';

export function drawBlendedColor(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cell: PaletteCell,
  brushSize: number = 50
): void {
  if (!cell.color1 || !cell.color2) return;

  // Median of all the cell's colors (weighted for 4x4/5x5 aesthetic inner cells)
  const targetColor = getCellBlendColor(cell);
  if (!targetColor) return;

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
  // Draw 4 triangular wedges radiating from the center, one per side of the cell.
  // colors = [top, bottom, left, right]; each wedge faces the edge its color came from.
  const [top, bottom, left, right] = colors;

  const centerX = Math.floor(canvas.width / 2);
  const centerY = Math.floor(canvas.height / 2);
  const width = Math.floor(canvas.width);
  const height = Math.floor(canvas.height);

  // Keep anti-aliasing off (and leave it off) so wedge seams don't show white lines
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, width, height);

  const wedges: Array<[Color, number, number, number, number]> = [
    [top, 0, 0, width, 0],
    [right, width, 0, width, height],
    [bottom, width, height, 0, height],
    [left, 0, height, 0, 0]
  ];

  wedges.forEach(([color, x1, y1, x2, y2]) => {
    ctx.fillStyle = colorToRgbString(color);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(centerX, centerY);
    ctx.closePath();
    ctx.fill();
  });
}

export function clearCanvas(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement
): void {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}
