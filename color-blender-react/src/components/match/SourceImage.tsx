import { useEffect, useRef, useState, MouseEvent } from 'react';
import { Color } from '../../types';
import { Level } from '../../game/types';
import { drawScene } from '../../game/scene';
import { colorToRgbString, rgbToHex } from '../../utils/colorUtils';

interface SourceImageProps {
  level: Level;
  /** Colors picked this round, newest first */
  recent: Color[];
  selected: Color | null;
  onPick: (color: Color) => void;
}

interface Hover {
  color: Color;
  x: number; // % across the image
  y: number;
}

export const sameColor = (a: Color | null, b: Color | null) =>
  !!a && !!b && a.r === b.r && a.g === b.g && a.b === b.b;

const hexOf = (c: Color) => rgbToHex(c.r, c.g, c.b).toUpperCase();

export function SourceImage({ level, recent, selected, onPick }: SourceImageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hover, setHover] = useState<Hover | null>(null);

  useEffect(() => {
    if (canvasRef.current) drawScene(canvasRef.current, level.scene, level.seed);
  }, [level]);

  const colorAt = (e: MouseEvent<HTMLCanvasElement>): Hover | null => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d', { willReadFrequently: true });
    if (!canvas || !ctx) return null;

    const rect = canvas.getBoundingClientRect();
    const fx = (e.clientX - rect.left) / rect.width;
    const fy = (e.clientY - rect.top) / rect.height;
    if (fx < 0 || fx >= 1 || fy < 0 || fy >= 1) return null;

    const [r, g, b] = ctx.getImageData(Math.floor(fx * canvas.width), Math.floor(fy * canvas.height), 1, 1).data;
    return { color: { r, g, b }, x: fx * 100, y: fy * 100 };
  };

  return (
    <section className="panel source-panel">
      <div className="panel-heading">
        <h2>Source image</h2>
        <span className="panel-hint">Click to pick a color</span>
      </div>

      <div className="source-canvas-wrap">
        <canvas
          ref={canvasRef}
          className="source-canvas"
          aria-label={`Source image for ${level.name}. Click to pick a color.`}
          onClick={(e) => {
            const hit = colorAt(e);
            if (hit) onPick(hit.color);
          }}
          onMouseMove={(e) => setHover(colorAt(e))}
          onMouseLeave={() => setHover(null)}
        />
        {hover && (
          <span
            className={`hover-readout${hover.x > 60 ? ' hover-readout--left' : ''}`}
            style={{ left: `${hover.x}%`, top: `${hover.y}%` }}
            aria-hidden="true"
          >
            <span className="hover-swatch" style={{ backgroundColor: colorToRgbString(hover.color) }} />
            <span>{hexOf(hover.color)}</span>
          </span>
        )}
      </div>

      <div className="picks">
        <div className="picks-heading">
          <span className="label">Selected</span>
          <span className="selected-readout">
            <span
              className={`pick-swatch${selected ? '' : ' pick-swatch--empty'}`}
              style={selected ? { backgroundColor: colorToRgbString(selected) } : undefined}
            />
            {selected ? hexOf(selected) : 'Nothing yet'}
          </span>
        </div>
        {recent.length > 0 && (
          <>
            <span className="label">Recent picks</span>
            <div className="picks-row">
              {recent.map((pick) => {
                const isSelected = sameColor(pick, selected);
                return (
                  <button
                    key={hexOf(pick)}
                    type="button"
                    className={`pick-chip${isSelected ? ' pick-chip--selected' : ''}`}
                    aria-pressed={isSelected}
                    aria-label={`Use ${hexOf(pick)}`}
                    onClick={() => onPick(pick)}
                  >
                    <span className="pick-swatch" style={{ backgroundColor: colorToRgbString(pick) }} />
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
