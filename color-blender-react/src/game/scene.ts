import { Scene, SceneLayer } from './types';

/**
 * Pixel-art scenes drawn from a level's layer list, back to front.
 * Every layer is a named thing (sun, trees, boat, lanterns...) with its own colors,
 * so each color in a picture belongs to something you can point at.
 * Everything is whole, axis-aligned blocks with no smoothing, so every pixel the
 * eyedropper can land on is exactly one of the scene's colors.
 */
export const SCENE_COLS = 30;
export const SCENE_ROWS = 20;
export const SCENE_PIXEL = 16;
export const SCENE_WIDTH = SCENE_COLS * SCENE_PIXEL;
export const SCENE_HEIGHT = SCENE_ROWS * SCENE_PIXEL;

// Small deterministic PRNG so each level always draws the same picture
function mulberry32(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

class Canvas {
  readonly grid: string[][];

  constructor(fill: string) {
    this.grid = Array.from({ length: SCENE_ROWS }, () => Array<string>(SCENE_COLS).fill(fill));
  }

  set(x: number, y: number, color: string) {
    const cx = Math.round(x);
    const cy = Math.round(y);
    if (cx >= 0 && cx < SCENE_COLS && cy >= 0 && cy < SCENE_ROWS) this.grid[cy][cx] = color;
  }

  get(x: number, y: number): string | undefined {
    return this.grid[y]?.[x];
  }

  rect(x: number, y: number, w: number, h: number, color: string) {
    for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) this.set(x + dx, y + dy, color);
  }

  disc(cx: number, cy: number, r: number, color: string, maxRow = SCENE_ROWS) {
    for (let y = Math.floor(cy - r); y <= cy + r && y < maxRow; y++) {
      for (let x = Math.floor(cx - r); x <= cx + r; x++) {
        if (Math.hypot(x - cx, y - cy) <= r) this.set(x, y, color);
      }
    }
  }

  /** Horizontal bands with a checkerboard dither on each edge */
  bands(colors: string[], from: number, to: number) {
    const rows = to - from;
    for (let y = from; y < to; y++) {
      const band = Math.min(colors.length - 1, Math.floor(((y - from) / rows) * colors.length));
      for (let x = 0; x < SCENE_COLS; x++) this.set(x, y, colors[band]);
    }
    for (let b = 1; b < colors.length; b++) {
      const y = from + Math.floor((b * rows) / colors.length);
      for (let x = 0; x < SCENE_COLS; x++) if ((x + y) % 2 === 0) this.set(x, y, colors[b - 1]);
    }
  }
}

