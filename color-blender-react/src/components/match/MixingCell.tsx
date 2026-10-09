import { useCallback, useEffect, useRef, useState } from 'react';
import { Color, PaletteCell as PaletteCellType } from '../../types';
import { PaletteCell } from '../PaletteCell';
import { colorToRgbString, getCellBlendColor, rgbToHex } from '../../utils/colorUtils';
import { RetryIcon } from '../Icons';

interface MixingCellProps {
  selectedColor: Color | null;
  onCellChange: (cell: PaletteCellType) => void;
}

const EMPTY_CELL: PaletteCellType = { color1: null, color2: null, color3: null, color4: null, hasAllFourColors: false };
const noop = () => {};

const colorsIn = (cell: PaletteCellType): Color[] =>
  [cell.color1, cell.color2, cell.color3, cell.color4].filter((c): c is Color => !!c);

/**
 * One large palette cell. It is the same PaletteCell used in Studio, so
 * click-to-add, hold-and-drag blending and double-click-to-clear all work as usual.
 * Blending and then adding more colors mixes in stages.
 */
export function MixingCell({ selectedColor, onCellChange }: MixingCellProps) {
  const [cell, setCell] = useState<PaletteCellType>(EMPTY_CELL);
  const [history, setHistory] = useState<PaletteCellType[]>([]);

  useEffect(() => {
    onCellChange(cell);
  }, [cell, onCellChange]);

  // Ref mirror so commits never run side effects inside a state updater
  const cellRef = useRef(cell);
  cellRef.current = cell;

  const commit = useCallback((next: PaletteCellType) => {
    const previous = cellRef.current;
    setHistory((h) => [...h.slice(-29), previous]);
    setCell(next);
  }, []);

  const handleCellUpdate = useCallback((_index: number, next: PaletteCellType) => commit(next), [commit]);

  const colors = colorsIn(cell);
  const canBlend = colors.length >= 2;

  const blendNow = () => {
    const blended = getCellBlendColor(cell);
    if (blended && canBlend) commit({ ...EMPTY_CELL, color1: blended });
  };

  const undo = () => {
    if (history.length === 0) return;
    setCell(history[history.length - 1]);
    setHistory((h) => h.slice(0, -1));
  };

  const status = colors.length === 0
    ? 'Empty'
    : colors.length === 1
    ? 'Single color: scored'
    : `${colors.length} colors: blend to score`;

  return (
    <section className="panel mixing-panel">
      <div className="panel-heading">
        <h2>Mixing cell</h2>
        <span className="panel-hint">{colors.length} / 4 colors</span>
      </div>

      <div className="mixing-cell">
        <PaletteCell
          cell={cell}
          index={0}
          paletteType="manual"
          selectedColor={selectedColor}
          gridSize={3}
          canvasSize={240}
          isCornerCell={false}
          onCellUpdate={handleCellUpdate}
          onCanvasRef={noop}
        />
      </div>

      <div className="cell-contents" aria-live="polite">
        <span className="label">{status}</span>
        <div className="cell-chips">
          {colors.map((color, i) => (
            <span key={i} className="cell-chip">
              <span className="pick-swatch" style={{ backgroundColor: colorToRgbString(color) }} />
              {rgbToHex(color.r, color.g, color.b).toUpperCase()}
            </span>
          ))}
        </div>
      </div>

      <div className="mixing-actions">
        <button type="button" className="btn btn-blend" onClick={blendNow} disabled={!canBlend}>
          Blend
        </button>
        <button type="button" className="btn" onClick={undo} disabled={history.length === 0}>
          <RetryIcon size={16} /> Undo
        </button>
        <button type="button" className="btn" onClick={() => commit(EMPTY_CELL)} disabled={colors.length === 0}>
          Clear
        </button>
      </div>

      <p className="panel-hint">
        Click the cell to add the selected color (up to 4). Hold and drag, or press Blend, to mix.
        To weight a color more, blend first, then add it and blend again.
      </p>
    </section>
  );
}
