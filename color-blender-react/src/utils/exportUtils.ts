import { PaletteCell } from '../types';

export function exportPaletteAsImage(
  canvasRefs: (HTMLCanvasElement | null)[]
): void {
  const exportCanvas = document.createElement('canvas');
  const cellSize = 200;
  const gap = 10;
  const gridSize = 3;

  exportCanvas.width = (cellSize * gridSize) + (gap * (gridSize + 1));
  exportCanvas.height = (cellSize * gridSize) + (gap * (gridSize + 1));

  const exportCtx = exportCanvas.getContext('2d');
  if (!exportCtx) return;

  exportCtx.fillStyle = '#ffffff';
  exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

  canvasRefs.forEach((canvas, index) => {
    if (!canvas) return;

    const row = Math.floor(index / gridSize);
    const col = index % gridSize;
    const x = gap + (col * (cellSize + gap));
    const y = gap + (row * (cellSize + gap));

    exportCtx.drawImage(canvas, x, y, cellSize, cellSize);
  });

  exportCanvas.toBlob((blob) => {
    if (!blob) return;

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `color-palette-${Date.now()}.png`;
    a.click();
    URL.revokeObjectURL(url);
    alert('Palette exported successfully!');
  });
}

export function savePaletteAsJson(
  cells: PaletteCell[],
  canvasRefs: (HTMLCanvasElement | null)[]
): void {
  const paletteData = cells.map((cell, index) => {
    if (!cell.color1) return null;

    const canvas = canvasRefs[index];
    if (!canvas) return null;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return {
      color1: cell.color1,
      color2: cell.color2,
      color3: cell.color3,
      color4: cell.color4,
      hasAllFourColors: cell.hasAllFourColors,
      imageData: Array.from(imageData.data)
    };
  });

  const jsonData = JSON.stringify(paletteData);
  const blob = new Blob([jsonData], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `color-palette-${Date.now()}.json`;
  a.click();

  URL.revokeObjectURL(url);
  alert('Palette saved successfully!');
}
