/**
 * Custom SVG illustration for the "Track Growth & Optimize" step.
 * Visual metaphor: the same business-owner character from the setup step now
 * reviews a live dashboard with an upward-trending growth chart, a percentage
 * increase badge, and a magnifying cursor highlighting a key data point. The
 * chart is fuller and higher than the setup-step preview, reinforcing the
 * before-to-after narrative arc. Uses only site design tokens (navy / gold /
 * success / card / border) and matches the flat illustration style of the other
 * How It Works step graphics.
 */
export function TrackGrowthIllustration({
  className,
}: {
  className?: string;
}) {
  return (
    <svg
      role="img"
      aria-label="Illustration of a business owner reviewing a rising customer loyalty dashboard with a magnifying cursor on a key data point"
      viewBox="0 0 600 305"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      preserveAspectRatio="xMidYMid meet"
    >
      <title>
        Illustration of a business owner reviewing a rising customer loyalty
        dashboard with a magnifying cursor on a key data point
      </title>

      {/* Backdrop panel */}
      <rect
        x="0"
        y="0"
        width="600"
        height="305"
        rx="16"
        fill="var(--navy-25)"
      />

      {/* Soft accent blobs */}
      <circle cx="70" cy="70" r="70" fill="var(--gold-50)" opacity="0.85" />
      <circle cx="540" cy="250" r="60" fill="var(--success-50)" opacity="0.75" />

      {/* === Business owner character (left) === */}
      <g transform="translate(42 70)">
        {/* Head */}
        <circle cx="48" cy="36" r="26" fill="var(--gold-200)" opacity="0.5" />
        <circle cx="48" cy="36" r="26" fill="var(--navy-100)" opacity="0.6" />
        {/* Hair */}
        <path
          d="M22 28 C22 10, 74 10, 74 28 C74 20, 68 14, 48 14 C28 14, 22 20, 22 28"
          fill="var(--navy-800)"
        />
        {/* Eyes */}
        <circle cx="40" cy="36" r="2.5" fill="var(--navy-900)" />
        <circle cx="56" cy="36" r="2.5" fill="var(--navy-900)" />
        {/* Smile */}
        <path
          d="M42 44 Q48 49 54 44"
          stroke="var(--navy-700)"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        {/* Body / apron */}
        <path
          d="M14 118 V92 C14 76, 82 76, 82 92 V118 Z"
          fill="var(--navy-700)"
        />
        <path
          d="M28 118 V102 C28 94, 68 94, 68 102 V118 Z"
          fill="var(--card)"
        />
        <rect x="32" y="94" width="32" height="4" rx="2" fill="var(--gold-500)" />
        <rect x="32" y="102" width="24" height="4" rx="2" fill="var(--navy-200)" />
        {/* Arm pointing at dashboard */}
        <path
          d="M78 95 L110 88 L112 94"
          stroke="var(--navy-100)"
          strokeWidth="12"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="114" cy="92" r="7" fill="var(--navy-100)" />
      </g>

      {/* === Dashboard panel (right) === */}
      <g transform="translate(170 48)">
        {/* Panel frame */}
        <rect
          width="380"
          height="215"
          rx="14"
          fill="var(--card)"
          stroke="var(--navy-100)"
          strokeWidth="1.5"
        />

        {/* Panel header */}
        <rect
          x="0"
          y="0"
          width="380"
          height="44"
          rx="14"
          fill="var(--navy-900)"
        />
        <rect
          x="0"
          y="28"
          width="380"
          height="16"
          fill="var(--navy-900)"
        />
        <circle cx="22" cy="22" r="7" fill="var(--gold-500)" />
        <circle cx="42" cy="22" r="7" fill="var(--navy-300)" />
        <circle cx="62" cy="22" r="7" fill="var(--success-500)" />
        <text
          x="344"
          y="26"
          textAnchor="end"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="12"
          fontWeight="700"
          fill="var(--card)"
          letterSpacing="0.3"
        >
          Analytics
        </text>

        {/* KPI cards row */}
        <g transform="translate(20 58)">
          <rect width="108" height="48" rx="10" fill="var(--navy-25)" stroke="var(--navy-100)" strokeWidth="1.5" />
          <rect x="12" y="10" width="40" height="6" rx="3" fill="var(--navy-200)" />
          <text
            x="12"
            y="32"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontSize="16"
            fontWeight="800"
            fill="var(--navy-900)"
          >
            1.2k
          </text>
          <rect x="62" y="26" width="34" height="16" rx="8" fill="var(--success-500)" />
          <text
            x="79"
            y="38"
            textAnchor="middle"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontSize="9"
            fontWeight="800"
            fill="var(--card)"
          >
            +32%
          </text>
        </g>

        <g transform="translate(140 58)">
          <rect width="108" height="48" rx="10" fill="var(--navy-25)" stroke="var(--navy-100)" strokeWidth="1.5" />
          <rect x="12" y="10" width="50" height="6" rx="3" fill="var(--navy-200)" />
          <text
            x="12"
            y="32"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontSize="16"
            fontWeight="800"
            fill="var(--navy-900)"
          >
            8.4
          </text>
          <rect x="62" y="26" width="34" height="16" rx="8" fill="var(--success-500)" />
          <text
            x="79"
            y="38"
            textAnchor="middle"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontSize="9"
            fontWeight="800"
            fill="var(--card)"
          >
            +12%
          </text>
        </g>

        <g transform="translate(260 58)">
          <rect width="100" height="48" rx="10" fill="var(--gold-50)" stroke="var(--gold-200)" strokeWidth="1.5" />
          <rect x="12" y="10" width="36" height="6" rx="3" fill="var(--gold-300)" />
          <text
            x="12"
            y="32"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontSize="16"
            fontWeight="800"
            fill="var(--navy-900)"
          >
            92%
          </text>
          <text
            x="82"
            y="32"
            textAnchor="end"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontSize="10"
            fontWeight="700"
            fill="var(--success-500)"
          >
            ↑
          </text>
        </g>

        {/* Chart card */}
        <g transform="translate(20 120)">
          <rect width="340" height="80" rx="12" fill="var(--navy-25)" stroke="var(--navy-100)" strokeWidth="1.5" />
          {/* Axis lines */}
          <g
            stroke="var(--navy-100)"
            strokeWidth="1"
            strokeLinecap="round"
            fill="none"
          >
            <path d="M20 60 H320" />
            <path d="M20 60 V20" />
          </g>

          {/* Bar chart columns */}
          <g transform="translate(36 22)">
            {[24, 36, 28, 44, 32, 54].map((h, i) => (
              <rect
                key={i}
                x={i * 42}
                y={40 - h}
                width="28"
                height={h}
                rx="4"
                fill={i === 5 ? "var(--success-500)" : "var(--navy-200)"}
              />
            ))}
          </g>

          {/* Upward trend line */}
          <g
            stroke="var(--gold-500)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          >
            <path d="M40 58 L82 46 L124 50 L166 34 L208 38 L250 22 L292 16" />
          </g>

          {/* Trend line dots */}
          <g fill="var(--gold-500)">
            <circle cx="40" cy="58" r="4" />
            <circle cx="82" cy="46" r="4" />
            <circle cx="124" cy="50" r="4" />
            <circle cx="166" cy="34" r="4" />
            <circle cx="208" cy="38" r="4" />
            <circle cx="250" cy="22" r="4" />
            <circle cx="292" cy="16" r="4" />
          </g>

          {/* Highlighted data point (last) */}
          <g>
            <circle cx="292" cy="16" r="8" fill="var(--success-500)" opacity="0.25" />
            <circle cx="292" cy="16" r="5" fill="var(--success-500)" />
          </g>
        </g>
      </g>

      {/* Magnifying cursor pointing at the last data point */}
      <g transform="translate(460 166)">
        {/* cursor shadow */}
        <ellipse cx="6" cy="42" rx="14" ry="3" fill="var(--navy-900)" opacity="0.08" />
        {/* arrow cursor */}
        <path
          d="M0 0 L0 28 L6.5 21 L11 32 L16 30 L11 18 L20 18 Z"
          fill="var(--navy-900)"
          stroke="var(--card)"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* magnifying ring */}
        <circle
          cx="22"
          cy="18"
          r="14"
          fill="none"
          stroke="var(--gold-500)"
          strokeWidth="2.5"
          opacity="0.7"
        />
        <line
          x1="32"
          y1="28"
          x2="42"
          y2="40"
          stroke="var(--gold-500)"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.7"
        />
      </g>

      {/* Floating optimize badge */}
      <g transform="translate(480 86)">
        <rect width="76" height="24" rx="12" fill="var(--success-500)" opacity="0.9" />
        <text
          x="38"
          y="16"
          textAnchor="middle"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="10"
          fontWeight="800"
          fill="var(--card)"
          letterSpacing="0.3"
        >
          GROWING
        </text>
      </g>

      {/* Sparkle / motion accents */}
      <g fill="var(--gold-500)">
        <path d="M150 30 L152 36 L158 38 L152 40 L150 46 L148 40 L142 38 L148 36 Z" />
        <path d="M360 210 L362 216 L368 218 L362 220 L360 226 L358 220 L352 218 L358 216 Z" />
      </g>
      <g
        stroke="var(--gold-500)"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        opacity="0.8"
      >
        <path d="M170 100 L178 96" />
        <path d="M390 190 L398 190" />
      </g>
    </svg>
  );
}
