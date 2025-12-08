export function Instructions() {
  return (
    <div className="instructions">
      <h3>How to Use:</h3>

      <h4>⚙️ Manual Palette Mode:</h4>
      <ol>
        <li>Upload an image and use the eyedropper to pick colors</li>
        <li><strong>Color Picking Mode:</strong> Click a cell once for color 1, twice for color 2</li>
        <li><strong>Blending Mode:</strong> Drag to manually mix the two colors like paint</li>
      </ol>

      <h4>✨ Aesthetic Palette Mode:</h4>
      <ol>
        <li>Upload an image and use the eyedropper to pick colors</li>
        <li><strong>Color Picking Mode:</strong> Click ONLY the 4 corner cells to set colors</li>
        <li>Edge cells auto-fill with 2 colors from adjacent corners</li>
        <li>Center cell auto-fills with all 4 corner colors in a 2x2 grid</li>
        <li><strong>Blending Mode:</strong> Drag on ANY cell to blend its colors together</li>
        <li>Creates beautiful, harmonious color palettes automatically!</li>
      </ol>

      <p><strong>💡 Tip:</strong> All blending is permanent and saved to the canvas!</p>
    </div>
  );
}
