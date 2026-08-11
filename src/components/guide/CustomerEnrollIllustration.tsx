/**
 * Custom SVG illustration for the "Customers Enroll in Seconds" step.
 * Visual metaphor: a stylized hand holding a smartphone, with a QR code on the
 * phone screen, a welcome confirmation badge, and sparkle/motion accents that
 * communicate instant enrollment. Uses only site design tokens (navy / gold /
 * success / card / border) and matches the flat illustration style of the
 * other How It Works step graphics.
 */
export function CustomerEnrollIllustration({ className }: { className?: string }) {
  return (
    <svg
      role="img"
      aria-label="Illustration of a hand holding a smartphone to scan a QR code, with a welcome confirmation and sparkle accents showing instant enrollment"
      viewBox="0 0 600 305"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      preserveAspectRatio="xMidYMid meet"
    >
      <title>
        Illustration of a hand holding a smartphone to scan a QR code, with a welcome confirmation
        and sparkle accents showing instant enrollment
      </title>

      {/* Backdrop panel */}
      <rect x="0" y="0" width="600" height="305" rx="16" fill="var(--navy-25)" />

      {/* Soft accent blobs */}
      <circle cx="80" cy="80" r="70" fill="var(--gold-50)" opacity="0.85" />
      <circle cx="530" cy="230" r="70" fill="var(--success-50)" opacity="0.75" />

      {/* Customer avatar (subtle, top-left) */}
      <g transform="translate(70 38)">
        <circle
          cx="36"
          cy="36"
          r="32"
          fill="var(--card)"
          stroke="var(--navy-100)"
          strokeWidth="1.5"
        />
        <circle cx="36" cy="30" r="20" fill="var(--navy-100)" opacity="0.6" />
        <path
          d="M16 22 C16 8, 56 8, 56 22 C56 14, 50 10, 36 10 C22 10, 16 14, 16 22"
          fill="var(--navy-800)"
        />
        <circle cx="28" cy="30" r="2.5" fill="var(--navy-900)" />
        <circle cx="44" cy="30" r="2.5" fill="var(--navy-900)" />
        <path
          d="M30 38 Q36 43 42 38"
          stroke="var(--navy-700)"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        <path d="M12 60 C12 46, 60 46, 60 60 V66 H12 Z" fill="var(--navy-700)" />
        <rect x="24" y="56" width="24" height="3" rx="1.5" fill="var(--gold-500)" />
      </g>

      {/* Hand holding phone (center-bottom) */}
      <g transform="translate(210 54)">
        {/* Phone shadow */}
        <rect
          x="18"
          y="18"
          width="104"
          height="184"
          rx="22"
          fill="var(--navy-900)"
          opacity="0.08"
        />

        {/* Phone frame */}
        <rect
          x="0"
          y="0"
          width="140"
          height="200"
          rx="22"
          fill="var(--navy-900)"
          stroke="var(--navy-200)"
          strokeWidth="1.5"
        />

        {/* Phone screen */}
        <rect x="10" y="10" width="120" height="180" rx="16" fill="var(--card)" />

        {/* Camera notch */}
        <rect x="50" y="10" width="40" height="6" rx="3" fill="var(--navy-900)" />

        {/* Phone status dots */}
        <circle cx="35" cy="28" r="3" fill="var(--navy-200)" />
        <circle cx="50" cy="28" r="3" fill="var(--gold-500)" />
        <circle cx="65" cy="28" r="3" fill="var(--success-500)" />

        {/* QR code on phone screen */}
        <g transform="translate(30 52)">
          <rect
            width="80"
            height="80"
            rx="10"
            fill="var(--navy-25)"
            stroke="var(--navy-100)"
            strokeWidth="1"
          />

          {/* QR position markers */}
          <rect x="10" y="10" width="20" height="20" rx="4" fill="var(--navy-900)" />
          <rect x="14" y="14" width="12" height="12" rx="2.5" fill="var(--navy-25)" />
          <rect x="17" y="17" width="6" height="6" rx="1.5" fill="var(--navy-900)" />

          <rect x="50" y="10" width="20" height="20" rx="4" fill="var(--navy-900)" />
          <rect x="54" y="14" width="12" height="12" rx="2.5" fill="var(--navy-25)" />
          <rect x="57" y="17" width="6" height="6" rx="1.5" fill="var(--navy-900)" />

          <rect x="10" y="50" width="20" height="20" rx="4" fill="var(--navy-900)" />
          <rect x="14" y="54" width="12" height="12" rx="2.5" fill="var(--navy-25)" />
          <rect x="17" y="57" width="6" height="6" rx="1.5" fill="var(--navy-900)" />

          {/* QR data modules */}
          <g fill="var(--navy-700)">
            <rect x="34" y="10" width="6" height="6" rx="1.5" />
            <rect x="34" y="22" width="6" height="6" rx="1.5" />
            <rect x="34" y="34" width="6" height="6" rx="1.5" />
            <rect x="34" y="46" width="6" height="6" rx="1.5" />
            <rect x="34" y="58" width="6" height="6" rx="1.5" />
            <rect x="34" y="70" width="6" height="6" rx="1.5" />

            <rect x="44" y="10" width="6" height="6" rx="1.5" />
            <rect x="52" y="18" width="6" height="6" rx="1.5" />
            <rect x="44" y="26" width="6" height="6" rx="1.5" />
            <rect x="52" y="34" width="6" height="6" rx="1.5" />
            <rect x="44" y="42" width="6" height="6" rx="1.5" />
            <rect x="52" y="50" width="6" height="6" rx="1.5" />
            <rect x="44" y="58" width="6" height="6" rx="1.5" />
            <rect x="52" y="66" width="6" height="6" rx="1.5" />

            <rect x="10" y="34" width="6" height="6" rx="1.5" />
            <rect x="18" y="42" width="6" height="6" rx="1.5" />
            <rect x="10" y="50" width="6" height="6" rx="1.5" />
            <rect x="18" y="58" width="6" height="6" rx="1.5" />
          </g>

          {/* Scan target frame */}
          <g
            stroke="var(--success-500)"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
            opacity="0.9"
          >
            <path d="M-6 18 L-6 -6 L18 -6" />
            <path d="M62 -6 L86 -6 L86 18" />
            <path d="M-6 62 L-6 86 L18 86" />
            <path d="M62 86 L86 86 L86 62" />
          </g>
        </g>

        {/* Welcome checkmark badge */}
        <g transform="translate(70 150)">
          <circle cx="0" cy="0" r="26" fill="var(--success-500)" />
          <path
            d="M-8 0 L-2 6 L8 -6"
            stroke="var(--card)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </g>
      </g>

      {/* Welcome speech bubble */}
      <g transform="translate(370 44)">
        <rect width="130" height="54" rx="16" fill="var(--success-500)" />
        <path d="M20 54 L12 66 L32 54 Z" fill="var(--success-500)" />
        <text
          x="65"
          y="26"
          textAnchor="middle"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="14"
          fontWeight="800"
          fill="var(--card)"
          letterSpacing="0.3"
        >
          Welcome!
        </text>
        <text
          x="65"
          y="44"
          textAnchor="middle"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="10"
          fontWeight="600"
          fill="var(--success-100)"
        >
          You're enrolled
        </text>
      </g>

      {/* In seconds badge */}
      <g transform="translate(440 230)">
        <rect width="100" height="32" rx="16" fill="var(--gold-500)" />
        <text
          x="50"
          y="21"
          textAnchor="middle"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="12"
          fontWeight="800"
          fill="var(--navy-900)"
          letterSpacing="0.3"
        >
          In seconds
        </text>
      </g>

      {/* Sparkle / speed accents */}
      <g fill="var(--gold-500)">
        <path d="M410 110 L413 118 L421 121 L413 124 L410 132 L407 124 L399 121 L407 118 Z" />
        <path d="M170 120 L172 126 L178 128 L172 130 L170 136 L168 130 L162 128 L168 126 Z" />
        <path d="M360 210 L362 216 L368 218 L362 220 L360 226 L358 220 L352 218 L358 216 Z" />
      </g>

      <g stroke="var(--gold-500)" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.8">
        <path d="M210 58 L218 54" />
        <path d="M210 240 L218 244" />
        <path d="M390 190 L398 190" />
      </g>

      {/* Motion arc from phone to confirmation */}
      <g
        stroke="var(--success-500)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="6 5"
        fill="none"
        opacity="0.6"
      >
        <path d="M350 130 Q380 120 410 100" />
        <path d="M350 170 Q380 180 410 200" />
      </g>
    </svg>
  );
}
