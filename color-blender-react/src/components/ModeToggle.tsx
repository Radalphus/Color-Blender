import { Mode, PaletteType } from '../types';

interface ModeToggleProps {
  mode: Mode;
  paletteType: PaletteType;
  onModeChange: (mode: Mode) => void;
  onPaletteTypeChange: (type: PaletteType) => void;
}

export function ModeToggle({
  mode,
  paletteType,
  onModeChange,
  onPaletteTypeChange
}: ModeToggleProps) {
  return (
    <>
      <div className="palette-type-toggle">
        <button
          className={`palette-type-btn ${paletteType === 'manual' ? 'active' : ''}`}
          onClick={() => onPaletteTypeChange('manual')}
        >
          ⚙️ Manual Palette
        </button>
        <button
          className={`palette-type-btn ${paletteType === 'aesthetic' ? 'active' : ''}`}
          onClick={() => onPaletteTypeChange('aesthetic')}
        >
          ✨ Aesthetic Palette
        </button>
      </div>
      <div className="mode-toggle">
        <button
          className={`mode-btn ${mode === 'picking' ? 'active' : ''}`}
          onClick={() => onModeChange('picking')}
        >
          🎨 Color Picking Mode
        </button>
        <button
          className={`mode-btn ${mode === 'blending' ? 'active' : ''}`}
          onClick={() => onModeChange('blending')}
        >
          🖌️ Blending Mode
        </button>
      </div>
    </>
  );
}
