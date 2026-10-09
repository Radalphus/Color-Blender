import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Color, PaletteCell as PaletteCellType } from '../types';
import { Level, Progress, RoundInput, RoundResult } from '../game/types';
import { describeRecipe, LEVELS, targetColor } from '../game/levels';
import { comboMultiplier, parSeconds, STAR_THRESHOLDS, starsFor } from '../game/scoring';
import { Route } from '../hooks/useHashRoute';
import { SourceImage, sameColor } from '../components/match/SourceImage';
import { MixingCell } from '../components/match/MixingCell';
import { MatchResults } from '../components/match/MatchResults';
import { BackIcon, RetryIcon, StarRow } from '../components/Icons';
import { colorMatchPercent, colorToRgbString, getClosestColorName, rgbToHex } from '../utils/colorUtils';

interface MatchPlayProps {
  level: Level;
  index: number;
  progress: Progress;
  commitRound: (input: RoundInput) => RoundResult;
  onNavigate: (route: Route) => void;
  onRestart: () => void;
}

const RECENT_LIMIT = 8;

// The meter spans 70-100%: below that there's nothing useful to show
const METER_MIN = 70;
const meterPosition = (accuracy: number) =>
  `${Math.max(0, Math.min(100, ((accuracy - METER_MIN) / (100 - METER_MIN)) * 100))}%`;

export const formatTime = (seconds: number) => {
  const s = Math.floor(seconds);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

/** The cell scores once it holds a single color: a blend, or a lone pick */
const scoredColor = (cell: PaletteCellType | null): Color | null =>
  cell && cell.color1 && !cell.color2 && !cell.color3 && !cell.color4 ? cell.color1 : null;

export function MatchPlay({ level, index, progress, commitRound, onNavigate, onRestart }: MatchPlayProps) {
  const target = useMemo(() => targetColor(level), [level]);
  const targetName = useMemo(() => getClosestColorName(target), [target]);
  const par = parSeconds(level);

  const [recent, setRecent] = useState<Color[]>([]);
  const [selected, setSelected] = useState<Color | null>(null);
  const [cell, setCell] = useState<PaletteCellType | null>(null);
  const [result, setResult] = useState<RoundResult | null>(null);

  const startRef = useRef(performance.now());
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (result) return;
    const id = window.setInterval(() => setSeconds((performance.now() - startRef.current) / 1000), 250);
    return () => window.clearInterval(id);
  }, [result]);

  const blend = scoredColor(cell);
  const accuracy = blend ? colorMatchPercent(target, blend) : null;
  const stars = accuracy === null ? 0 : starsFor(accuracy);
  const multiplier = comboMultiplier(progress.combo);
  const nextLevel = LEVELS[index + 1] ?? null;

  const handlePick = (color: Color) => {
    setSelected(color);
    setRecent((list) => [color, ...list.filter((c) => !sameColor(c, color))].slice(0, RECENT_LIMIT));
  };

  const handleCellChange = useCallback((next: PaletteCellType) => setCell(next), []);

  const lockIn = () => {
    if (!blend) return;
    const elapsed = (performance.now() - startRef.current) / 1000;
    setResult(commitRound({ level, target, blend, seconds: elapsed }));
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  };

  if (result) {
    return (
      <div className="screen">
        <MatchResults
          level={level}
          result={result}
          nextLevel={nextLevel}
          onNext={() => nextLevel && onNavigate({ name: 'match-level', levelId: nextLevel.id })}
          onRetry={onRestart}
          onLevels={() => onNavigate({ name: 'match' })}
        />
      </div>
    );
  }

  const hint = !blend
    ? 'Your cell is scored once it holds a single color. Add colors, then blend.'
    : stars === 0
    ? `Keep mixing: ${STAR_THRESHOLDS[0]}% clears the level.`
    : stars < 3
    ? 'Lock in now, or keep mixing for more stars.'
    : 'Three stars. Lock it in!';

  return (
    <div className="screen">
      <div className="screen-header">
        <button type="button" className="back-btn" onClick={() => onNavigate({ name: 'match' })} aria-label="Back to levels">
          <BackIcon size={20} />
        </button>
        <div className="screen-titles">
          <span className="kicker">World {level.world} · Level {level.number}</span>
          <h1 className="screen-title">{level.name}</h1>
        </div>
        <div className="hud" aria-label="Round status">
          <span className={`hud-stat${seconds > par ? ' hud-stat--over' : ''}`}>
            <span className="hud-label">Time</span>
            <span className="hud-value">
              {formatTime(seconds)}
              <span className="hud-sub" aria-label={`par ${formatTime(par)}`}>/ {formatTime(par)}</span>
            </span>
          </span>
          <span className="hud-stat">
            <span className="hud-label">Recipe</span>
            <span className="hud-value">{describeRecipe(level)}</span>
          </span>
          <span className={`hud-stat${multiplier > 1 ? ' hud-stat--combo' : ''}`}>
            <span className="hud-label">Combo</span>
            <span className="hud-value">x{multiplier}</span>
          </span>
        </div>
      </div>

      <div className="match-layout">
        <SourceImage level={level} recent={recent} selected={selected} onPick={handlePick} />

        <MixingCell selectedColor={selected} onCellChange={handleCellChange} />

        <section className="panel target-panel">
          <div className="compare">
            <div className="compare-item">
              <span className="label">Target</span>
              <span className="compare-swatch" style={{ backgroundColor: colorToRgbString(target) }} />
              <span className="compare-name">{targetName}</span>
              <span className="compare-hex">{rgbToHex(target.r, target.g, target.b).toUpperCase()}</span>
            </div>
            <div className="compare-item">
              <span className="label">Your cell</span>
              {blend ? (
                <span className="compare-swatch compare-swatch--yours" style={{ backgroundColor: colorToRgbString(blend) }} />
              ) : (
                <span className="compare-swatch compare-swatch--empty">?</span>
              )}
              <span className="compare-name">{blend ? getClosestColorName(blend) : 'Not blended'}</span>
              <span className="compare-hex">{blend ? rgbToHex(blend.r, blend.g, blend.b).toUpperCase() : '—'}</span>
            </div>
          </div>

          <div className="meter-block">
            <div className="meter-heading">
              <span className="label">Match</span>
              <span className="meter-value">{accuracy === null ? '--' : `${accuracy.toFixed(1)}%`}</span>
            </div>
            <div
              className="meter"
              role="meter"
              aria-label="Match with target"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={accuracy ?? 0}
            >
              {accuracy !== null && <span className="meter-fill" style={{ width: meterPosition(accuracy) }} />}
              {STAR_THRESHOLDS.map((threshold) => (
                <span key={threshold} className="meter-tick" style={{ left: meterPosition(threshold) }} />
              ))}
            </div>
            <div className="meter-labels" aria-hidden="true">
              <span style={{ left: 0 }}>{METER_MIN}%</span>
              {STAR_THRESHOLDS.map((threshold, i) => (
                <span key={threshold} className="meter-label-star" style={{ left: meterPosition(threshold) }}>
                  {i + 1}★
                </span>
              ))}
            </div>
            <StarRow earned={stars} size={28} />
          </div>

          <div className="target-actions">
            <button type="button" className="btn btn-primary btn-lg" onClick={lockIn} disabled={!blend}>
              Lock in
            </button>
            <button type="button" className="btn" onClick={onRestart}>
              <RetryIcon size={16} /> Restart level
            </button>
            <p className="panel-hint">{hint}</p>
          </div>
        </section>
      </div>
    </div>
  );
}
