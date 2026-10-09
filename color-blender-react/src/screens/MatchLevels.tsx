import { describeRecipe, LEVELS, targetColor } from '../game/levels';
import { isLevelUnlocked, STAR_THRESHOLDS, totalStars } from '../game/scoring';
import { Progress } from '../game/types';
import { Route } from '../hooks/useHashRoute';
import { BackIcon, LockIcon, StarIcon, StarRow } from '../components/Icons';
import { colorToRgbString } from '../utils/colorUtils';

interface MatchLevelsProps {
  progress: Progress;
  onNavigate: (route: Route) => void;
}

export function MatchLevels({ progress, onNavigate }: MatchLevelsProps) {
  const stars = totalStars(progress);

  return (
    <div className="screen">
      <div className="screen-header">
        <button type="button" className="back-btn" onClick={() => onNavigate({ name: 'hub' })} aria-label="Back to hub">
          <BackIcon size={20} />
        </button>
        <div className="screen-titles">
          <span className="kicker">Match Mode · World 1</span>
          <h1 className="screen-title">Choose a level</h1>
        </div>
        <span className="hud-stat hud-stat--gold">
          <span className="hud-label">Stars</span>
          <span className="hud-value"><StarIcon size={16} filled /> {stars} / {LEVELS.length * 3}</span>
        </span>
      </div>

      <div className="level-grid">
        {LEVELS.map((level, index) => {
          const unlocked = isLevelUnlocked(LEVELS, index, progress);
          const record = progress.levels[level.id];
          const target = targetColor(level);

          if (!unlocked) {
            return (
              <div key={level.id} className="level-card level-card--locked" aria-disabled="true">
                <span className="level-swatch level-swatch--locked"><LockIcon size={22} /></span>
                <span className="level-meta">
                  <span className="level-num">{level.id}</span>
                  <span className="level-recipe">{describeRecipe(level)}</span>
                </span>
                <span className="level-name">{level.name}</span>
                <span className="level-status">Clear {LEVELS[index - 1].id} to unlock</span>
              </div>
            );
          }

          return (
            <button
              key={level.id}
              type="button"
              className={`level-card${record ? '' : ' level-card--new'}`}
              onClick={() => onNavigate({ name: 'match-level', levelId: level.id })}
            >
              <span className="level-swatch" style={{ backgroundColor: colorToRgbString(target) }} />
              <span className="level-meta">
                <span className="level-num">{level.id}</span>
                <span className="level-recipe">{describeRecipe(level)}</span>
              </span>
              <span className="level-name">{level.name}</span>
              <span className="level-status">
                {record ? (
                  <>
                    <StarRow earned={record.stars} size={16} />
                    <span>{record.bestAccuracy.toFixed(1)}%</span>
                  </>
                ) : (
                  <span className="level-new">Play</span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      <section className="panel rules">
        <h2>How it works</h2>
        <ol>
          <li>Each level gives you a <strong>target color</strong> and a pixel-art image. The target is mixed from colors hidden in that image, and the level tells you how many.</li>
          <li>Click the image to <strong>pick</strong> a color, as often as you like, then click the <strong>mixing cell</strong> to add it. A cell holds up to 4 colors.</li>
          <li><strong>Hold and drag</strong> on the cell, or press Blend, to mix. Later levels mix in <strong>steps</strong>: blend, then add more colors and blend again, so earlier colors count for less.</li>
          <li>
            Press <strong>Lock in</strong>. {STAR_THRESHOLDS[0]}% clears the level, {STAR_THRESHOLDS[1]}% earns 2 stars,
            and {STAR_THRESHOLDS[2]}% earns 3.
          </li>
          <li>Finish under par time for bonus points. Back-to-back 3-star clears multiply your score up to x3. After each round you'll see the recipe.</li>
        </ol>
      </section>
    </div>
  );
}