function drawLayer(c: Canvas, layer: SceneLayer, rand: () => number, skyColors: Set<string>) {
  const pick = <T,>(list: T[], i: number) => list[i % list.length];
  const randInt = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1));
  const isSky = (x: number, y: number) => skyColors.has(c.get(x, y) ?? '');

  switch (layer.kind) {
    case 'sun':
      c.disc(layer.x, layer.y, layer.r, layer.color);
      return;

    case 'band':
      c.bands(layer.colors, layer.from, layer.to);
      return;

    case 'stars': {
      for (let placed = 0, tries = 0; placed < layer.count && tries < 400; tries++) {
        const x = randInt(0, SCENE_COLS - 1);
        const y = randInt(0, layer.maxRow);
        if (!isSky(x, y)) continue;
        c.set(x, y, layer.color);
        placed++;
      }
      return;
    }

    case 'rainbow': {
      layer.colors.forEach((color, i) => {
        const radius = layer.r - i;
        for (let y = 0; y < layer.cy; y++) {
          for (let x = 0; x < SCENE_COLS; x++) {
            if (Math.abs(Math.hypot(x - layer.cx, y - layer.cy) - radius) < 0.55 && isSky(x, y)) c.set(x, y, color);
          }
        }
      });
      return;
    }

    case 'ridge': {
      let height = layer.min + rand() * (layer.max - layer.min);
      const capLine = layer.min + (layer.max - layer.min) * 0.45;
      for (let x = 0; x < SCENE_COLS; x++) {
        height = Math.min(layer.max, Math.max(layer.min, height + (rand() - 0.5) * (layer.rough ?? 2.4)));
        const top = Math.round(height);
        for (let y = top; y < SCENE_ROWS; y++) c.set(x, y, layer.color);
        if (layer.cap && top <= capLine) {
          c.set(x, top, layer.cap);
          if (top + 1 <= capLine) c.set(x, top + 1, layer.cap);
        }
      }
      return;
    }

    case 'ripples': {
      for (let n = 0; n < layer.count; n++) {
        const x = randInt(0, SCENE_COLS - 3);
        const y = randInt(layer.from, layer.to - 1);
        c.rect(x, y, randInt(2, 3), 1, layer.color);
      }
      return;
    }

    case 'rain': {
      for (let n = 0, tries = 0; n < layer.count && tries < 400; tries++) {
        const x = randInt(0, SCENE_COLS - 1);
        const y = randInt(0, layer.maxRow - 1);
        if (!isSky(x, y) || !isSky(x, y + 1)) continue;
        c.set(x, y, layer.color);
        c.set(x, y + 1, layer.color);
        n++;
      }
      return;
    }

    case 'trees': {
      const size = layer.size ?? 2;
      layer.xs.forEach((x, i) => {
        c.rect(x, layer.base - 2, 1, 2, layer.trunk);
        const cy = layer.base - 2 - size;
        c.disc(x, cy, size + 0.4, layer.leaves);
        (layer.fruit ?? []).forEach((fruit, f) => {
          // two pieces of each fruit color, tucked inside the canopy
          for (let k = 0; k < 2; k++) {
            const angle = (i * 2.1 + f * 1.7 + k * 3.1) % (Math.PI * 2);
            c.set(x + Math.cos(angle) * size * 0.75, cy + Math.sin(angle) * size * 0.6, fruit);
          }
        });
      });
      return;
    }

    case 'palm': {
      const { x, base } = layer;
      for (let k = 0; k < 6; k++) c.set(x + (k > 3 ? 1 : 0), base - 1 - k, layer.trunk);
      const top = base - 7;
      const crown = x + 1;
      c.rect(crown - 3, top, 7, 1, layer.leaves);
      [[-4, 1], [-3, 1], [3, 1], [4, 1], [-4, 2], [4, 2], [-1, -1], [1, -1], [0, -1]].forEach(([dx, dy]) =>
        c.set(crown + dx, top + dy, layer.leaves)
      );
      return;
    }

    case 'flowers': {
      for (let n = 0; n < layer.count; n++) {
        const x = randInt(1, SCENE_COLS - 2);
        const y = randInt(layer.from + 1, layer.to - 1);
        const color = pick(layer.colors, n);
        c.set(x, y, layer.stem);
        c.rect(x - 1, y - 1, 3, 1, color);
      }
      return;
    }

    case 'buildings': {
      let x = 0;
      let n = 0;
      while (x < SCENE_COLS) {
        const w = randInt(3, 5);
        const h = randInt(layer.minH, layer.maxH);
        const color = pick(layer.colors, n);
        c.rect(x, layer.base - h, w, h, color);
        for (let wy = layer.base - h + 1; wy < layer.base - 1; wy += 2) {
          for (let wx = x + 1; wx < x + w - 1; wx += 2) {
            if (rand() < 0.55) c.set(wx, wy, pick(layer.windows, randInt(0, layer.windows.length - 1)));
          }
        }
        x += w;
        n++;
      }
      return;
    }

    case 'rect':
      c.rect(layer.x, layer.y, layer.w, layer.h, layer.color);
      return;

    case 'temple': {
      const { x, base } = layer;
      for (let step = 0; step < 5; step++) {
        const w = 13 - step * 2;
        const y = base - 2 - step * 2;
        c.rect(x - Math.floor(w / 2), y, w, 2, layer.stone);
        // moss creeping over each step's edges
        c.set(x - Math.floor(w / 2), y, layer.moss);
        c.set(x + Math.floor(w / 2), y, layer.moss);
        if (step % 2 === 0) c.set(x - Math.floor(w / 2) + 2, y, layer.moss);
      }
      c.rect(x - 1, base - 4, 2, 4, layer.door);
      c.rect(x - 1, base - 12, 2, 2, layer.flame);
      return;
    }

    case 'windmill': {
      const { x, base } = layer;
      c.rect(x - 1, base - 7, 3, 7, layer.body);
      c.rect(x - 2, base - 3, 5, 3, layer.body);
      c.rect(x, base - 2, 1, 2, layer.door);
      c.rect(x - 1, base - 9, 3, 2, layer.roof);
      c.set(x, base - 10, layer.roof);
      for (let k = 1; k <= 4; k++) {
        c.set(x - k, base - 8 - k, layer.blades);
        c.set(x + k, base - 8 - k, layer.blades);
        c.set(x - k, base - 8 + k, layer.blades);
        c.set(x + k, base - 8 + k, layer.blades);
      }
      return;
    }

    case 'boat': {
      const { x, y } = layer;
      c.rect(x, y, 6, 1, layer.hull);
      c.rect(x + 1, y + 1, 4, 1, layer.hull);
      c.rect(x + 2, y - 4, 1, 4, layer.sail);
      c.rect(x + 3, y - 3, 1, 3, layer.sail);
      c.set(x + 4, y - 1, layer.sail);
      return;
    }

    case 'lanterns': {
      for (let x = 0; x < SCENE_COLS; x++) c.set(x, layer.y + (Math.abs(x - SCENE_COLS / 2) < 6 ? 1 : 0), layer.line);
      let n = 0;
      for (let x = 2; x < SCENE_COLS - 1; x += 4) {
        const top = layer.y + (Math.abs(x - SCENE_COLS / 2) < 6 ? 2 : 1);
        c.rect(x, top, 2, 2, pick(layer.colors, n++));
      }
      return;
    }

    case 'coral': {
      for (let n = 0; n < layer.count; n++) {
        const x = randInt(1, SCENE_COLS - 3);
        const h = randInt(3, 5);
        const color = pick(layer.colors, n);
        c.rect(x, layer.base - h, 1, h, color);
        c.rect(x - 1, layer.base - h + 1, 1, 2, color);
        c.rect(x + 1, layer.base - h + 2, 1, 2, color);
      }
      return;
    }

    case 'fish': {
      for (let n = 0; n < layer.count; n++) {
        const x = randInt(1, SCENE_COLS - 4);
        const y = randInt(layer.from, layer.to - 1);
        const color = pick(layer.colors, n);
        c.rect(x, y, 2, 1, color);
        c.set(x + 2, y - 1, color);
        c.set(x + 2, y + 1, color);
      }
      return;
    }

    case 'cactus': {
      layer.xs.forEach((x) => {
        c.rect(x, layer.base - 5, 1, 5, layer.color);
        c.rect(x - 1, layer.base - 3, 1, 1, layer.color);
        c.rect(x - 2, layer.base - 5, 1, 3, layer.color);
        c.rect(x + 1, layer.base - 4, 1, 1, layer.color);
        c.rect(x + 2, layer.base - 6, 1, 3, layer.color);
        if (layer.flower) {
          c.set(x, layer.base - 6, layer.flower);
          c.set(x + 2, layer.base - 7, layer.flower);
        }
      });
      return;
    }

    case 'icebergs': {
      layer.xs.forEach((x) => {
        for (let k = 0; k < 4; k++) {
          const w = 7 - k * 2;
          c.rect(x - Math.floor(w / 2), layer.row - k, w, 1, layer.color);
          c.set(x + Math.floor(w / 2), layer.row - k, layer.shade);
        }
        c.rect(x - 3, layer.row + 1, 7, 1, layer.shade);
      });
      return;
    }

    case 'tent': {
      const { x, base } = layer;
      for (let k = 0; k < 3; k++) c.rect(x - k, base - 3 + k, k * 2 + 1, 1, layer.color);
      c.set(x, base - 1, layer.door);
      return;
    }
  }
}

