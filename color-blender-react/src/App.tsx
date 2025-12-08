import { useState } from 'react';
import { Color, PaletteType } from './types';
import { ImageUploader } from './components/ImageUploader';
import { PaletteGrid } from './components/PaletteGrid';
import { Instructions } from './components/Instructions';
import './App.css';

function App() {
  const [selectedColor, setSelectedColor] = useState<Color | null>(null);
  const [paletteType, setPaletteType] = useState<PaletteType>('manual');

  return (
    <div className="container">
      <header>
        <h1>Color Blender</h1>
        <p>Upload an image, pick colors, and blend them on your palette</p>
      </header>

      <div className="main-content">
        <ImageUploader
          onColorPicked={setSelectedColor}
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
          />
        </div>
      </div>

      <Instructions />
    </div>
  );
}

export default App;
