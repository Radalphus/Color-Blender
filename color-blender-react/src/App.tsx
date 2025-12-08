import { useState } from 'react';
import { Color, Mode, PaletteType } from './types';
import { ImageUploader } from './components/ImageUploader';
import { PaletteGrid } from './components/PaletteGrid';
import { ModeToggle } from './components/ModeToggle';
import { Instructions } from './components/Instructions';
import './App.css';

function App() {
  const [selectedColor, setSelectedColor] = useState<Color | null>(null);
  const [mode, setMode] = useState<Mode>('picking');
  const [paletteType, setPaletteType] = useState<PaletteType>('manual');

  const handlePaletteTypeChange = (newType: PaletteType) => {
    setPaletteType(newType);
  };

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
          <ModeToggle
            mode={mode}
            paletteType={paletteType}
            onModeChange={setMode}
            onPaletteTypeChange={handlePaletteTypeChange}
          />
          <PaletteGrid
            selectedColor={selectedColor}
            mode={mode}
            paletteType={paletteType}
          />
        </div>
      </div>

      <Instructions />
    </div>
  );
}

export default App;