export function buildSceneGrid(scene: Scene, seed: number): string[][] {
  const rand = mulberry32(seed);
  const canvas = new Canvas(scene.sky[scene.sky.length - 1]);
  canvas.bands(scene.sky, 0, scene.horizon);
  const skyColors = new Set(scene.sky);
  scene.layers.forEach((layer) => drawLayer(canvas, layer, rand, skyColors));
  return canvas.grid;
}

/** Every color a scene uses, in drawing order */
export function sceneColors(scene: Scene): string[] {
  const colors = new Set<string>(scene.sky);
  scene.layers.forEach((layer) => {
    Object.entries(layer).forEach(([key, value]) => {
      if (key === 'kind') return;
      if (typeof value === 'string' && value.startsWith('#')) colors.add(value);
      if (Array.isArray(value)) value.forEach((v) => typeof v === 'string' && v.startsWith('#') && colors.add(v));
    });
  });
  return [...colors];
}

export function drawScene(canvas: HTMLCanvasElement, scene: Scene, seed: number): void {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return;
  canvas.width = SCENE_WIDTH;
  canvas.height = SCENE_HEIGHT;
  ctx.imageSmoothingEnabled = false;

  buildSceneGrid(scene, seed).forEach((row, y) => {
    row.forEach((color, x) => {
      ctx.fillStyle = color;
      ctx.fillRect(x * SCENE_PIXEL, y * SCENE_PIXEL, SCENE_PIXEL, SCENE_PIXEL);
    });
  });
}
