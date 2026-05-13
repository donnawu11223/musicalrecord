interface DefaultPosterProps {
  size?: number
  style?: React.CSSProperties
}

export default function DefaultPoster({ size = 100, style }: DefaultPosterProps) {
  return (
    <svg
      width={size}
      height={size * 1.33}
      viewBox="0 0 100 133"
      style={{ backgroundColor: '#e3e2e0', ...style }}
    >
      {/* 背景 */}
      <rect width="100" height="133" fill="#e3e2e0" />
      {/* 书本主体 */}
      <rect x="20" y="25" width="60" height="83" rx="4" fill="#c0c8c8" />
      {/* 书脊 */}
      <line x1="50" y1="25" x2="50" y2="108" stroke="#a8dadc" strokeWidth="2" />
      {/* 左页线条 */}
      <line x1="28" y1="40" x2="46" y2="40" stroke="#faf8f7" strokeWidth="2" />
      <line x1="28" y1="52" x2="46" y2="52" stroke="#faf8f7" strokeWidth="2" />
      <line x1="28" y1="64" x2="46" y2="64" stroke="#faf8f7" strokeWidth="2" />
      <line x1="28" y1="76" x2="46" y2="76" stroke="#faf8f7" strokeWidth="2" />
      {/* 右页线条 */}
      <line x1="54" y1="40" x2="72" y2="40" stroke="#faf8f7" strokeWidth="2" />
      <line x1="54" y1="52" x2="72" y2="52" stroke="#faf8f7" strokeWidth="2" />
      <line x1="54" y1="64" x2="72" y2="64" stroke="#faf8f7" strokeWidth="2" />
      <line x1="54" y1="76" x2="72" y2="76" stroke="#faf8f7" strokeWidth="2" />
    </svg>
  )
}
