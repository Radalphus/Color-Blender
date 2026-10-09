import { useState, useEffect, useCallback } from 'react';

export type Route =
  | { name: 'hub' }
  | { name: 'studio' }
  | { name: 'match' }
  | { name: 'match-level'; levelId: string };

function parseHash(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  if (parts[0] === 'studio') return { name: 'studio' };
  if (parts[0] === 'match') {
    return parts[1] ? { name: 'match-level', levelId: decodeURIComponent(parts[1]) } : { name: 'match' };
  }
  return { name: 'hub' };
}

export function routeToHash(route: Route): string {
  switch (route.name) {
    case 'studio':
      return '#/studio';
    case 'match':
      return '#/match';
    case 'match-level':
      return `#/match/${encodeURIComponent(route.levelId)}`;
    default:
      return '#/';
  }
}

/**
 * Tiny hash router: works on GitHub Pages, survives refresh, and the browser
 * back button moves between screens.
 */
export function useHashRoute() {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));

  useEffect(() => {
    const onHashChange = () => {
      setRoute(parseHash(window.location.hash));
      // Jump, don't animate: the page has smooth scrolling on by default
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = useCallback((to: Route) => {
    window.location.hash = routeToHash(to);
  }, []);

  return { route, navigate };
}
