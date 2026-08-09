/**
 * Custom SVG illustration for the "Choose Your Plan" step.
 * Uses the site's design tokens (navy / gold / success / card / border)
 * so it stays in sync with theme changes. Flat, friendly style to match
 * the About page's Mission illustration language.
 */
export function ChoosePlanIllustration({ className }: { className?: string }) {
  return (
    <svg
      role="img"
      aria-label="Illustration of a business owner selecting the Growth plan from three subscription tier options"
      viewBox="0 0 600 305"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      preserveAspectRatio="xMidYMid meet"
    >
      <title>
        Illustration of a business owner selecting the Growth plan from three
        subscription tier options
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
      <circle cx="70" cy="60" r="60" fill="var(--gold-50)" opacity="0.9" />
      <circle cx="540" cy="260" r="70" fill="var(--success-50)" opacity="0.8" />

      {/* --- Starter card (left) --- */}
      <g transform="translate(60 78)">
        <rect
          width="140"
          height="170"
          rx="12"
          fill="var(--card)"
          stroke="var(--navy-100)"
          strokeWidth="1.5"
        />
        <rect x="16" y="18" width="60" height="8" rx="4" fill="var(--navy-200)" />
        <rect x="16" y="36" width="40" height="6" rx="3" fill="var(--navy-100)" />
        {/* price */}
        <text
          x="16"
          y="78"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="22"
          fontWeight="700"
          fill="var(--navy-700)"
        >
          $19
        </text>
        {/* feature ticks */}
        <g fill="var(--navy-200)">
          <circle cx="22" cy="106" r="3" />
          <circle cx="22" cy="124" r="3" />
          <circle cx="22" cy="142" r="3" />
        </g>
        <g fill="var(--navy-100)">
          <rect x="32" y="102" width="80" height="6" rx="3" />
          <rect x="32" y="120" width="66" height="6" rx="3" />
          <rect x="32" y="138" width="74" height="6" rx="3" />
        </g>
      </g>

      {/* --- Growth card (middle, SELECTED) --- */}
      <g transform="translate(230 52)">
        {/* subtle glow */}
        <rect
          x="-6"
          y="-6"
          width="152"
          height="216"
          rx="16"
          fill="var(--gold-500)"
          opacity="0.12"
        />
        <rect
          width="140"
          height="204"
          rx="12"
          fill="var(--card)"
          stroke="var(--gold-500)"
          strokeWidth="2.5"
        />
        {/* "Most Popular" tag */}
        <g transform="translate(70 0)">
          <rect
            x="-38"
            y="-11"
            width="76"
            height="22"
            rx="11"
            fill="var(--gold-500)"
          />
          <text
            x="0"
            y="4"
            textAnchor="middle"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontSize="10"
            fontWeight="700"
            fill="var(--navy-900)"
            letterSpacing="0.5"
          >
            POPULAR
          </text>
        </g>

        <rect x="16" y="30" width="70" height="10" rx="5" fill="var(--navy-700)" />
        <rect x="16" y="50" width="48" height="6" rx="3" fill="var(--navy-200)" />

        <text
          x="16"
          y="96"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="26"
          fontWeight="800"
          fill="var(--navy-900)"
        >
          $49
        </text>

        {/* feature check rows */}
        <g>
          {[0, 1, 2].map((i) => (
            <g key={i} transform={`translate(16 ${122 + i * 22})`}>
              <circle cx="6" cy="6" r="7" fill="var(--success-500)" />
              <path
                d="M3 6.5 L5.2 8.6 L9.2 4.2"
                stroke="var(--card)"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <rect
                x="20"
                y="3"
                width={[86, 70, 78][i]}
                height="6"
                rx="3"
                fill="var(--navy-200)"
              />
            </g>
          ))}
        </g>

        {/* Selected radio badge (top-left) */}
        <g transform="translate(16 -12)">
          <circle
            cx="0"
            cy="0"
            r="11"
            fill="var(--success-500)"
            stroke="var(--card)"
            strokeWidth="2.5"
          />
          <path
            d="M-4.5 0.5 L-1.5 3.5 L4.5 -2.5"
            stroke="var(--card)"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </g>
      </g>

      {/* --- Premium card (right) --- */}
      <g transform="translate(400 78)">
        <rect
          width="140"
          height="170"
          rx="12"
          fill="var(--card)"
          stroke="var(--navy-100)"
          strokeWidth="1.5"
        />
        <rect x="16" y="18" width="70" height="8" rx="4" fill="var(--navy-200)" />
        <rect x="16" y="36" width="46" height="6" rx="3" fill="var(--navy-100)" />
        <text
          x="16"
          y="78"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="22"
          fontWeight="700"
          fill="var(--navy-700)"
        >
          $99
        </text>
        <g fill="var(--navy-200)">
          <circle cx="22" cy="106" r="3" />
          <circle cx="22" cy="124" r="3" />
          <circle cx="22" cy="142" r="3" />
        </g>
        <g fill="var(--navy-100)">
          <rect x="32" y="102" width="80" height="6" rx="3" />
          <rect x="32" y="120" width="66" height="6" rx="3" />
          <rect x="32" y="138" width="74" height="6" rx="3" />
        </g>
      </g>

      {/* --- Cursor / pointer selecting Growth card --- */}
      <g transform="translate(322 178)">
        {/* pointer shadow */}
        <ellipse cx="6" cy="42" rx="18" ry="4" fill="var(--navy-900)" opacity="0.08" />
        {/* arrow cursor */}
        <path
          d="M0 0 L0 34 L8.5 26 L14 38 L19 36 L13.5 24 L24 24 Z"
          fill="var(--navy-900)"
          stroke="var(--card)"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* click ring */}
        <circle
          cx="2"
          cy="2"
          r="14"
          fill="none"
          stroke="var(--gold-500)"
          strokeWidth="2"
          opacity="0.7"
        />
      </g>
    </svg>
  );
}
