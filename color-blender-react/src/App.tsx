import { useState, useEffect, ReactNode } from 'react';
import { LedBackdrop } from './components/LedBackdrop';
import { TopBar } from './components/TopBar';
import { Hub } from './screens/Hub';
import { Studio } from './screens/Studio';
import { MatchLevels } from './screens/MatchLevels';
import { MatchPlay } from './screens/MatchPlay';
import { useHashRoute } from './hooks/useHashRoute';
import { useProgress } from './hooks/useProgress';
import { getLevel, LEVELS } from './game/levels';
import { isLevelUnlocked } from './game/scoring';
import './App.css';
import './game.css';

function App() {
  const [nightMode, setNightMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('colorBlenderNightMode');
    return saved === null ? true : saved === 'true';
  });

  // Remember the theme choice between visits
  useEffect(() => {
    localStorage.setItem('colorBlenderNightMode', String(nightMode));
  }, [nightMode]);

  const { route, navigate } = useHashRoute();
  const { progress, commitRound } = useProgress();

  // Bumped to restart the current level from scratch
  const [attempt, setAttempt] = useState(0);

  let screen: ReactNode = null;
  if (route.name === 'hub') {
    screen = <Hub progress={progress} onNavigate={navigate} />;
  } else if (route.name === 'match') {
    screen = <MatchLevels progress={progress} onNavigate={navigate} />;
  } else if (route.name === 'match-level') {
    const found = getLevel(route.levelId);
    screen = found && isLevelUnlocked(LEVELS, found.index, progress)
      ? (
        <MatchPlay
          key={`${found.level.id}-${attempt}`}
          level={found.level}
          index={found.index}
          progress={progress}
          commitRound={commitRound}
          onNavigate={navigate}
          onRestart={() => setAttempt((n) => n + 1)}
        />
      )
      // Unknown or still-locked level in the URL: show the level list instead
      : <MatchLevels progress={progress} onNavigate={navigate} />;
  }

  return (
    <div className={`app-shell ${nightMode ? 'night-mode' : 'day-mode'}`}>
      <LedBackdrop />

      <div className="container">
        <TopBar
          xp={progress.xp}
          nightMode={nightMode}
          onToggleNightMode={() => setNightMode(!nightMode)}
          onHome={() => navigate({ name: 'hub' })}
        />

        {screen}

        {/* Studio stays mounted so its palette and image survive leaving and coming back */}
        <div hidden={route.name !== 'studio'}>
          <Studio active={route.name === 'studio'} onBack={() => navigate({ name: 'hub' })} />
        </div>
      </div>
    </div>
  );
}

export default App;
