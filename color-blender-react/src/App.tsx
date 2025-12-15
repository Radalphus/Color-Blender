import { useState, useCallback, useEffect } from 'react';
import { Color, PaletteType, GridSize } from './types';
import { ImageUploader } from './components/ImageUploader';
import { PaletteGrid } from './components/PaletteGrid';
import { GridSizeSelector } from './components/GridSizeSelector';
import { Instructions } from './components/Instructions';
import { ColorHistory } from './components/ColorHistory';
import { useColorHistory } from './hooks/useColorHistory';
import { useSavedColors } from './hooks/useSavedColors';
import { compareColors } from './utils/colorUtils';
import './App.css';

function App() {
  const [selectedColor, setSelectedColor] = useState<Color | null>(null);
  const [paletteType, setPaletteType] = useState<PaletteType>('manual');
  const [nightMode, setNightMode] = useState<boolean>(false);

  // Grid size state with localStorage persistence
  const [gridSize, setGridSize] = useState<GridSize>(() => {
    const saved = localStorage.getItem('colorBlenderGridSize');
    return (saved ? parseInt(saved) as GridSize : 3);
  });

  // Save grid size to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('colorBlenderGridSize', gridSize.toString());
  }, [gridSize]);

  // Use custom hooks for color management
  const { colorHistory, addToHistory } = useColorHistory();
  const { savedColors, saveColor, removeSavedColor } = useSavedColors();
  const [autoBlendedColors, setAutoBlendedColors] = useState<Color[]>([]);

  const handleColorPicked = useCallback((color: Color) => {
    setSelectedColor(color);
    addToHistory(color);
  }, [addToHistory]);

  const handleAutoBlendCompleted = useCallback((colors: Color[]) => {
    // Deduplicate colors using tolerance-based comparison
    const uniqueColors: Color[] = [];

    colors.forEach(color => {
      const isDuplicate = uniqueColors.some(existing => compareColors(existing, color));
      if (!isDuplicate) {
        uniqueColors.push(color);
      }
    });

    setAutoBlendedColors(uniqueColors);
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
          <GridSizeSelector
            gridSize={gridSize}
            onGridSizeChange={setGridSize}
          />
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
            gridSize={gridSize}
            selectedColor={selectedColor}
            paletteType={paletteType}
            onBlendedColorCreated={addToHistory}
            onAutoBlendCompleted={handleAutoBlendCompleted}
          />
        </div>
      </div>

      <ColorHistory
        colors={colorHistory}
        savedColors={savedColors}
        autoBlendedColors={autoBlendedColors}
        onColorSelect={setSelectedColor}
        onSaveColor={saveColor}
        onRemoveSavedColor={removeSavedColor}
      />

      <Instructions paletteType={paletteType} />
    </div>
  );
}

export default App;
