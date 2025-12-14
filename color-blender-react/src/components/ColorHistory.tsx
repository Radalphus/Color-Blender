import { Color } from '../types';
import { colorToRgbString } from '../utils/colorUtils';

interface ColorHistoryProps {
  colors: Color[];
  onColorSelect: (color: Color) => void;
}

export function ColorHistory({ colors, onColorSelect }: ColorHistoryProps) {
  return (
    <div className="color-history">
      <h3>Recent Colors {colors.length > 0 && `(${colors.length})`}</h3>
      <div className="color-history-grid">
        {colors.length === 0 ? (
          <div className="color-history-empty">
            Pick or blend colors to see them here
          </div>
        ) : (
          colors.map((color, index) => (
            <button
              key={`${color.r}-${color.g}-${color.b}-${index}`}
              className="color-history-item"
              style={{ backgroundColor: colorToRgbString(color) }}
              onClick={() => onColorSelect(color)}
              title={`RGB(${color.r}, ${color.g}, ${color.b})`}
            />
          ))
        )}
      </div>
    </div>
  );
}
