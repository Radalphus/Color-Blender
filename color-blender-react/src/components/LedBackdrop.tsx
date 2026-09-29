import { useScrollEnergy } from '../hooks/useScrollEnergy';

/**
 * Fixed, non-interactive background made of stacked layers:
 *   led-field  - large neon colour blobs that drift on their own and hue-shift with scroll
 *   led-grid   - dot matrix mask, so the colour field reads as individual LEDs
 *   led-sweep  - a light bar that travels as you scroll
 *   led-scan   - fine scanlines + vignette for the arcade-screen feel
 *   led-strip  - scroll progress bar along the top edge
 */
export function LedBackdrop() {
  useScrollEnergy();

  return (
    <div className="led-backdrop" aria-hidden="true">
      <div className="led-field">
        <div className="led-field-inner" />
      </div>
      <div className="led-sweep" />
      <div className="led-grid" />
      <div className="led-scan" />
      <div className="led-strip" />
    </div>
  );
}
