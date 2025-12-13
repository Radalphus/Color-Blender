import { PaletteType } from '../types';

interface InstructionsProps {
  paletteType: PaletteType;
}

export function Instructions({ paletteType }: InstructionsProps) {
  return (
    <div className="instructions">
      <h3>How to Use:</h3>

      {paletteType === 'manual' ? (
        <>
          <h4>⚙️ Manual Palette Mode:</h4>
          <ol>
            <li>Upload an image and <strong>click</strong> to select a color</li>
            <li><strong>Fast click</strong> a cell to add up to 4 colors (1st click = color 1, 2nd = color 2, 3rd = color 3, 4th = color 4)</li>
            <li><strong>Click and hold (drag)</strong> on a cell (with 2+ colors) to blend them to their median value</li>
            <li><strong>Double-click</strong> a cell to clear it completely</li>
            <li>After blending or with 4 colors, adding a new color replaces all with blended + new color</li>
          </ol>
        </>
      ) : (
        <>
          <h4>✨ Aesthetic Palette Mode:</h4>
          <ol>
            <li>Upload an image and <strong>click</strong> to select a color</li>
            <li><strong>Fast click</strong> the 4 corner cells to add up to 4 colors each (same as Manual mode)</li>
            <li><strong>Click and hold (drag)</strong> on corners (with 2+ colors) to blend to median value</li>
            <li>Edge cells auto-fill ONLY when adjacent corners are fully blended (1 color each)</li>
            <li>Center cell auto-fills ONLY when all edges are fully blended (1 color each)</li>
            <li><strong>Double-click</strong> a cell to clear it</li>
            <li>Creates beautiful, harmonious color palettes with cascading blends!</li>
          </ol>
        </>
      )}

      <p className="tip-text"><strong>💡 Tip:</strong> All blending is permanent and saved to the canvas! Use Ctrl+Z/Ctrl+Y for undo/redo.</p>
    </div>
  );
}
