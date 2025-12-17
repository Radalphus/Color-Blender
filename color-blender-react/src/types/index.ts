export interface Color {
  r: number;
  g: number;
  b: number;
}

export interface PaletteCell {
  color1: Color | null;
  color2: Color | null;
  color3?: Color | null;
  color4?: Color | null;
  hasAllFourColors?: boolean;
}

export type PaletteType = 'manual' | 'aesthetic';
export type Mode = 'picking' | 'blending';
export type GridSize = 3 | 4 | 5;

// Legacy constants for 3x3 grid (kept for backwards compatibility)
export const AESTHETIC_CORNERS = [0, 2, 6, 8] as const;
export const AESTHETIC_EDGES = {
  1: [0, 2],
  3: [0, 6],
  5: [2, 8],
  7: [6, 8]
} as const;
export const AESTHETIC_CENTER = 4;

// Grid configuration interface
export interface GridConfig {
  totalCells: number;
  corners: number[];
  edges: Record<number, [number, number]>;
  inner: number[];
  canvasSize: number;
}

// Calculate corner indices for any grid size
function getCorners(size: GridSize): number[] {
  return [
    0,                    // Top-left
    size - 1,             // Top-right
    size * (size - 1),    // Bottom-left
    size * size - 1       // Bottom-right
  ];
}

// Calculate edge indices and their adjacent corners for any grid size
function getEdges(size: GridSize): Record<number, [number, number]> {
  const edges: Record<number, [number, number]> = {};
  const corners = getCorners(size);

  // Top edge (between top-left and top-right corners)
  for (let i = 1; i < size - 1; i++) {
    edges[i] = [corners[0], corners[1]]; // 0 and size-1
  }

  // Bottom edge (between bottom-left and bottom-right corners)
  for (let i = 1; i < size - 1; i++) {
    edges[size * (size - 1) + i] = [corners[2], corners[3]]; // size*(size-1) and size*size-1
  }

  // Left edge (between top-left and bottom-left corners)
  for (let i = 1; i < size - 1; i++) {
    edges[i * size] = [corners[0], corners[2]]; // 0 and size*(size-1)
  }

  // Right edge (between top-right and bottom-right corners)
  for (let i = 1; i < size - 1; i++) {
    edges[i * size + (size - 1)] = [corners[1], corners[3]]; // size-1 and size*size-1
  }

  return edges;
}

// Calculate inner (non-corner, non-edge) indices for any grid size
function getInner(size: GridSize): number[] {
  const inner: number[] = [];
  const corners = getCorners(size);
  const edges = getEdges(size);

  for (let i = 0; i < size * size; i++) {
    if (!corners.includes(i) && !edges.hasOwnProperty(i)) {
      inner.push(i);
    }
  }

  return inner;
}

// Get canvas size based on grid size (to maintain same total container size)
function getCanvasSize(size: GridSize): number {
  return size === 3 ? 200 : size === 4 ? 157 : 126;
}

// Helper function to determine edge orientation
export function getEdgeOrientation(index: number, size: GridSize): 'top' | 'bottom' | 'left' | 'right' | null {
  // Top edge
  if (index > 0 && index < size - 1) {
    return 'top';
  }

  // Bottom edge
  if (index > size * (size - 1) && index < size * size - 1) {
    return 'bottom';
  }

  // Left edge
  if (index % size === 0 && index > 0 && index < size * (size - 1)) {
    return 'left';
  }

  // Right edge
  if (index % size === size - 1 && index > size - 1 && index < size * size - 1) {
    return 'right';
  }

  return null;
}

// Main configuration function - returns all grid-related values
export function getGridConfig(size: GridSize): GridConfig {
  return {
    totalCells: size * size,
    corners: getCorners(size),
    edges: getEdges(size),
    inner: getInner(size),
    canvasSize: getCanvasSize(size)
  };
}
