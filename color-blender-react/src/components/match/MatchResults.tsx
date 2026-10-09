import { Level, RoundResult } from '../../game/types';
import { levelForXp, levelProgress, rankFor, STAR_THRESHOLDS } from '../../game/scoring';
import { colorToRgbString, rgbToHex } from '../../utils/colorUtils';
import { NextIcon, RetryIcon, StarRow } from '../Icons';

interface MatchResultsProps {
  level: Level;
  result: RoundResult;
  nextLevel: Level | null;
  onNext: () => void;
  onRetry: () => void;
  onLevels: () => void;
}

const CAPTIONS = [
  `Not quite. You need ${STAR_THRESHOLDS[0]}% to clear the level.`,
  `Cleared! Hit ${STAR_THRESHOLDS[1]}% for a second star.`,
  `Nice! Hit ${STAR_THRESHOLDS[2]}% for the third star.`,
  'Three stars. Keep the streak going for a bigger multiplier.'
];

const formatTime = (seconds: number) => {
  const s = Math.floor(seconds);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

export function MatchResults({ level, result, nextLevel, onNext, onRetry, onLevels }: MatchResultsProps) {
  const after = levelProgress(result.xpAfter);
  const levelBefore = levelForXp(result.xpBefore);
  const leveledUp = after.level > levelBefore;
  const newStars = Math.max(0, result.stars - result.previousBestStars);

  return (
    <div className="results">
      <header className="results-header">
        <span className="kicker">World {level.world} · Level {level.number} · {level.name}</span>
        <h1 className="results-title">{result.cleared ? 'Level clear' : 'So close'}</h1>
        <StarRow earned={result.stars} size={52} />
        <p className="results-caption">{CAPTIONS[result.stars]}</p>
      </header>

      <div className="results-grid">
        <section className="panel">
          <div className="panel-heading"><h2>Your blend</h2></div>
          <div className="compare-strip">
            <div className="compare-half" style={{ backgroundColor: colorToRgbString(result.target) }}>
              <span className="compare-tag">Target {rgbToHex(result.target.r, result.target.g, result.target.b).toUpperCase()}</span>
            </div>
            <div className="compare-half compare-half--right" style={{ backgroundColor: colorToRgbString(result.blend) }}>
              <span className="compare-tag">Yours {rgbToHex(result.blend.r, result.blend.g, result.blend.b).toUpperCase()}</span>
            </div>
          </div>
          <div className="stat-row">
            <div className="stat"><span className="label">Match</span><span className="stat-value stat-value--accent">{result.accuracy.toFixed(1)}%</span></div>
            <div className="stat"><span className="label">Time</span><span className="stat-value">{formatTime(result.seconds)}</span></div>
            <div className="stat"><span className="label">Par</span><span className="stat-value">{formatTime(result.parSeconds)}</span></div>
          </div>
        </section>

        <section className="panel">
          <div className="panel-heading"><h2>Score</h2></div>
          {result.cleared ? (
            <dl className="score-table">
              <div className="score-row"><dt>Accuracy {result.accuracy.toFixed(1)}%</dt><dd>{result.baseScore.toLocaleString()}</dd></div>
              <div className="score-row"><dt>Time bonus (under par)</dt><dd>+{result.timeBonus.toLocaleString()}</dd></div>
              <div className="score-row score-row--combo"><dt>Combo</dt><dd>x{result.multiplier}</dd></div>
              <div className="score-row score-row--total">
                <dt>Round total{result.isNewBest && <span className="new-best">New best</span>}</dt>
                <dd>{result.score.toLocaleString()}</dd>
              </div>
            </dl>
          ) : (
            <p className="results-note">
              No score this time. Compare your color with the target, then check the recipe below for a hint.
            </p>
          )}

          <div className={`xp-card${leveledUp ? ' xp-card--up' : ''}`}>
            <div className="xp-card-line">
              <span className="xp-gain">+{result.xpGained} XP</span>
              <span className="label">LV {after.level} · {after.into} / {after.span}</span>
            </div>
            <span className="progress-track progress-track--thick">
              <span className="progress-fill" style={{ width: `${Math.round(after.fraction * 100)}%` }} />
            </span>
            <span className="xp-note">
              {leveledUp
                ? `Level up! You're now level ${after.level}, ${rankFor(after.level)}.`
                : newStars > 0
                ? `${newStars} new star${newStars > 1 ? 's' : ''} on this level.`
                : result.cleared
                ? 'Replays earn a little XP. New stars earn a lot more.'
                : 'Clear the level to earn XP.'}
            </span>
          </div>
        </section>
      </div>

      <section className="panel recipe-reveal">
        <div className="panel-heading">
          <h2>The recipe</h2>
          <span className="panel-hint">{result.stars === 3 ? 'You found it.' : 'One way to hit 100%'}</span>
        </div>
        <ol className="recipe-steps">
          {level.recipe.map((stage, i) => (
            <li key={i} className="recipe-step">
              <span className="label">{i === 0 ? 'Blend' : 'Add, blend'}</span>
              <span className="recipe-swatches">
                {i > 0 && <span className="recipe-plus" aria-hidden="true">previous +</span>}
                {stage.map((hex) => (
                  <span key={hex} className="recipe-color">
                    <span className="pick-swatch" style={{ backgroundColor: hex }} />
                    {hex.toUpperCase()}
                  </span>
                ))}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <div className="results-actions">
        {result.cleared && nextLevel && (
          <button type="button" className="btn btn-primary btn-lg" onClick={onNext}>
            Next level <NextIcon size={18} />
          </button>
        )}
        <button type="button" className={`btn btn-lg${result.cleared && nextLevel ? '' : ' btn-primary'}`} onClick={onRetry}>
          <RetryIcon size={18} /> {result.stars === 3 ? 'Play again' : result.cleared ? 'Retry for more stars' : 'Try again'}
        </button>
        <button type="button" className="btn btn-lg" onClick={onLevels}>
          All levels
        </button>
      </div>
    </div>
  );
}
