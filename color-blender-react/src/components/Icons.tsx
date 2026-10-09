import { ReactNode } from 'react';

interface IconProps {
  size?: number;
  filled?: boolean;
}

function Svg({ size = 20, children, filled = false }: IconProps & { children: ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

export const StarIcon = (p: IconProps) => (
  <Svg {...p}><path d="M12 3l2.6 5.9 6.4.7-4.8 4.3 1.4 6.3L12 17l-5.6 3.2 1.4-6.3L3 9.6l6.4-.7z" /></Svg>
);
export const BackIcon = (p: IconProps) => <Svg {...p}><path d="M15 5l-7 7 7 7" /></Svg>;
export const NextIcon = (p: IconProps) => <Svg {...p}><path d="M9 5l7 7-7 7" /></Svg>;
export const PlayIcon = (p: IconProps) => <Svg {...p} filled><path d="M7 4l13 8-13 8z" /></Svg>;
export const LockIcon = (p: IconProps) => (
  <Svg {...p}><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></Svg>
);
export const TargetIcon = (p: IconProps) => (
  <Svg {...p}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" fill="currentColor" /></Svg>
);
export const GridIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
  </Svg>
);
export const DropIcon = (p: IconProps) => <Svg {...p}><path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z" /></Svg>;
export const BookIcon = (p: IconProps) => (
  <Svg {...p}><path d="M4 5a2 2 0 0 1 2-2h13v15H6a2 2 0 0 0-2 2V5z" /><path d="M4 20a2 2 0 0 0 2 2h13v-4" /></Svg>
);
export const CalendarIcon = (p: IconProps) => (
  <Svg {...p}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></Svg>
);
export const TrophyIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M8 4h8v5a4 4 0 0 1-8 0V4z" /><path d="M8 5H4v2a3 3 0 0 0 4 3" /><path d="M16 5h4v2a3 3 0 0 1-4 3" />
    <path d="M12 13v4" /><path d="M8 21h8" />
  </Svg>
);
export const RetryIcon = (p: IconProps) => (
  <Svg {...p}><path d="M20 12a8 8 0 1 1-2.3-5.7" /><path d="M20 4v5h-5" /></Svg>
);
export const ClockIcon = (p: IconProps) => <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Svg>;
export const SunIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </Svg>
);
export const MoonIcon = (p: IconProps) => <Svg {...p}><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" /></Svg>;

/** Three stars, the first `earned` lit */
export function StarRow({ earned, size = 22 }: { earned: number; size?: number }) {
  return (
    <span className="star-row" role="img" aria-label={`${earned} of 3 stars`}>
      {[0, 1, 2].map((i) => (
        <span key={i} className={i < earned ? 'star star--on' : 'star'}>
          <StarIcon size={size} filled={i < earned} />
        </span>
      ))}
    </span>
  );
}
