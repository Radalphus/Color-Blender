import { useEffect } from 'react';

/**
 * Drives the LED backdrop from the scroll position.
 *
 * Writes three CSS custom properties on <html>:
 *   --scroll        0 -> 1 progress through the page
 *   --scroll-y      raw scroll offset in px (used for parallax sweeps)
 *   --scroll-energy 0 -> 1 how fast the user is scrolling right now, eased so the
 *                   lights bloom while moving and fade back down when they stop
 *
 * The animation frame loop only runs while there is energy left to decay, so an
 * idle page costs nothing.
 */
export function useScrollEnergy(): void {
  useEffect(() => {
    const root = document.documentElement;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let frame = 0;
    let running = false;
    let lastY = window.scrollY;
    let energy = 0;

    const writeProgress = () => {
      const y = window.scrollY;
      const max = Math.max(1, root.scrollHeight - window.innerHeight);
      root.style.setProperty('--scroll', (Math.min(1, Math.max(0, y / max))).toFixed(4));
      root.style.setProperty('--scroll-y', `${y.toFixed(1)}px`);
      return y;
    };

    const tick = () => {
      const y = writeProgress();
      const delta = Math.abs(y - lastY);
      lastY = y;

      // Ease toward how fast we are moving; ~30px per frame counts as full tilt
      const target = Math.min(1, delta / 30);
      energy += (target - energy) * (target > energy ? 0.45 : 0.08);

      if (energy < 0.003) {
        energy = 0;
        running = false;
        root.style.setProperty('--scroll-energy', '0');
        return;
      }

      root.style.setProperty('--scroll-energy', energy.toFixed(3));
      frame = requestAnimationFrame(tick);
    };

    const onScroll = () => {
      if (reduceMotion) {
        writeProgress();
        return;
      }
      if (!running) {
        running = true;
        frame = requestAnimationFrame(tick);
      }
    };

    writeProgress();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', writeProgress);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', writeProgress);
    };
  }, []);
}
