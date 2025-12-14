import { useState, useCallback } from 'react';
import { Color, PaletteType } from './types';
import { ImageUploader } from './components/ImageUploader';
import { PaletteGrid } from './components/PaletteGrid';
import { Instructions } from './components/Instructions';
import { ColorHistory } from './components/ColorHistory';
import './App.css';

function App() {
  const [selectedColor, setSelectedColor] = useState<Color | null>(null);
  const [paletteType, setPaletteType] = useState<PaletteType>('manual');
  const [nightMode, setNightMode] = useState<boolean>(false);
  const [colorHistory, setColorHistory] = useState<Color[]>([]);
  const [savedColors, setSavedColors] = useState<Color[]>([]);

  const addToHistory = useCallback((color: Color) => {
    const colorTolerance = 3; // Colors within 3 RGB units are considered the same

    setColorHistory(prev => {
      // Check if a similar color already exists anywhere in history
      const exists = prev.some(c => {
        const diffR = Math.abs(c.r - color.r);
        const diffG = Math.abs(c.g - color.g);
        const diffB = Math.abs(c.b - color.b);
        return diffR <= colorTolerance && diffG <= colorTolerance && diffB <= colorTolerance;
      });

      if (exists) {
        // Color already exists (or is very similar), don't add it again
        return prev;
      }

      // Add to beginning and keep only last 10
      const newHistory = [color, ...prev];
      return newHistory.slice(0, 10);
    });
  }, []);

  const handleColorPicked = useCallback((color: Color) => {
    setSelectedColor(color);
    addToHistory(color);
  }, [addToHistory]);

  const handleSaveColor = useCallback((color: Color) => {
    const colorTolerance = 3;

    setSavedColors(prev => {
      // Check if color already exists in saved colors
      const exists = prev.some(c => {
        const diffR = Math.abs(c.r - color.r);
        const diffG = Math.abs(c.g - color.g);
        const diffB = Math.abs(c.b - color.b);
        return diffR <= colorTolerance && diffG <= colorTolerance && diffB <= colorTolerance;
      });

      if (exists) {
        return prev;
      }

      // Add to saved colors (no limit)
      return [...prev, color];
    });
  }, []);

  const handleRemoveSavedColor = useCallback((index: number) => {
    setSavedColors(prev => prev.filter((_, i) => i !== index));
  }, []);

  return (
    <div className={`container ${nightMode ? 'night-mode' : ''}`}>
      <header>
        <div className="header-content">
          <div>
            <h1>Color Blender</h1>
            <p>Upload an image, pick colors, and blend them on your palette</p>
          </div>
          <button
            className="night-mode-toggle"
            onClick={() => setNightMode(!nightMode)}
            title={nightMode ? 'Switch to Day Mode' : 'Switch to Night Mode'}
          >
            {nightMode ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      <div className="main-content">
        <ImageUploader
          onColorPicked={handleColorPicked}
          selectedColor={selectedColor}
        />

        <div className="grid-section-wrapper">
          <div className="palette-type-toggle">
            <button
              className={`palette-type-btn ${paletteType === 'manual' ? 'active' : ''}`}
              onClick={() => setPaletteType('manual')}
            >
              ⚙️ Manual Palette
            </button>
            <button
              className={`palette-type-btn ${paletteType === 'aesthetic' ? 'active' : ''}`}
              onClick={() => setPaletteType('aesthetic')}
            >
              ✨ Aesthetic Palette
            </button>
          </div>
          <PaletteGrid
            selectedColor={selectedColor}
            paletteType={paletteType}
            onBlendedColorCreated={addToHistory}
          />
        </div>
      </div>

      <ColorHistory
        colors={colorHistory}
        savedColors={savedColors}
        onColorSelect={setSelectedColor}
        onSaveColor={handleSaveColor}
        onRemoveSavedColor={handleRemoveSavedColor}
      />

      <Instructions paletteType={paletteType} />
    </div>
  );
}

export default App;
