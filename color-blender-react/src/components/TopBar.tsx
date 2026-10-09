import { levelProgress, rankFor } from '../game/scoring';
import { MoonIcon, SunIcon } from './Icons';

interface TopBarProps {
  xp: number;
  nightMode: boolean;
  onToggleNightMode: () => void;
  onHome: () => void;
}

export function TopBar({ xp, nightMode, onToggleNightMode, onHome }: TopBarProps) {
  const { level, into, span, fraction } = levelProgress(xp);

  return (
    <div className="top-bar">
      <button type="button" className="brand" onClick={onHome} aria-label="Color Blender home">
        <span className="brand-mark" aria-hidden="true">
          <span /><span /><span /><span />
        </span>
        <span className="brand-name">Color Blender</span>
      </button>

      <div className="top-bar-right">
        <div className="player-chip" aria-label={`Level ${level}, ${rankFor(level)}, ${into} of ${span} XP`}>
          <span className="player-avatar" aria-hidden="true">P1</span>
          <span className="player-meta" aria-hidden="true">
            <span className="player-line">
              <span>LV {level} · {rankFor(level)}</span>
              <span className="player-xp">{into} / {span} XP</span>
            </span>
            <span className="progress-track">
              <span className="progress-fill" style={{ width: `${Math.round(fraction * 100)}%` }} />
            </span>
          </span>
        </div>
        <button
          type="button"
          className="night-mode-toggle"
          onClick={onToggleNightMode}
          aria-label={nightMode ? 'Switch to day mode' : 'Switch to night mode'}
          title={nightMode ? 'Switch to day mode' : 'Switch to night mode'}
        >
          {nightMode ? <SunIcon size={22} /> : <MoonIcon size={22} />}
        </button>
      </div>
    </div>
  );
}
