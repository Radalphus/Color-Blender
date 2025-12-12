export function Instructions() {
  return (
    <div className="instructions">
      <h3>How to Use:</h3>

      <h4>⚙️ Manual Palette Mode:</h4>
      <ol>
        <li>Upload an image and hover over it to preview colors</li>
        <li><strong>Click</strong> the image to select a color</li>
        <li><strong>Fast click</strong> a cell to add colors (first click = color 1, second = color 2)</li>
        <li><strong>Click and hold (drag)</strong> on a cell (with 2 colors) to blend them together</li>
        <li><strong>Double-click</strong> a cell to clear it completely</li>
        <li>After blending, click to add a new color and continue blending</li>
      </ol>

      <h4>✨ Aesthetic Palette Mode:</h4>
      <ol>
        <li>Upload an image and hover over it to preview colors</li>
        <li><strong>Click</strong> ONLY the 4 corner cells to set colors</li>
        <li>Edge cells auto-fill with 2 colors from adjacent corners</li>
        <li>Center cell auto-fills with all 4 corner colors in a 2x2 grid</li>
        <li><strong>Click and hold (drag)</strong> on any cell to blend its colors together</li>
        <li><strong>Double-click</strong> a cell to clear it</li>
        <li>Creates beautiful, harmonious color palettes automatically!</li>
      </ol>

      <p><strong>💡 Tip:</strong> All blending is permanent and saved to the canvas! Use Ctrl+Z/Ctrl+Y for undo/redo.</p>
    </div>
  );
}
