export default function BrandMark({ size = 64 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="logoFace" x1="4" y1="2" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#9C87F0" />
          <stop offset="45%" stopColor="#6C5CE0" />
          <stop offset="100%" stopColor="#3E5FCE" />
        </linearGradient>
        <linearGradient id="logoSide" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3E3486" />
          <stop offset="100%" stopColor="#2A2C68" />
        </linearGradient>
        <linearGradient id="logoTopHi" x1="6" y1="4" x2="30" y2="16" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="logoGlow" cx="30%" cy="22%" r="75%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path d="M6 13 L6 32 Q6 36 10 37.6 L20 41.5 Q22 42.2 24 41.5 L34 37.6 Q38 36 38 32 L38 13 Z" fill="url(#logoSide)" />
      <rect x="5" y="4" width="34" height="30" rx="11" fill="url(#logoFace)" />
      <rect x="5" y="4" width="34" height="30" rx="11" fill="url(#logoGlow)" />
      <path d="M5 15 V11 A11 11 0 0 1 16 4 H28 A11 11 0 0 1 39 15 Z" fill="url(#logoTopHi)" />
      <path d="M22 12L31 16L22 20L13 16L22 12Z" fill="#FFFFFF" opacity="0.98" />
      <path d="M15.5 17.7V23.4C15.5 25 18.4 26.6 22 26.6C25.6 26.6 28.5 25 28.5 23.4V17.7" stroke="#FFFFFF" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.98" />
      <path d="M32.6 15.6V21.6" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" opacity="0.92" />
      <circle cx="32.6" cy="23.2" r="1.25" fill="#FFFFFF" opacity="0.92" />
      <ellipse cx="14" cy="9.5" rx="7" ry="3.2" fill="#FFFFFF" opacity="0.35" />
    </svg>
  );
}