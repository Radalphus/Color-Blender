import { LEVELS } from '../game/levels';
import { isLevelUnlocked, levelForXp, nextRank, totalStars, xpToReach } from '../game/scoring';
import { Progress } from '../game/types';
import { Route } from '../hooks/useHashRoute';
import { BookIcon, CalendarIcon, DropIcon, GridIcon, LockIcon, StarIcon, TargetIcon, TrophyIcon } from '../components/Icons';

interface HubProps {
  progress: Progress;
  onNavigate: (route: Route) => void;
}

const COMING_SOON = [
  { name: 'Daily Blend', desc: 'One target color a day, six tries, the same color for every player.', Icon: CalendarIcon },
  { name: 'Gradient Puzzle', desc: 'Rebuild a finished gradient by choosing only the four corners.', Icon: GridIcon },
  { name: 'Chromadex', desc: 'Collect the 30,051 named colors by blending them.', Icon: BookIcon }
];

export function Hub({ progress, onNavigate }: HubProps) {
  const stars = totalStars(progress);
  const maxStars = LEVELS.length * 3;

  // The furthest unlocked level the player hasn't cleared yet, else the last one
  const nextIndex = LEVELS.findIndex(
    (level, i) => isLevelUnlocked(LEVELS, i, progress) && !progress.levels[level.id]
  );
  const nextLevel = LEVELS[nextIndex === -1 ? LEVELS.length - 1 : nextIndex];
  const cleared = LEVELS.filter((level) => progress.levels[level.id]).length;

  const playerLevel = levelForXp(progress.xp);
  const upcomingRank = nextRank(playerLevel);

  return (
    <div className="screen">
      <header className="hub-hero">
        <h1 data-text="Color Blender">Color Blender</h1>
        <p>Pick a mode. Every blend counts.</p>
      </header>

      <div className="mode-grid mode-grid--primary">
        <button
          type="button"
          className="mode-tile mode-tile--match"
          onClick={() => onNavigate({ name: 'match' })}
        >
          <span className="mode-tile-top">
            <span className="mode-icon"><TargetIcon size={24} /></span>
            <span className="mode-badge mode-badge--gold">
              <StarIcon size={14} filled /> {stars} / {maxStars}
            </span>
          </span>
          <span className="mode-name">Match Mode</span>
          <span className="mode-desc">
            Mix colors from an image in a single cell to hit a tricky target color. Closer matches earn more stars.
          </span>
          <span className="mode-meta">
            <span>{cleared === LEVELS.length ? 'World 1 complete' : `Next: ${nextLevel.id} · ${nextLevel.name}`}</span>
            <span className="progress-track">
              <span className="progress-fill" style={{ width: `${Math.round((stars / maxStars) * 100)}%` }} />
            </span>
          </span>
        </button>

        <button
          type="button"
          className="mode-tile mode-tile--studio"
          onClick={() => onNavigate({ name: 'studio' })}
        >
          <span className="mode-tile-top">
            <span className="mode-icon"><DropIcon size={24} /></span>
            <span className="mode-badge">No timer</span>
          </span>
          <span className="mode-name">Studio</span>
          <span className="mode-desc">
            Free play: upload any image and blend on Manual or Aesthetic palettes in any grid size.
          </span>
          <span className="mode-meta"><span>The original Color Blender</span></span>
        </button>
      </div>

      <div className="soon-section">
        <span className="label">Coming soon</span>
        <div className="mode-grid mode-grid--soon">
          {COMING_SOON.map(({ name, desc, Icon }) => (
            <div key={name} className="mode-tile mode-tile--soon" aria-disabled="true">
              <span className="mode-tile-top">
                <span className="mode-icon"><Icon size={24} /></span>
                <span className="mode-badge"><LockIcon size={13} /> Locked</span>
              </span>
              <span className="mode-name">{name}</span>
              <span className="mode-desc">{desc}</span>
            </div>
          ))}
        </div>
      </div>

      {upcomingRank && (
        <div className="rank-strip">
          <span className="rank-strip-icon"><TrophyIcon size={22} /></span>
          <span className="rank-strip-text">
            <span className="kicker kicker--gold">Next rank · Level {upcomingRank.level}</span>
            <span className="rank-strip-title">{upcomingRank.title}</span>
          </span>
          <span className="rank-strip-xp">
            {xpToReach(upcomingRank.level) - progress.xp} XP to go
          </span>
        </div>
      )}
    </div>
  );
}
