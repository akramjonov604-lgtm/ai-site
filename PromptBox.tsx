interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 36, className = "" }: LogoProps) {
  const id = `b55-${size}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Base55 AI logosi"
    >
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#a855f7" />
          <stop offset="0.55" stopColor="#d946ef" />
          <stop offset="1" stopColor="#6366f1" />
        </linearGradient>
        <linearGradient id={`${id}-shine`} x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fff" stopOpacity="0.35" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`${id}-glow`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fff" stopOpacity="0.4" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* rounded square */}
      <rect x="2" y="2" width="60" height="60" rx="16" fill={`url(#${id}-bg)`} />
      <rect x="2" y="2" width="60" height="60" rx="16" fill={`url(#${id}-shine)`} />

      {/* subtle highlight */}
      <ellipse cx="22" cy="18" rx="20" ry="8" fill={`url(#${id}-glow)`} opacity="0.6" />

      {/* B5 monogram */}
      <g fill="#ffffff">
        {/* B */}
        <path d="M16 18 H28 a7 7 0 0 1 0 14 H22 v-3 h6 a4 4 0 0 0 0-8 H19 v22 h9 a7 7 0 0 0 0-14 v-3 a10 10 0 0 1 0 20 H16 z" />
        {/* 5 */}
        <path d="M36 18 h12 v3 h-9 v8 h5 a8 8 0 0 1 0 16 h-7 v-3 h7 a5 5 0 0 0 0-10 h-8 z" />
      </g>

      {/* sparkle */}
      <g fill="#ffffff" opacity="0.95">
        <path d="M48 8 l1.4 3.2 L52.6 12.6 L49.4 14 L48 17.2 L46.6 14 L43.4 12.6 L46.6 11.2 z" />
      </g>
    </svg>
  );
}
