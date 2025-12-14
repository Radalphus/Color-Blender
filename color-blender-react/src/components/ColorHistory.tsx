import { useState } from 'react';
import { Color } from '../types';
import { colorToRgbString, getColorName } from '../utils/colorUtils';

interface ColorHistoryProps {
  colors: Color[];
  savedColors: Color[];
  autoBlendedColors: Color[];
  onColorSelect: (color: Color) => void;
  onSaveColor: (color: Color) => void;
  onRemoveSavedColor: (index: number) => void;
}

type TabType = 'recent' | 'saved' | 'autoblended';

export function ColorHistory({
  colors,
  savedColors,
  autoBlendedColors,
  onColorSelect,
  onSaveColor,
  onRemoveSavedColor
}: ColorHistoryProps) {
  const [activeTab, setActiveTab] = useState<TabType>('recent');

  return (
    <div className="color-history">
      <div className="color-history-tabs">
        <button
          className={`color-history-tab ${activeTab === 'recent' ? 'active' : ''}`}
          onClick={() => setActiveTab('recent')}
        >
          Recent Colors {colors.length > 0 && `(${colors.length})`}
        </button>
        <button
          className={`color-history-tab ${activeTab === 'saved' ? 'active' : ''}`}
          onClick={() => setActiveTab('saved')}
        >
          Saved Colors {savedColors.length > 0 && `(${savedColors.length})`}
        </button>
        <button
          className={`color-history-tab auto-blend-tab ${activeTab === 'autoblended' ? 'active' : ''}`}
          onClick={() => setActiveTab('autoblended')}
        >
          Auto-Blended {autoBlendedColors.length > 0 && `(${autoBlendedColors.length})`}
        </button>
      </div>

      <div className="color-history-content">
        {activeTab === 'recent' ? (
          <div className="color-history-grid">
            {colors.length === 0 ? (
              <div className="color-history-empty">
                Pick or blend colors to see them here
              </div>
            ) : (
              colors.map((color, index) => (
                <div key={`${color.r}-${color.g}-${color.b}-${index}`} className="color-item-wrapper">
                  <div className="color-item-content">
                    <button
                      className="color-history-item"
                      style={{ backgroundColor: colorToRgbString(color) }}
                      onClick={() => onColorSelect(color)}
                      title={`${getColorName(color, false)}\nRGB(${color.r}, ${color.g}, ${color.b})`}
                    />
                    <span className="color-name-label">{getColorName(color, true)}</span>
                  </div>
                  <button
                    className="color-save-btn"
                    onClick={() => onSaveColor(color)}
                    title="Save this color"
                  >
                    +
                  </button>
                </div>
              ))
            )}
          </div>
        ) : activeTab === 'saved' ? (
          <div className="color-history-grid">
            {savedColors.length === 0 ? (
              <div className="color-history-empty">
                Save colors from the Recent tab to keep them here
              </div>
            ) : (
              savedColors.map((color, index) => (
                <div key={`saved-${color.r}-${color.g}-${color.b}-${index}`} className="color-item-wrapper">
                  <div className="color-item-content">
                    <button
                      className="color-history-item"
                      style={{ backgroundColor: colorToRgbString(color) }}
                      onClick={() => onColorSelect(color)}
                      title={`${getColorName(color, false)}\nRGB(${color.r}, ${color.g}, ${color.b})`}
                    />
                    <span className="color-name-label">{getColorName(color, true)}</span>
                  </div>
                  <button
                    className="color-remove-btn"
                    onClick={() => onRemoveSavedColor(index)}
                    title="Remove this color"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="color-history-grid">
            {autoBlendedColors.length === 0 ? (
              <div className="color-history-empty">
                Use Auto Blend button to generate blended colors
              </div>
            ) : (
              autoBlendedColors.map((color, index) => (
                <div key={`autoblended-${color.r}-${color.g}-${color.b}-${index}`} className="color-item-wrapper">
                  <div className="color-item-content">
                    <button
                      className="color-history-item"
                      style={{ backgroundColor: colorToRgbString(color) }}
                      onClick={() => onColorSelect(color)}
                      title={`${getColorName(color, false)}\nRGB(${color.r}, ${color.g}, ${color.b})`}
                    />
                    <span className="color-name-label">{getColorName(color, true)}</span>
                  </div>
                  <button
                    className="color-save-btn"
                    onClick={() => onSaveColor(color)}
                    title="Save this color"
                  >
                    +
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
