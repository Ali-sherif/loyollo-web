/**
 * Custom SVG illustration for the "Reward Your Loyal Customers" step.
 * Visual metaphor: the same customer character from enrollment now holds a
 * smartphone showing a completed stamp card and a full progress bar, while a
 * merchant hand passes a gift-box reward across the counter. Sparkle accents
 * and a "Free Item!" badge communicate the payoff moment of the loyalty loop.
 * Uses only site design tokens (navy / gold / success / card / border) and
 * matches the flat illustration style of the other How It Works step graphics.
 */
export function RewardCustomersIllustration({
  className,
}: {
  className?: string;
}) {
  return (
    <svg
      role="img"
      aria-label="Illustration of a customer receiving a free gift-box reward after completing a filled stamp card on their phone at a business counter"
      viewBox="0 0 600 305"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      preserveAspectRatio="xMidYMid meet"
    >
      <title>
        Illustration of a customer receiving a free gift-box reward after
        completing a filled stamp card on their phone at a business counter
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
      <circle cx="90" cy="90" r="70" fill="var(--gold-50)" opacity="0.85" />
      <circle cx="510" cy="230" r="70" fill="var(--success-50)" opacity="0.75" />

      {/* Customer avatar (left, slightly above phone) */}
      <g transform="translate(70 38)">
        <circle cx="36" cy="36" r="32" fill="var(--card)" stroke="var(--navy-100)" strokeWidth="1.5" />
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
        <path
          d="M12 60 C12 46, 60 46, 60 60 V66 H12 Z"
          fill="var(--navy-700)"
        />
        <rect x="24" y="56" width="24" height="3" rx="1.5" fill="var(--gold-500)" />
      </g>

      {/* Hand / arm holding phone */}
      <g transform="translate(200 60)">
        {/* phone shadow */}
        <rect x="18" y="18" width="104" height="184" rx="22" fill="var(--navy-900)" opacity="0.08" />
        {/* Phone frame */}
        <rect x="0" y="0" width="140" height="200" rx="22" fill="var(--navy-900)" stroke="var(--navy-200)" strokeWidth="1.5" />
        {/* Screen */}
        <rect x="10" y="10" width="120" height="180" rx="16" fill="var(--card)" />
        {/* Notch */}
        <rect x="50" y="10" width="40" height="6" rx="3" fill="var(--navy-900)" />

        {/* App header on phone */}
        <g transform="translate(30 28)">
          <rect x="0" y="0" width="80" height="8" rx="4" fill="var(--gold-500)" opacity="0.3" />
          <rect x="10" y="12" width="60" height="6" rx="3" fill="var(--navy-200)" />
        </g>

        {/* Filled stamp card on phone screen */}
        <g transform="translate(22 58)">
          <rect width="96" height="74" rx="12" fill="var(--gold-50)" stroke="var(--gold-200)" strokeWidth="1.5" />
          <text
            x="48"
            y="20"
            textAnchor="middle"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontSize="10"
            fontWeight="700"
            fill="var(--navy-900)"
            letterSpacing="0.3"
          >
            Stamp Card
          </text>
          {/* Stamps row */}
          <g transform="translate(14 34)">
            {[0, 1, 2, 3, 4].map((i) => (
              <g key={i} transform={`translate(${i * 16} 0)`}>
                <circle cx="7" cy="7" r="7" fill="var(--navy-100)" />
                {i < 4 && (
                  <path
                    d="M7 1 L8.6 5.4 L13 5.4 L9.4 8.2 L10.8 12.6 L7 10 L3.2 12.6 L4.6 8.2 L1 5.4 L5.4 5.4 Z"
                    fill="var(--gold-500)"
                    transform="translate(-7 -7) scale(0.55)"
                  />
                )}
                {i === 4 && (
                  <>
                    <circle cx="7" cy="7" r="7" fill="var(--success-500)" />
                    <path
                      d="M4 7 L6 9 L10 5"
                      stroke="var(--card)"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  </>
                )}
              </g>
            ))}
          </g>
        </g>

        {/* 100% progress bar on phone screen */}
        <g transform="translate(22 144)">
          <rect width="96" height="34" rx="10" fill="var(--navy-25)" stroke="var(--navy-100)" strokeWidth="1.5" />
          <text
            x="48"
            y="14"
            textAnchor="middle"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontSize="9"
            fontWeight="700"
            fill="var(--navy-700)"
          >
            100 pts earned
          </text>
          <g transform="translate(10 20)">
            <rect width="76" height="8" rx="4" fill="var(--navy-100)" />
            <rect width="76" height="8" rx="4" fill="var(--success-500)" />
            <path
              d="M67 2 L70 5 L75 -1"
              stroke="var(--card)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </g>
        </g>
      </g>

      {/* Counter / till surface (right side) */}
      <g transform="translate(380 150)">
        {/* Counter top */}
        <rect x="0" y="80" width="200" height="18" rx="9" fill="var(--navy-200)" />
        {/* Counter body */}
        <rect x="10" y="98" width="180" height="64" rx="12" fill="var(--card)" stroke="var(--navy-100)" strokeWidth="1.5" />
        {/* Drawer lines */}
        <rect x="36" y="114" width="128" height="6" rx="3" fill="var(--navy-100)" />
        <rect x="36" y="130" width="96" height="6" rx="3" fill="var(--navy-100)" />
        {/* Small gold accent */}
        <circle cx="170" cy="138" r="8" fill="var(--gold-500)" />
      </g>

      {/* Merchant hand reaching across counter with gift */}
      <g transform="translate(400 80)">
        {/* Arm */}
        <path
          d="M120 80 Q80 70 40 60 L30 85 Q80 90 120 90 Z"
          fill="var(--navy-100)"
        />
        {/* Gift box */}
        <g transform="translate(8 32)">
          <rect x="0" y="10" width="44" height="34" rx="6" fill="var(--gold-500)" stroke="var(--gold-600)" strokeWidth="1.5" />
          <rect x="0" y="10" width="44" height="10" rx="6" fill="var(--gold-300)" />
          <rect x="19" y="10" width="6" height="34" rx="1" fill="var(--gold-600)" />
          <path
            d="M22 10 C22 4, 32 4, 32 10 C32 4, 42 4, 42 10"
            stroke="var(--gold-600)"
            strokeWidth="1.5"
            fill="none"
          />
          <path
            d="M22 10 C22 4, 12 4, 12 10 C12 4, 2 4, 2 10"
            stroke="var(--gold-600)"
            strokeWidth="1.5"
            fill="none"
          />
        </g>
        {/* Hand thumb */}
        <ellipse cx="30" cy="70" rx="14" ry="10" fill="var(--navy-100)" />
        <ellipse cx="22" cy="78" rx="8" ry="6" fill="var(--navy-200)" />
      </g>

      {/* Free Item badge floating near gift */}
      <g transform="translate(460 56)">
        <rect width="92" height="34" rx="17" fill="var(--success-500)" />
        <text
          x="46"
          y="22"
          textAnchor="middle"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="12"
          fontWeight="800"
          fill="var(--card)"
          letterSpacing="0.3"
        >
          Free Item!
        </text>
      </g>

      {/* Celebratory sparkles / confetti */}
      <g fill="var(--gold-500)">
        <path d="M150 30 L152 36 L158 38 L152 40 L150 46 L148 40 L142 38 L148 36 Z" />
        <path d="M480 40 L482 46 L488 48 L482 50 L480 56 L478 50 L472 48 L478 46 Z" />
        <path d="M430 200 L432 206 L438 208 L432 210 L430 216 L428 210 L422 208 L428 206 Z" />
      </g>
      <g
        stroke="var(--gold-500)"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        opacity="0.8"
      >
        <path d="M170 100 L178 96" />
        <path d="M380 120 L388 124" />
        <path d="M520 170 L528 170" />
      </g>

      {/* Confetti dots */}
      <g fill="var(--success-500)" opacity="0.85">
        <circle cx="140" cy="200" r="4" />
        <circle cx="540" cy="110" r="4" />
        <circle cx="360" cy="50" r="4" />
      </g>
      <g fill="var(--navy-500)" opacity="0.6">
        <circle cx="180" cy="220" r="3" />
        <circle cx="500" cy="80" r="3" />
        <circle cx="320" cy="40" r="3" />
      </g>

      {/* Echo of QR scan motif (dotted arc from phone to reward) */}
      <g
        stroke="var(--success-500)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="6 5"
        fill="none"
        opacity="0.5"
      >
        <path d="M350 180 Q390 160 430 120" />
      </g>
    </svg>
  );
}
