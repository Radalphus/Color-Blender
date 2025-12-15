import { GridSize } from '../types';

interface GridSizeSelectorProps {
  gridSize: GridSize;
  onGridSizeChange: (size: GridSize) => void;
}

export function GridSizeSelector({ gridSize, onGridSizeChange }: GridSizeSelectorProps) {
  return (
    <div className="grid-size-selector">
      <span className="selector-label">Grid Size:</span>
      <div className="button-group">
        <button
          className={gridSize === 3 ? 'active' : ''}
          onClick={() => onGridSizeChange(3)}
        >
          3x3
        </button>
        <button
          className={gridSize === 4 ? 'active' : ''}
          onClick={() => onGridSizeChange(4)}
        >
          4x4
        </button>
        <button
          className={gridSize === 5 ? 'active' : ''}
          onClick={() => onGridSizeChange(5)}
        >
          5x5
        </button>
      </div>
    </div>
  );
}
