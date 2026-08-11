/**
 * Custom SVG illustration for the "Generate & Place Your QR Code" step.
 * Visual metaphor: a centered, decorative QR code with a "Place at checkout"
 * tag above it, a "SCAN ME" tag underneath, and radiating scan lines to show
 * it is ready for customers to scan.
 * Uses only site design tokens (navy / gold / success / card / border) and
 * matches the flat illustration style of the Choose Your Plan and Set Up Your
 * Loyalty Program graphics.
 */
export function QrCodeIllustration({ className }: { className?: string }) {
  return (
    <svg
      role="img"
      aria-label="Illustration of a QR code with a place at checkout tag above it and a scan me tag below, ready for customers to scan at checkout"
      viewBox="0 0 600 305"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      preserveAspectRatio="xMidYMid meet"
    >
      <title>
        Illustration of a QR code with a place at checkout tag above it and a scan me tag below,
        ready for customers to scan at checkout
      </title>

      {/* Backdrop panel */}
      <rect x="0" y="0" width="600" height="305" rx="16" fill="var(--navy-25)" />

      {/* Soft accent blobs */}
      <circle cx="80" cy="80" r="70" fill="var(--gold-50)" opacity="0.85" />
      <circle cx="520" cy="240" r="60" fill="var(--success-50)" opacity="0.75" />

      {/* QR code shadow */}
      <ellipse cx="300" cy="252" rx="100" ry="12" fill="var(--navy-900)" opacity="0.08" />

      {/* Place at checkout tag */}
      <g transform="translate(230 18)">
        <rect width="140" height="30" rx="15" fill="var(--navy-900)" />
        <text
          x="70"
          y="19"
          textAnchor="middle"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="12"
          fontWeight="700"
          fill="var(--gold-500)"
          letterSpacing="0.3"
        >
          Place at checkout
        </text>
      </g>

      {/* QR code centered */}
      <g transform="translate(210 60)">
        {/* QR position markers (simplified, decorative) */}
        <rect x="20" y="20" width="34" height="34" rx="6" fill="var(--navy-900)" />
        <rect x="26" y="26" width="22" height="22" rx="4.5" fill="var(--navy-25)" />
        <rect x="31" y="31" width="12" height="12" rx="3" fill="var(--navy-900)" />

        <rect x="126" y="20" width="34" height="34" rx="6" fill="var(--navy-900)" />
        <rect x="132" y="26" width="22" height="22" rx="4.5" fill="var(--navy-25)" />
        <rect x="137" y="31" width="12" height="12" rx="3" fill="var(--navy-900)" />

        <rect x="20" y="126" width="34" height="34" rx="6" fill="var(--navy-900)" />
        <rect x="26" y="132" width="22" height="22" rx="4.5" fill="var(--navy-25)" />
        <rect x="31" y="137" width="12" height="12" rx="3" fill="var(--navy-900)" />

        {/* Decorative data modules */}
        <g fill="var(--navy-700)">
          <rect x="64" y="20" width="12" height="12" rx="2.5" />
          <rect x="64" y="40" width="12" height="12" rx="2.5" />
          <rect x="64" y="64" width="12" height="12" rx="2.5" />
          <rect x="64" y="88" width="12" height="12" rx="2.5" />
          <rect x="64" y="112" width="12" height="12" rx="2.5" />
          <rect x="64" y="136" width="12" height="12" rx="2.5" />

          <rect x="90" y="20" width="12" height="12" rx="2.5" />
          <rect x="102" y="37" width="12" height="12" rx="2.5" />
          <rect x="90" y="54" width="12" height="12" rx="2.5" />
          <rect x="102" y="71" width="12" height="12" rx="2.5" />
          <rect x="90" y="88" width="12" height="12" rx="2.5" />
          <rect x="102" y="105" width="12" height="12" rx="2.5" />
          <rect x="90" y="122" width="12" height="12" rx="2.5" />
          <rect x="102" y="139" width="12" height="12" rx="2.5" />

          <rect x="126" y="64" width="12" height="12" rx="2.5" />
          <rect x="138" y="82" width="12" height="12" rx="2.5" />
          <rect x="126" y="100" width="12" height="12" rx="2.5" />
          <rect x="138" y="118" width="12" height="12" rx="2.5" />
          <rect x="126" y="136" width="12" height="12" rx="2.5" />
          <rect x="138" y="148" width="12" height="12" rx="2.5" />

          <rect x="20" y="64" width="12" height="12" rx="2.5" />
          <rect x="37" y="82" width="12" height="12" rx="2.5" />
          <rect x="20" y="100" width="12" height="12" rx="2.5" />
          <rect x="37" y="118" width="12" height="12" rx="2.5" />
          <rect x="20" y="136" width="12" height="12" rx="2.5" />
          <rect x="37" y="148" width="12" height="12" rx="2.5" />
        </g>

        {/* Logo mark at center of QR code */}
        <circle cx="90" cy="90" r="22" fill="var(--gold-500)" />
        <path
          d="M80 90 L86 96 L100 84"
          stroke="var(--card)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </g>

      {/* SCAN ME tag under the QR code */}
      <g transform="translate(250 262)">
        <rect width="100" height="30" rx="15" fill="var(--gold-500)" />
        <text
          x="50"
          y="19"
          textAnchor="middle"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="12"
          fontWeight="800"
          fill="var(--navy-900)"
          letterSpacing="0.5"
        >
          SCAN ME
        </text>
      </g>

      {/* Radiating scan indicator lines */}
      <g
        stroke="var(--success-500)"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
        opacity="0.85"
      >
        <path d="M410 108 Q470 68 520 48" />
        <path d="M410 150 Q485 138 540 128" />
        <path d="M410 193 Q470 213 520 243" />
        <path d="M190 108 Q130 68 80 48" />
        <path d="M190 150 Q115 138 60 128" />
        <path d="M190 193 Q130 213 80 243" />
      </g>
      {/* Scan glow dots */}
      <g fill="var(--success-500)">
        <circle cx="520" cy="48" r="5" />
        <circle cx="540" cy="128" r="5" />
        <circle cx="520" cy="243" r="5" />
        <circle cx="80" cy="48" r="5" />
        <circle cx="60" cy="128" r="5" />
        <circle cx="80" cy="243" r="5" />
      </g>
    </svg>
  );
}
