import { Color, PaletteCell } from '../types';
import { getCellBlendColor, hexToColor } from '../utils/colorUtils';
import { Level } from './types';

/**
 * World 1. Each picture is built from named layers (sun, trees, boat, lanterns...)
 * whose colors fit the level's theme.
 *
 * Each recipe is a list of stages, mixed the way the mixing cell works:
 * blend the first stage's colors, then add the next stage's colors to that
 * result and blend again. Staging lets one color count for more than another.
 *
 * Recipes were chosen by a search over each picture's colors so that:
 *   - the target is reachable at exactly 100%
 *   - no single image color reaches 90%, so no level clears without mixing
 *   - simpler mixes top out under 97%, so 3 stars needs the real recipe
 *   - every color in a recipe is different and easy to find in the picture
 */
export const LEVELS: Level[] = [
  {
    id: '1-1', world: 1, number: 1, name: 'Dusty Orchard', seed: 11,
    scene: {
      sky: ['#f3d9c4', '#e8bfa6'], horizon: 11,
      layers: [
        { kind: 'sun', color: '#fff1d6', x: 23, y: 3, r: 2.2 },
        { kind: 'ridge', color: '#b3a580', min: 7, max: 10 },
        { kind: 'band', colors: ['#8a7a52', '#6e6040'], from: 13, to: 20 },
        { kind: 'trees', trunk: '#5a3f2a', leaves: '#7d8a5c', fruit: ['#c4566a', '#e39a5b'], xs: [4, 11, 18, 25], base: 15 },
        { kind: 'trees', trunk: '#5a3f2a', leaves: '#7d8a5c', fruit: ['#c4566a', '#e39a5b'], xs: [7, 14, 21, 28], base: 19 }
      ]
    },
    recipe: [['#e39a5b', '#8a7a52']]
  },
  {
    id: '1-2', world: 1, number: 2, name: 'Lagoon Haze', seed: 23,
    scene: {
      sky: ['#d6ecea', '#b4dcd8'], horizon: 10,
      layers: [
        { kind: 'sun', color: '#fbf6e2', x: 6, y: 3, r: 2 },
        { kind: 'ridge', color: '#5f9a8c', min: 7, max: 10 },
        { kind: 'band', colors: ['#58aeb4', '#2c6e7a'], from: 10, to: 16 },
        { kind: 'ripples', color: '#e8f6f2', from: 11, to: 15, count: 7 },
        { kind: 'band', colors: ['#e3c48a', '#c9a46a'], from: 16, to: 20 },
        { kind: 'palm', trunk: '#8a6a4a', leaves: '#3f7f5a', x: 23, base: 18 },
        { kind: 'boat', hull: '#e0614f', sail: '#f7f3e8', x: 8, y: 13 }
      ]
    },
    recipe: [['#8a6a4a', '#e0614f', '#c9a46a']]
  },
  {
    id: '1-3', world: 1, number: 3, name: 'Plum Dusk', seed: 37,
    scene: {
      sky: ['#3d2c5a', '#5a3d6e', '#8a4f72'], horizon: 12,
      layers: [
        { kind: 'stars', color: '#efe3ff', count: 9, maxRow: 6 },
        { kind: 'sun', color: '#e8735f', x: 15, y: 9, r: 2.6 },
        { kind: 'ridge', color: '#2e2648', min: 9, max: 12 },
        { kind: 'band', colors: ['#211b36', '#141026'], from: 15, to: 20 },
        { kind: 'trees', trunk: '#1a1328', leaves: '#4a2f5e', fruit: ['#a24d8c', '#e8a0c8'], xs: [5, 24], base: 17, size: 2.5 }
      ]
    },
    recipe: [['#efe3ff', '#e8735f', '#8a4f72']]
  },
  {
    id: '1-4', world: 1, number: 4, name: 'Rust Canyon', seed: 41,
    scene: {
      sky: ['#f6d7b0', '#efb98a'], horizon: 10,
      layers: [
        { kind: 'sun', color: '#fff0cf', x: 7, y: 3, r: 2 },
        { kind: 'ridge', color: '#c26a45', min: 5, max: 9, rough: 1.2 },
        { kind: 'ridge', color: '#9a4d35', min: 9, max: 12 },
        { kind: 'band', colors: ['#3b6e8a'], from: 14, to: 15 },
        { kind: 'band', colors: ['#d99a63', '#b97a4a'], from: 15, to: 20 },
        { kind: 'cactus', color: '#5f8f7a', flower: '#e8c06a', xs: [6, 22], base: 19 }
      ]
    },
    recipe: [['#f6d7b0', '#fff0cf', '#5f8f7a']]
  },
  {
    id: '1-5', world: 1, number: 5, name: 'Glacier', seed: 53,
    scene: {
      sky: ['#14203f', '#22355e', '#3b5a86'], horizon: 11,
      layers: [
        { kind: 'stars', color: '#e8f0ff', count: 8, maxRow: 5 },
        { kind: 'rainbow', colors: ['#5fe0a8', '#3fb3c0'], cx: 15, cy: 16, r: 14 },
        { kind: 'sun', color: '#f2f0e0', x: 25, y: 2, r: 1.6 },
        { kind: 'ridge', color: '#6f8fbf', min: 5, max: 9, rough: 3, cap: '#f4f8fc' },
        { kind: 'ridge', color: '#4a6799', min: 9, max: 11 },
        { kind: 'band', colors: ['#2f4f7e', '#243d66'], from: 12, to: 20 },
        { kind: 'ripples', color: '#8fb0d8', from: 13, to: 19, count: 6 },
        { kind: 'icebergs', color: '#e8f0f8', shade: '#a9c3e6', row: 15, xs: [14, 24] },
        { kind: 'rect', color: '#e8f0f8', x: 0, y: 17, w: 10, h: 3 },
        { kind: 'tent', color: '#f0a83a', door: '#ffe3a0', x: 4, base: 17 }
      ]
    },
    recipe: [['#14203f', '#f2f0e0', '#5fe0a8', '#22355e']]
  },
  {
    id: '1-6', world: 1, number: 6, name: 'Moss Temple', seed: 67,
    scene: {
      sky: ['#8ccbe0', '#c4e4dc'], horizon: 11,
      layers: [
        { kind: 'sun', color: '#fff3c0', x: 5, y: 3, r: 2 },
        { kind: 'ridge', color: '#6e8f45', min: 7, max: 10 },
        { kind: 'band', colors: ['#4c6b30', '#3a4a26'], from: 15, to: 20 },
        { kind: 'temple', stone: '#9a9682', moss: '#5c7a45', door: '#2a2a20', flame: '#e8a23a', x: 15, base: 15 },
        { kind: 'trees', trunk: '#4a3a26', leaves: '#3f6b2a', xs: [3, 27], base: 16 },
        { kind: 'flowers', stem: '#3a4a26', colors: ['#b24e3f', '#e07fb0'], from: 16, to: 20, count: 6 },
        { kind: 'rect', color: '#3aa0b0', x: 21, y: 17, w: 8, h: 2 }
      ]
    },
    recipe: [['#fff3c0', '#9a9682', '#e07fb0', '#b24e3f']]
  },
  {
    id: '1-7', world: 1, number: 7, name: 'Neon Rain', seed: 79,
    scene: {
      sky: ['#120c24', '#1d1438', '#2a1d4f'], horizon: 20,
      layers: [
        { kind: 'buildings', colors: ['#2b2f5e', '#1f2248'], windows: ['#3df0ff', '#ff9f1c', '#b6ff3d'], base: 17, minH: 6, maxH: 12 },
        { kind: 'rain', color: '#6a7ab0', count: 26, maxRow: 14 },
        { kind: 'rect', color: '#ff5fa2', x: 3, y: 8, w: 4, h: 2 },
        { kind: 'rect', color: '#8b5cff', x: 21, y: 7, w: 2, h: 4 },
        { kind: 'band', colors: ['#0b0a1a'], from: 17, to: 20 },
        { kind: 'ripples', color: '#ff5fa2', from: 18, to: 20, count: 3 },
        { kind: 'ripples', color: '#3df0ff', from: 18, to: 20, count: 3 }
      ]
    },
    recipe: [['#6a7ab0', '#2b2f5e'], ['#3df0ff']]
  },
  {
    id: '1-8', world: 1, number: 8, name: 'Coral Reef', seed: 83,
    scene: {
      sky: ['#a9e1ee', '#7fd0e6', '#4fb0c6'], horizon: 20,
      layers: [
        { kind: 'ripples', color: '#e0f7fb', from: 0, to: 3, count: 6 },
        { kind: 'ridge', color: '#2d6f80', min: 13, max: 16 },
        { kind: 'band', colors: ['#f0dcb0', '#e2c690'], from: 17, to: 20 },
        { kind: 'coral', colors: ['#ff5d73', '#e8957d', '#7a4fa0'], base: 18, count: 7 },
        { kind: 'fish', colors: ['#ffd166', '#ff8f40'], from: 4, to: 11, count: 5 }
      ]
    },
    recipe: [['#2d6f80', '#e8957d', '#ff5d73', '#7a4fa0']]
  },
  {
    id: '1-9', world: 1, number: 9, name: 'Autumn Mill', seed: 97,
    scene: {
      sky: ['#7fb8e0', '#c2e0f0'], horizon: 11,
      layers: [
        { kind: 'sun', color: '#fff3dd', x: 24, y: 3, r: 2 },
        { kind: 'ridge', color: '#b5763c', min: 8, max: 11 },
        { kind: 'band', colors: ['#c9a35a', '#6b4a2b'], from: 14, to: 20 },
        { kind: 'windmill', body: '#e8e0d0', roof: '#8a4f2a', blades: '#4f3a2a', door: '#4f3a2a', x: 9, base: 15 },
        { kind: 'trees', trunk: '#3a2a1a', leaves: '#d94f3a', xs: [19, 26], base: 16 },
        { kind: 'trees', trunk: '#3a2a1a', leaves: '#e8a33d', xs: [22], base: 18 }
      ]
    },
    recipe: [['#4f3a2a', '#c2e0f0'], ['#7fb8e0']]
  },
  {
    id: '1-10', world: 1, number: 10, name: 'Velvet Night', seed: 101,
    scene: {
      sky: ['#1f1a3a', '#2e2452'], horizon: 13,
      layers: [
        { kind: 'sun', color: '#e9e2ff', x: 24, y: 3, r: 2 },
        { kind: 'stars', color: '#fff4d6', count: 10, maxRow: 8 },
        { kind: 'ridge', color: '#3b2f63', min: 10, max: 13 },
        { kind: 'band', colors: ['#3a2240', '#2a1830'], from: 16, to: 20 },
        { kind: 'lanterns', line: '#14101f', colors: ['#ff7aa8', '#ffcf6b', '#5fd3c6', '#9a7bff'], y: 7 }
      ]
    },
    recipe: [['#1f1a3a', '#fff4d6', '#14101f'], ['#5fd3c6']]
  },
  {
    id: '1-11', world: 1, number: 11, name: 'Tea Garden', seed: 113,
    scene: {
      sky: ['#f0e6c8', '#e0cfa0'], horizon: 10,
      layers: [
        { kind: 'sun', color: '#fffaf0', x: 25, y: 3, r: 2 },
        { kind: 'ridge', color: '#7a9a50', min: 7, max: 10 },
        { kind: 'band', colors: ['#4f7038', '#5f8044'], from: 12, to: 16 },
        { kind: 'band', colors: ['#a8743a'], from: 16, to: 20 },
        { kind: 'rect', color: '#3f6fc0', x: 17, y: 16, w: 10, h: 3 },
        { kind: 'rect', color: '#e04f5f', x: 18, y: 17, w: 3, h: 1 },
        { kind: 'rect', color: '#f0c830', x: 23, y: 16, w: 3, h: 1 },
        { kind: 'rect', color: '#e04f5f', x: 24, y: 18, w: 2, h: 1 },
        { kind: 'rect', color: '#e8dcc0', x: 4, y: 12, w: 7, h: 4 },
        { kind: 'rect', color: '#8a3a3a', x: 3, y: 11, w: 9, h: 1 },
        { kind: 'rect', color: '#8a3a3a', x: 4, y: 10, w: 7, h: 1 },
        { kind: 'rect', color: '#5a3a28', x: 7, y: 14, w: 1, h: 2 },
        { kind: 'trees', trunk: '#5a3a28', leaves: '#9a4fb0', xs: [14], base: 14, size: 2.5 }
      ]
    },
    recipe: [['#f0e6c8', '#fffaf0', '#3f6fc0'], ['#9a4fb0']]
  },
  {
    id: '1-12', world: 1, number: 12, name: 'Prism Peak', seed: 127,
    scene: {
      sky: ['#ff8f8f', '#ffb38a', '#ffd98a'], horizon: 12,
      layers: [
        { kind: 'sun', color: '#fff6cc', x: 26, y: 8, r: 2 },
        { kind: 'rainbow', colors: ['#ff6fd8', '#6fd6ff', '#7aff9a'], cx: 11, cy: 12, r: 9 },
        { kind: 'ridge', color: '#8a6fb0', min: 3, max: 11, rough: 3.5, cap: '#f4eaff' },
        { kind: 'ridge', color: '#5a4a85', min: 11, max: 14 },
        { kind: 'band', colors: ['#2f2a55', '#1f1b3a'], from: 16, to: 20 }
      ]
    },
    recipe: [['#7aff9a', '#8a6fb0'], ['#5a4a85'], ['#6fd6ff']]
  }
];

export function getLevel(id: string): { level: Level; index: number } | null {
  const index = LEVELS.findIndex((level) => level.id === id);
  return index === -1 ? null : { level: LEVELS[index], index };
}

const cellOf = (colors: Color[]): PaletteCell => ({
  color1: colors[0] ?? null,
  color2: colors[1] ?? null,
  color3: colors[2] ?? null,
  color4: colors[3] ?? null,
  hasAllFourColors: colors.length === 4
});

/** Mix the recipe exactly the way the mixing cell does, stage by stage */
export function targetColor(level: Level): Color {
  let mixed: Color | null = null;
  for (const stage of level.recipe) {
    const colors = stage.map(hexToColor);
    mixed = getCellBlendColor(cellOf(mixed ? [mixed, ...colors] : colors))!;
  }
  return mixed!;
}

export function recipeColorCount(level: Level): number {
  return level.recipe.reduce((sum, stage) => sum + stage.length, 0);
}

/** "3 colors", or "2 steps · 4 colors" for staged recipes */
export function describeRecipe(level: Level): string {
  const colors = `${recipeColorCount(level)} colors`;
  return level.recipe.length > 1 ? `${level.recipe.length} steps · ${colors}` : colors;
}
