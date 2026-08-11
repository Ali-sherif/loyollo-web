/**
 * Custom SVG illustration for the "Set Up Your Loyalty Program" step.
 * Visual metaphor: a small business owner configuring a loyalty program on a
 * simple dashboard-style panel — naming the program, setting reward tiers,
 * and generating a QR code. Uses only site design tokens (navy / gold / success
 * / card / border) and matches the flat, friendly illustration style of the
 * Choose Your Plan graphic.
 */
export function SetupProgramIllustration({ className }: { className?: string }) {
  return (
    <svg
      role="img"
      aria-label="Illustration of a business owner configuring a loyalty program on a simple dashboard panel with reward tiers, a QR code, and a points counter"
      viewBox="0 0 600 305"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      preserveAspectRatio="xMidYMid meet"
    >
      <title>
        Illustration of a business owner configuring a loyalty program on a simple dashboard panel
        with reward tiers, a QR code, and a points counter
      </title>

      {/* Backdrop panel */}
      <rect x="0" y="0" width="600" height="305" rx="16" fill="var(--navy-25)" />

      {/* Soft accent blobs */}
      <circle cx="540" cy="60" r="70" fill="var(--gold-50)" opacity="0.85" />
      <circle cx="70" cy="250" r="60" fill="var(--success-50)" opacity="0.75" />

      {/* === Small business owner character (left) === */}
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
        <path d="M14 118 V92 C14 76, 82 76, 82 92 V118 Z" fill="var(--navy-700)" />
        <path d="M28 118 V102 C28 94, 68 94, 68 102 V118 Z" fill="var(--card)" />
        <rect x="32" y="94" width="32" height="4" rx="2" fill="var(--gold-500)" />
        <rect x="32" y="102" width="24" height="4" rx="2" fill="var(--navy-200)" />
        {/* Arm pointing at panel */}
        <path
          d="M78 95 L110 88 L112 94"
          stroke="var(--navy-100)"
          strokeWidth="12"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="114" cy="92" r="7" fill="var(--navy-100)" />
      </g>

      {/* === Dashboard-style setup panel (right) === */}
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
        <rect x="0" y="0" width="380" height="44" rx="14" fill="var(--navy-900)" />
        <rect x="0" y="28" width="380" height="16" fill="var(--navy-900)" />
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
          Setup Wizard
        </text>

        {/* Program name field */}
        <g transform="translate(20 58)">
          <rect
            width="220"
            height="38"
            rx="8"
            fill="var(--navy-25)"
            stroke="var(--navy-100)"
            strokeWidth="1.5"
          />
          <rect x="12" y="11" width="90" height="8" rx="4" fill="var(--navy-200)" />
          <rect x="110" y="11" width="86" height="8" rx="4" fill="var(--gold-300)" />
          {/* cursor */}
          <rect x="200" y="10" width="2" height="14" rx="1" fill="var(--gold-500)">
            <animate attributeName="opacity" values="1;0;1" dur="1.1s" repeatCount="indefinite" />
          </rect>
        </g>

        {/* Points counter / progress bar */}
        <g transform="translate(20 108)">
          <rect
            width="220"
            height="44"
            rx="8"
            fill="var(--navy-25)"
            stroke="var(--navy-100)"
            strokeWidth="1.5"
          />
          <text
            x="12"
            y="18"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontSize="10"
            fontWeight="600"
            fill="var(--navy-500)"
          >
            Points per $1
          </text>
          <g transform="translate(12 26)">
            <rect width="196" height="10" rx="5" fill="var(--navy-100)" />
            <rect width="140" height="10" rx="5" fill="var(--success-500)" />
            <rect
              x="134"
              y="-5"
              width="20"
              height="20"
              rx="10"
              fill="var(--card)"
              stroke="var(--gold-500)"
              strokeWidth="2"
            />
            <text
              x="144"
              y="8"
              textAnchor="middle"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontSize="9"
              fontWeight="800"
              fill="var(--navy-900)"
            >
              1
            </text>
          </g>
        </g>

        {/* Reward tiers */}
        <g transform="translate(20 166)">
          <rect
            width="220"
            height="34"
            rx="8"
            fill="var(--gold-50)"
            stroke="var(--gold-200)"
            strokeWidth="1.5"
          />
          <circle cx="18" cy="17" r="9" fill="var(--gold-500)" />
          <text
            x="18"
            y="21"
            textAnchor="middle"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontSize="10"
            fontWeight="800"
            fill="var(--navy-900)"
          >
            1
          </text>
          <rect x="36" y="10" width="120" height="6" rx="3" fill="var(--navy-200)" />
          <rect x="36" y="20" width="80" height="6" rx="3" fill="var(--navy-100)" />
          <text
            x="202"
            y="21"
            textAnchor="end"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontSize="10"
            fontWeight="700"
            fill="var(--success-500)"
          >
            100 pts
          </text>
        </g>

        {/* QR code preview (stylized, not readable) */}
        <g transform="translate(260 58)">
          <rect
            width="100"
            height="100"
            rx="10"
            fill="var(--card)"
            stroke="var(--navy-200)"
            strokeWidth="1.5"
          />
          {/* QR position markers */}
          <rect x="12" y="12" width="24" height="24" rx="4" fill="var(--navy-900)" />
          <rect x="16" y="16" width="16" height="16" rx="3" fill="var(--card)" />
          <rect x="20" y="20" width="8" height="8" rx="2" fill="var(--navy-900)" />

          <rect x="64" y="12" width="24" height="24" rx="4" fill="var(--navy-900)" />
          <rect x="68" y="16" width="16" height="16" rx="3" fill="var(--card)" />
          <rect x="72" y="20" width="8" height="8" rx="2" fill="var(--navy-900)" />

          <rect x="12" y="64" width="24" height="24" rx="4" fill="var(--navy-900)" />
          <rect x="16" y="68" width="16" height="16" rx="3" fill="var(--card)" />
          <rect x="20" y="72" width="8" height="8" rx="2" fill="var(--navy-900)" />

          {/* QR data modules (abstract pattern) */}
          <g fill="var(--navy-700)">
            <rect x="44" y="12" width="8" height="8" rx="1.5" />
            <rect x="44" y="28" width="8" height="8" rx="1.5" />
            <rect x="44" y="44" width="8" height="8" rx="1.5" />
            <rect x="56" y="20" width="8" height="8" rx="1.5" />
            <rect x="56" y="36" width="8" height="8" rx="1.5" />
            <rect x="68" y="44" width="8" height="8" rx="1.5" />
            <rect x="80" y="56" width="8" height="8" rx="1.5" />
            <rect x="12" y="44" width="8" height="8" rx="1.5" />
            <rect x="24" y="52" width="8" height="8" rx="1.5" />
            <rect x="44" y="60" width="8" height="8" rx="1.5" />
            <rect x="56" y="68" width="8" height="8" rx="1.5" />
            <rect x="68" y="76" width="8" height="8" rx="1.5" />
            <rect x="80" y="80" width="8" height="8" rx="1.5" />
            <rect x="44" y="80" width="8" height="8" rx="1.5" />
            <rect x="24" y="76" width="8" height="8" rx="1.5" />
            <rect x="12" y="56" width="8" height="8" rx="1.5" />
            <rect x="80" y="44" width="8" height="8" rx="1.5" />
            <rect x="56" y="80" width="8" height="8" rx="1.5" />
          </g>

          {/* Scan badge */}
          <g transform="translate(62 88)">
            <rect x="0" y="0" width="44" height="18" rx="9" fill="var(--success-500)" />
            <text
              x="22"
              y="12.5"
              textAnchor="middle"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontSize="8"
              fontWeight="800"
              fill="var(--card)"
            >
              SCAN
            </text>
          </g>
        </g>

        {/* Reward badge / stamp */}
        <g transform="translate(260 172)">
          <circle
            cx="36"
            cy="34"
            r="30"
            fill="var(--card)"
            stroke="var(--gold-500)"
            strokeWidth="2"
          />
          <circle
            cx="36"
            cy="34"
            r="24"
            fill="none"
            stroke="var(--gold-300)"
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />
          <path
            d="M36 20 L39 29 L48 29 L41 35 L44 44 L36 39 L28 44 L31 35 L24 29 L33 29 Z"
            fill="var(--gold-500)"
          />
          <text
            x="36"
            y="54"
            textAnchor="middle"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontSize="8"
            fontWeight="800"
            fill="var(--navy-900)"
            letterSpacing="0.3"
          >
            REWARD
          </text>
        </g>

        {/* Active cursor on the panel */}
        <g transform="translate(210 76)">
          <ellipse cx="6" cy="38" rx="14" ry="3" fill="var(--navy-900)" opacity="0.08" />
          <path
            d="M0 0 L0 28 L6.5 21 L11 32 L16 30 L11 18 L20 18 Z"
            fill="var(--navy-900)"
            stroke="var(--card)"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </g>
      </g>

      {/* Floating status badge */}
      <g transform="translate(480 86)">
        <rect width="72" height="24" rx="12" fill="var(--success-500)" opacity="0.9" />
        <text
          x="36"
          y="16"
          textAnchor="middle"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="10"
          fontWeight="800"
          fill="var(--card)"
        >
          READY
        </text>
      </g>
    </svg>
  );
}
