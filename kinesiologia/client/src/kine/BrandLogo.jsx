export default function BrandLogo({ variant = 'mark', size = 42, showText = false }) {
  const full = variant === 'full' || showText
  const width = full ? size * 4.1 : size
  const height = full ? size * 1.1 : size

  return (
    <svg width={width} height={height} viewBox={full ? '0 0 360 96' : '0 0 96 96'} fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="KinePlus">
      <defs>
        <linearGradient id="kineplusNavy" x1="8" y1="4" x2="88" y2="94" gradientUnits="userSpaceOnUse">
          <stop stopColor="#12324D" />
          <stop offset="1" stopColor="#0A5E78" />
        </linearGradient>
        <linearGradient id="kineplusTeal" x1="32" y1="28" x2="76" y2="74" gradientUnits="userSpaceOnUse">
          <stop stopColor="#42D6D0" />
          <stop offset="1" stopColor="#14AFAE" />
        </linearGradient>
      </defs>

      <rect x="4" y="4" width="88" height="88" rx="27" fill="url(#kineplusNavy)" />
      <path d="M29 22V74" stroke="white" strokeWidth="9" strokeLinecap="round" />
      <path d="M33 50L62 24" stroke="url(#kineplusTeal)" strokeWidth="10" strokeLinecap="round" />
      <path d="M35 49L67 73" stroke="url(#kineplusTeal)" strokeWidth="10" strokeLinecap="round" />
      <circle cx="66" cy="22" r="6" fill="white" opacity=".96" />
      <path d="M54 42L66 30" stroke="white" strokeWidth="3.5" strokeLinecap="round" opacity=".72" />

      {full && (
        <g transform="translate(112 0)">
          <text x="0" y="45" fill="#102A43" fontFamily="DM Sans, Arial, sans-serif" fontSize="36" fontWeight="800" letterSpacing="-1.4">Kine</text>
          <text x="76" y="45" fill="#0E8F9B" fontFamily="DM Sans, Arial, sans-serif" fontSize="36" fontWeight="800" letterSpacing="-1.4">Plus</text>
          <text x="1" y="70" fill="#668298" fontFamily="DM Sans, Arial, sans-serif" fontSize="11" fontWeight="700" letterSpacing="1.8">REHABILITACIÓN DIGITAL</text>
        </g>
      )}
    </svg>
  )
}
